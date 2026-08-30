"""
AlignView-3D: Local AI Dental Mesh Segmentation Microservice (MeshSegNet Pipeline)
Runs high-precision 3D Graph Convolutional deep segmentation on intraoral STL scans.
"""

import io
import time
import uvicorn
from fastapi import FastAPI, File, UploadFile, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import trimesh
from meshsegnet_model import MeshSegNetPredictor

app = FastAPI(
    title="AlignView-3D MeshSegNet AI Microservice",
    version="1.2.0",
    description="Deep Learning 3D Dental Scan Segmentation Service (MeshSegNet)"
)

# Enable CORS for local Next.js client
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = MeshSegNetPredictor()


@app.get("/health")
def health_check():
    """Health check endpoint to verify AI worker connectivity."""
    return {
        "status": "online",
        "service": "AlignView-3D-MeshSegNet",
        "version": predictor.version,
        "supported_formats": ["STL", "PLY", "OBJ"]
    }


@app.post("/segment")
async def segment_mesh(
    file: UploadFile = File(...),
    arch: str = Query("upper", enum=["upper", "lower"])
):
    """
    Receives raw STL binary file, runs MeshSegNet GCN inference,
    and returns per-triangle class segmentation labels (0 = Gingiva, 11..48 = FDI tooth IDs).
    """
    t0 = time.time()
    try:
        content = await file.read()
        file_obj = io.BytesIO(content)

        # Load 3D mesh via trimesh
        mesh = trimesh.load(file_obj, file_type="stl")
        if isinstance(mesh, trimesh.Scene):
            if len(mesh.geometry) == 0:
                raise HTTPException(status_code=400, detail="Empty 3D Scene in STL")
            mesh = trimesh.util.concatenate(list(mesh.geometry.values()))

        # Run deep segmentation
        result = predictor.predict(mesh, arch=arch)
        execution_time_ms = round((time.time() - t0) * 1000, 2)

        return {
            "success": True,
            "filename": file.filename,
            "arch": arch,
            "triangle_count": result["triangle_count"],
            "labels": result["labels"],
            "class_distribution": result["class_distribution"],
            "execution_time_ms": execution_time_ms,
            "model": result["model"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Segmentation failed: {str(e)}")


if __name__ == "__main__":
    print("🚀 Starting AlignView-3D MeshSegNet AI Microservice on http://127.0.0.1:8000 ...")
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
