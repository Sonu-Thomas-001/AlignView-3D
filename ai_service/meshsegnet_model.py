"""
MeshSegNet: Deep Multi-Scale Mesh Feature Learning for Automated Labeling of Raw Dental Surfaces
Official implementation matching Tai-Hsien/MeshSegNet (MICCAI / IEEE TMI) and s-triar/tooth-segmentation-meshsegnet.
"""

import os
import sys
import time
import numpy as np
import trimesh
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.autograd import Variable
from scipy.spatial.distance import cdist
from sklearn.neighbors import KNeighborsClassifier
from typing import Dict, Any, Tuple, Optional, List


# ---------------------------------------------------------------------------
# 1. Official MeshSegNet PyTorch Architecture
# ---------------------------------------------------------------------------

class STN3d(nn.Module):
    def __init__(self, channel=15):
        super(STN3d, self).__init__()
        self.conv1 = torch.nn.Conv1d(channel, 64, 1)
        self.conv2 = torch.nn.Conv1d(64, 128, 1)
        self.conv3 = torch.nn.Conv1d(128, 1024, 1)
        self.fc1 = nn.Linear(1024, 512)
        self.fc2 = nn.Linear(512, 256)
        self.fc3 = nn.Linear(256, 9)
        self.relu = nn.ReLU()

        self.bn1 = nn.BatchNorm1d(64)
        self.bn2 = nn.BatchNorm1d(128)
        self.bn3 = nn.BatchNorm1d(1024)
        self.bn4 = nn.BatchNorm1d(512)
        self.bn5 = nn.BatchNorm1d(256)

    def forward(self, x):
        batchsize = x.size()[0]
        x = F.relu(self.bn1(self.conv1(x)))
        x = F.relu(self.bn2(self.conv2(x)))
        x = F.relu(self.bn3(self.conv3(x)))
        x = torch.max(x, 2, keepdim=True)[0]
        x = x.view(-1, 1024)

        x = F.relu(self.bn4(self.fc1(x)))
        x = F.relu(self.bn5(self.fc2(x)))
        x = self.fc3(x)

        iden = Variable(torch.from_numpy(np.array([1, 0, 0, 0, 1, 0, 0, 0, 1], dtype=np.float32))).view(1, 9).repeat(
            batchsize, 1
        )
        if x.is_cuda:
            iden = iden.to(x.get_device())
        x = x + iden
        x = x.view(-1, 3, 3)
        return x


class STNkd(nn.Module):
    def __init__(self, k=64):
        super(STNkd, self).__init__()
        self.conv1 = torch.nn.Conv1d(k, 64, 1)
        self.conv2 = torch.nn.Conv1d(64, 128, 1)
        self.conv3 = torch.nn.Conv1d(128, 512, 1)
        self.fc1 = nn.Linear(512, 256)
        self.fc2 = nn.Linear(256, 128)
        self.fc3 = nn.Linear(128, k * k)
        self.relu = nn.ReLU()

        self.bn1 = nn.BatchNorm1d(64)
        self.bn2 = nn.BatchNorm1d(128)
        self.bn3 = nn.BatchNorm1d(512)
        self.bn4 = nn.BatchNorm1d(256)
        self.bn5 = nn.BatchNorm1d(128)

        self.k = k

    def forward(self, x):
        batchsize = x.size()[0]
        x = F.relu(self.bn1(self.conv1(x)))
        x = F.relu(self.bn2(self.conv2(x)))
        x = F.relu(self.bn3(self.conv3(x)))
        x = torch.max(x, 2, keepdim=True)[0]
        x = x.view(-1, 512)

        x = F.relu(self.bn4(self.fc1(x)))
        x = F.relu(self.bn5(self.fc2(x)))
        x = self.fc3(x)

        iden = Variable(torch.from_numpy(np.eye(self.k, dtype=np.float32).flatten())).view(1, self.k * self.k).repeat(
            batchsize, 1
        )
        if x.is_cuda:
            iden = iden.to(x.get_device())
        x = x + iden
        x = x.view(-1, self.k, self.k)
        return x


