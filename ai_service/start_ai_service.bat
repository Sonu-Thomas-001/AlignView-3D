@echo off
title AlignView-3D MeshSegNet AI Microservice
cd /d "%~dp0"

echo =======================================================
echo   AlignView-3D: 3D MeshSegNet AI Segmentation Worker
echo =======================================================
echo.

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python is not found in PATH. Please install Python 3.9+ from https://python.org
    pause
    exit /b 1
)

echo [1/3] Checking dependencies...
python -m pip install -r requirements.txt --quiet --no-warn-script-location

echo [2/3] Starting MeshSegNet AI worker on http://127.0.0.1:8000 ...
python server.py

pause
