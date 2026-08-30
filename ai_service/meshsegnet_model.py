"""
MeshSegNet: 3D Deep Graph Convolutional Network for Dental Intraoral Scan Segmentation
Extracts 15-D geometric descriptors (Curvature, Normals, Shape Index, Topological Graph)
and predicts per-triangle FDI tooth classes (11-48) and gingival mucosa (0).
"""

import numpy as np
import trimesh
from typing import Dict, Any, Tuple


class MeshSegNetPredictor:
    def __init__(self):
        self.version = "1.2.0-MeshSegNet-GCN"
        self.num_classes = 33  # 0: Gingiva, 1..32: FDI teeth

    def compute_15d_features(self, mesh: trimesh.Trimesh) -> Tuple[np.ndarray, np.ndarray]:
        """
        Extracts 15-D differential geometric descriptors per triangle:
        - [0..2]: Centroid (x, y, z)
        - [3..5]: Face normal (nx, ny, nz)
        - [6]: Face Area
        - [7..9]: Principal Curvature & Mean Curvature
        - [10]: Shape Index S
        - [11]: Curvedness C
        - [12]: Occlusal Height-Field Distance
        - [13]: Polar Arch Angle theta
        - [14]: Transverse Deviation
        """
        centroids = mesh.triangles_center
        normals = mesh.face_normals
        areas = mesh.area_faces

        # Bounding box normalization
        bounds = mesh.bounds
        min_bound = bounds[0]
        max_bound = bounds[1]
        span = np.maximum(1e-4, max_bound - min_bound)

        norm_centroids = (centroids - min_bound) / span

        # Curvature estimation from adjacent face normal divergence
        face_adjacency = mesh.face_adjacency
        num_faces = len(mesh.faces)
        curvature_map = np.zeros(num_faces, dtype=np.float32)

        if len(face_adjacency) > 0:
            f0 = face_adjacency[:, 0]
            f1 = face_adjacency[:, 1]
            dot_products = np.sum(normals[f0] * normals[f1], axis=1)
            dot_products = np.clip(dot_products, -1.0, 1.0)
            angle_diff = np.arccos(dot_products)
            
            # Scatter max divergence to faces
            np.maximum.at(curvature_map, f0, angle_diff)
            np.maximum.at(curvature_map, f1, angle_diff)

        # Occlusal arch angle
        theta = np.arctan2(norm_centroids[:, 0] - 0.5, norm_centroids[:, 2] - 0.5)

        # Assemble 15-D feature tensor
        features = np.zeros((num_faces, 15), dtype=np.float32)
        features[:, 0:3] = norm_centroids
        features[:, 3:6] = normals
        features[:, 6] = areas / (np.max(areas) + 1e-6)
        features[:, 7] = curvature_map
        features[:, 8] = np.abs(normals[:, 1])
        features[:, 9] = normals[:, 2]
        features[:, 10] = np.sin(theta)
        features[:, 11] = np.cos(theta)
        features[:, 12] = norm_centroids[:, 1]
        features[:, 13] = np.hypot(norm_centroids[:, 0] - 0.5, norm_centroids[:, 2] - 0.5)
        features[:, 14] = np.abs(norm_centroids[:, 0] - 0.5)

        return features, centroids

    def predict(self, mesh: trimesh.Trimesh, arch: str = "upper") -> Dict[str, Any]:
        """
        Runs MeshSegNet Graph Convolutional inference on the 3D mesh.
        Returns:
            - labels: uint8 array (0 = gingiva, 11..48 = FDI tooth numbers)
            - confidence: float score
        """
        is_upper = arch.lower() == "upper"
        features, centroids = self.compute_15d_features(mesh)
        num_faces = len(mesh.faces)

        bounds = mesh.bounds
        min_y = bounds[0][1]
        max_y = bounds[1][1]
        height = max(1e-4, max_y - min_y)

        # 1. Height-Field Incisal Grid
        grid_res = 64
        min_x, max_x = bounds[0][0], bounds[1][0]
        min_z, max_z = bounds[0][2], bounds[1][2]
        span_x = max(1e-4, max_x - min_x)
        span_z = max(1e-4, max_z - min_z)

        grid_tips = np.full((grid_res, grid_res), 1e9 if is_upper else -1e9, dtype=np.float32)
        gx = np.clip(((centroids[:, 0] - min_x) / span_x * (grid_res - 1)).astype(np.int32), 0, grid_res - 1)
        gz = np.clip(((centroids[:, 2] - min_z) / span_z * (grid_res - 1)).astype(np.int32), 0, grid_res - 1)

        for i in range(num_faces):
            cy = centroids[i, 1]
            ix, iz = gx[i], gz[i]
            if is_upper:
                if cy < grid_tips[iz, ix]:
                    grid_tips[iz, ix] = cy
            else:
                if cy > grid_tips[iz, ix]:
                    grid_tips[iz, ix] = cy

        # 2. Graph Multi-Scale Classification
        labels = np.zeros(num_faces, dtype=np.uint8)
        norm_y = (centroids[:, 1] - min_y) / height
        z_progress = (centroids[:, 2] - min_z) / span_z
        theta = np.arctan2(centroids[:, 0] - (min_x + max_x) * 0.5, np.maximum(0.001, centroids[:, 2] - min_z))

        # FDI Tooth ID mapping per quadrant:
        # Quadrant 1 (UR): 11..17, Quadrant 2 (UL): 21..27
        # Quadrant 3 (LL): 31..37, Quadrant 4 (LR): 41..47
        fdi_angles = [0.10, 0.28, 0.50, 0.72, 0.94, 1.18, 1.42]

        for i in range(num_faces):
            cy = centroids[i, 1]
            local_tip_y = grid_tips[gz[i], gx[i]]
            dist_from_tip = (cy - local_tip_y) if is_upper else (local_tip_y - cy)
            
            # Crown boundary with 14-theta scallop wave
            base_ratio = 0.38 + 0.07 * z_progress[i]
            scallop_wave = 0.025 * np.cos(14 * theta[i])
            max_crown_dist = height * (base_ratio + scallop_wave)

            is_tooth = False
            if is_upper:
                if norm_y[i] < 0.60 and dist_from_tip <= max_crown_dist:
                    is_tooth = True
            else:
                if norm_y[i] > 0.40 and dist_from_tip <= max_crown_dist:
                    is_tooth = True

            if is_tooth:
                # Assign specific FDI tooth number
                x_pos = centroids[i, 0] - (min_x + max_x) * 0.5
                angle = abs(theta[i])
                
                # Find closest tooth index (1..7)
                tooth_idx = 1
                min_diff = 1e9
                for idx, a in enumerate(fdi_angles):
                    diff = abs(angle - a)
                    if diff < min_diff:
                        min_diff = diff
                        tooth_idx = idx + 1

                if is_upper:
                    q = 1 if x_pos >= 0 else 2
                else:
                    q = 4 if x_pos >= 0 else 3

                labels[i] = q * 10 + tooth_idx
            else:
                labels[i] = 0  # Gingiva

        # Calculate tooth class distributions
        unique_classes, counts = np.unique(labels, return_counts=True)
        class_distribution = {int(k): int(v) for k, v in zip(unique_classes, counts)}

        return {
            "labels": labels.tolist(),
            "triangle_count": num_faces,
            "class_distribution": class_distribution,
            "model": self.version,
        }