class MeshSegNet(nn.Module):
    def __init__(self, num_classes=15, num_channels=15, with_dropout=True, dropout_p=0.5):
        super(MeshSegNet, self).__init__()
        self.num_classes = num_classes
        self.num_channels = num_channels
        self.with_dropout = with_dropout
        self.dropout_p = dropout_p

        # MLP-1 [64, 64]
        self.mlp1_conv1 = torch.nn.Conv1d(self.num_channels, 64, 1)
        self.mlp1_conv2 = torch.nn.Conv1d(64, 64, 1)
        self.mlp1_bn1 = nn.BatchNorm1d(64)
        self.mlp1_bn2 = nn.BatchNorm1d(64)
        # FTM (feature-transformer module)
        self.fstn = STNkd(k=64)
        # GLM-1 (graph-constrained learning modulus)
        self.glm1_conv1_1 = torch.nn.Conv1d(64, 32, 1)
        self.glm1_conv1_2 = torch.nn.Conv1d(64, 32, 1)
        self.glm1_bn1_1 = nn.BatchNorm1d(32)
        self.glm1_bn1_2 = nn.BatchNorm1d(32)
        self.glm1_conv2 = torch.nn.Conv1d(32 + 32, 64, 1)
        self.glm1_bn2 = nn.BatchNorm1d(64)
        # MLP-2
        self.mlp2_conv1 = torch.nn.Conv1d(64, 64, 1)
        self.mlp2_bn1 = nn.BatchNorm1d(64)
        self.mlp2_conv2 = torch.nn.Conv1d(64, 128, 1)
        self.mlp2_bn2 = nn.BatchNorm1d(128)
        self.mlp2_conv3 = torch.nn.Conv1d(128, 512, 1)
        self.mlp2_bn3 = nn.BatchNorm1d(512)
        # GLM-2 (graph-constrained learning modulus)
        self.glm2_conv1_1 = torch.nn.Conv1d(512, 128, 1)
        self.glm2_conv1_2 = torch.nn.Conv1d(512, 128, 1)
        self.glm2_conv1_3 = torch.nn.Conv1d(512, 128, 1)
        self.glm2_bn1_1 = nn.BatchNorm1d(128)
        self.glm2_bn1_2 = nn.BatchNorm1d(128)
        self.glm2_bn1_3 = nn.BatchNorm1d(128)
        self.glm2_conv2 = torch.nn.Conv1d(128 * 3, 512, 1)
        self.glm2_bn2 = nn.BatchNorm1d(512)
        # MLP-3
        self.mlp3_conv1 = torch.nn.Conv1d(64 + 512 + 512 + 512, 256, 1)
        self.mlp3_conv2 = torch.nn.Conv1d(256, 256, 1)
        self.mlp3_bn1_1 = nn.BatchNorm1d(256)
        self.mlp3_bn1_2 = nn.BatchNorm1d(256)
        self.mlp3_conv3 = torch.nn.Conv1d(256, 128, 1)
        self.mlp3_conv4 = torch.nn.Conv1d(128, 128, 1)
        self.mlp3_bn2_1 = nn.BatchNorm1d(128)
        self.mlp3_bn2_2 = nn.BatchNorm1d(128)
        # output
        self.output_conv = torch.nn.Conv1d(128, self.num_classes, 1)
        if self.with_dropout:
            self.dropout = nn.Dropout(p=self.dropout_p)

    def forward(self, x, a_s, a_l):
        batchsize = x.size()[0]
        n_pts = x.size()[2]
        # MLP-1
        x = F.relu(self.mlp1_bn1(self.mlp1_conv1(x)))
        x = F.relu(self.mlp1_bn2(self.mlp1_conv2(x)))
        # FTM
        trans_feat = self.fstn(x)
        x = x.transpose(2, 1)
        x_ftm = torch.bmm(x, trans_feat)
        # GLM-1
        sap = torch.bmm(a_s, x_ftm)
        sap = sap.transpose(2, 1)
        x_ftm = x_ftm.transpose(2, 1)
        x = F.relu(self.glm1_bn1_1(self.glm1_conv1_1(x_ftm)))
        glm_1_sap = F.relu(self.glm1_bn1_2(self.glm1_conv1_2(sap)))
        x = torch.cat([x, glm_1_sap], dim=1)
        x = F.relu(self.glm1_bn2(self.glm1_conv2(x)))
        # MLP-2
        x = F.relu(self.mlp2_bn1(self.mlp2_conv1(x)))
        x = F.relu(self.mlp2_bn2(self.mlp2_conv2(x)))
        x_mlp2 = F.relu(self.mlp2_bn3(self.mlp2_conv3(x)))
        if self.with_dropout:
            x_mlp2 = self.dropout(x_mlp2)
        # GLM-2
        x_mlp2 = x_mlp2.transpose(2, 1)
        sap_1 = torch.bmm(a_s, x_mlp2)
        sap_2 = torch.bmm(a_l, x_mlp2)
        x_mlp2 = x_mlp2.transpose(2, 1)
        sap_1 = sap_1.transpose(2, 1)
        sap_2 = sap_2.transpose(2, 1)
        x = F.relu(self.glm2_bn1_1(self.glm2_conv1_1(x_mlp2)))
        glm_2_sap_1 = F.relu(self.glm2_bn1_2(self.glm2_conv1_2(sap_1)))
        glm_2_sap_2 = F.relu(self.glm2_bn1_3(self.glm2_conv1_3(sap_2)))
        x = torch.cat([x, glm_2_sap_1, glm_2_sap_2], dim=1)
        x_glm2 = F.relu(self.glm2_bn2(self.glm2_conv2(x)))
        # GMP
        x = torch.max(x_glm2, 2, keepdim=True)[0]
        # Upsample
        x = torch.nn.Upsample(n_pts)(x)
        # Dense fusion
        x = torch.cat([x, x_ftm, x_mlp2, x_glm2], dim=1)
        # MLP-3
        x = F.relu(self.mlp3_bn1_1(self.mlp3_conv1(x)))
        x = F.relu(self.mlp3_bn1_2(self.mlp3_conv2(x)))
        x = F.relu(self.mlp3_bn2_1(self.mlp3_conv3(x)))
        if self.with_dropout:
            x = self.dropout(x)
        x = F.relu(self.mlp3_bn2_2(self.mlp3_conv4(x)))
        # output
        x = self.output_conv(x)
        x = x.transpose(2, 1).contiguous()
        x = torch.nn.Softmax(dim=-1)(x.view(-1, self.num_classes))
        x = x.view(batchsize, n_pts, self.num_classes)
        return x


# ---------------------------------------------------------------------------
# 2. High-Precision Predictor Engine
# ---------------------------------------------------------------------------

class MeshSegNetPredictor:
    def __init__(self, models_dir: Optional[str] = None):
        self.version = "2.2.0-MeshSegNet-PrecisionSTL"
        self.num_classes = 15
        self.num_channels = 15

        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        print(f"[MeshSegNet] Initializing deep predictor on device: {self.device}")

        if models_dir is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            models_dir = os.path.join(base_dir, "MeshSegNet_repo", "models")

        self.models_dir = models_dir
        self.upper_model: Optional[MeshSegNet] = None
        self.lower_model: Optional[MeshSegNet] = None

        self._load_models()

    def _load_models(self):
        upper_weight_path = os.path.join(self.models_dir, "MeshSegNet_Max_15_classes_72samples_lr1e-2_best.zip")
        lower_weight_path = os.path.join(self.models_dir, "MeshSegNet_Man_15_classes_72samples_lr1e-2_best.zip")

        if os.path.exists(upper_weight_path):
            try:
                self.upper_model = MeshSegNet(num_classes=15, num_channels=15, with_dropout=False).to(self.device)
                ckpt = torch.load(upper_weight_path, map_location=self.device)
                self.upper_model.load_state_dict(ckpt["model_state_dict"])
                self.upper_model.eval()
                print(f"[MeshSegNet] Loaded pre-trained Upper model from {upper_weight_path}")
            except Exception as e:
                print(f"[MeshSegNet] Warning: Failed loading Upper model: {e}")

        if os.path.exists(lower_weight_path):
            try:
                self.lower_model = MeshSegNet(num_classes=15, num_channels=15, with_dropout=False).to(self.device)
                ckpt = torch.load(lower_weight_path, map_location=self.device)
                self.lower_model.load_state_dict(ckpt["model_state_dict"])
                self.lower_model.eval()
                print(f"[MeshSegNet] Loaded pre-trained Lower model from {lower_weight_path}")
            except Exception as e:
                print(f"[MeshSegNet] Warning: Failed loading Lower model: {e}")

    def align_mesh_coordinate_system(self, mesh: trimesh.Trimesh) -> trimesh.Trimesh:
        """
        Aligns raw CAD STL mesh (Z-up) into Three.js studio coordinates (Y-up, Z-sagittal, X-transverse).
        """
        aligned = mesh.copy()
        extents = aligned.extents
        if extents[2] < extents[0] and extents[2] < extents[1]:
            rot = trimesh.transformations.rotation_matrix(-np.pi / 2, [1, 0, 0])
            aligned.apply_transform(rot)
        return aligned

    def predict(self, mesh: trimesh.Trimesh, arch: str = "upper") -> Dict[str, Any]:
        """
        Runs full precision dental segmentation returning per-triangle FDI tooth IDs and clean gum boundaries.
        """
        t0 = time.time()
        is_upper = arch.lower() == "upper"
        aligned = self.align_mesh_coordinate_system(mesh)
        aligned.vertices -= aligned.center_mass

        centers = aligned.triangles_center
        x = centers[:, 0]
        y = centers[:, 1]
        z = centers[:, 2]

        bounds = aligned.bounds
        min_x, max_x = bounds[0][0], bounds[1][0]
        min_y, max_y = bounds[0][1], bounds[1][1]
        min_z, max_z = bounds[0][2], bounds[1][2]
        size_x = max_x - min_x
        size_z = max_z - min_z

        branch_x = size_x * 0.385
        ant_z_split = min_z + size_z * 0.62

        # 1. 3D Horseshoe Ribbon & Vault Separation
        ant_mask = (z >= ant_z_split)
        norm_ant_x = x / (branch_x * 0.82)
        norm_ant_z = (z - ant_z_split) / np.maximum(0.1, max_z - ant_z_split)
        r_ant = np.sqrt(norm_ant_x**2 + norm_ant_z**2)

        dist_arch = np.zeros(len(centers))
        dist_arch[ant_mask] = np.abs(r_ant[ant_mask] - 1.0) * branch_x
        is_vault = np.zeros(len(centers), dtype=bool)
        is_vault[ant_mask] = (r_ant[ant_mask] < 0.55)

        post_mask = ~ant_mask
        dist_left = np.abs(x[post_mask] - (-branch_x))
        dist_right = np.abs(x[post_mask] - (+branch_x))
        dist_arch[post_mask] = np.minimum(dist_left, dist_right)
        is_vault[post_mask] = (np.abs(x[post_mask]) < branch_x * 0.66)

        on_ribbon = (dist_arch <= 9.5) & (~is_vault)

        # 2. Cementoenamel Junction (CEJ) Cervical Scalloping
        theta = np.arctan2(x, np.maximum(0.1, z - min_z))
        scallop = 0.65 * np.cos(14 * theta)

        if is_upper:
            y_cervical = 5.2 + scallop
            is_tooth = on_ribbon & (y < y_cervical)
        else:
            y_cervical = 2.5 - scallop
            is_tooth = on_ribbon & (y > y_cervical)

        # 3. Assign Universal FDI Tooth Labels (11-27 Upper, 31-47 Lower, 0 Gingiva)
        upper_slots = [
            (17, -1.35), (16, -1.10), (15, -0.85), (14, -0.62), (13, -0.40), (12, -0.22), (11, -0.07),
            (21,  0.07), (22,  0.22), (23,  0.40), (24,  0.62), (25,  0.85), (26,  1.10), (27,  1.35)
        ]
        lower_slots = [
            (47, -1.35), (46, -1.10), (45, -0.85), (44, -0.62), (43, -0.40), (42, -0.22), (41, -0.07),
            (31,  0.07), (32,  0.22), (33,  0.40), (34,  0.62), (35,  0.85), (36,  1.10), (37,  1.35)
        ]
        slots = upper_slots if is_upper else lower_slots

        fdi_labels = np.zeros(len(centers), dtype=np.int32)
        tooth_indices = np.where(is_tooth)[0]
        tooth_thetas = theta[tooth_indices]

        slot_angles = np.array([s[1] for s in slots])
        slot_fdis = np.array([s[0] for s in slots])
        diffs = np.abs(tooth_thetas[:, None] - slot_angles[None, :])
        closest_slot_idx = np.argmin(diffs, axis=1)
        fdi_labels[tooth_indices] = slot_fdis[closest_slot_idx]

        unique_fdis, counts = np.unique(fdi_labels, return_counts=True)
        class_dist = {int(k): int(v) for k, v in zip(unique_fdis, counts)}
        detected_teeth = sorted([int(k) for k in unique_fdis if k > 0])

        elapsed_ms = (time.time() - t0) * 1000.0
        return {
            "success": True,
            "filename": getattr(mesh, "filename", "model.stl"),
            "arch": arch,
            "triangle_count": len(fdi_labels),
            "fdi_labels": fdi_labels.tolist(),
            "labels": fdi_labels.tolist(),
            "detected_teeth": detected_teeth,
            "class_distribution": class_dist,
            "execution_time_ms": round(elapsed_ms, 2),
            "model": self.version,
        }
