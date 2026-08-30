@echo off
title AlignView-3D MeshSegNet AI Microservice
cd /d "%~dp0"

echo =======================================================
echo   AlignView-3D: 3D MeshSegNet AI Segmentation Worker
echo =======================================================
echo.

if exist ".venv\Scripts\python.exe" (
    echo [1/2] Activating Python Virtual Environment (.venv)...
    set "PYTHON_EXE=.venv\Scripts\python.exe"
) else (
    where python >nul 2>nul
    if %errorlevel% neq 0 (
        echo [ERROR] Python is not found in PATH. Please install Python 3.9+ from https://python.org
        pause
        exit /b 1
    )
    set "PYTHON_EXE=python"
)

echo [2/2] Starting MeshSegNet AI worker on http://127.0.0.1:8000 ...
"%PYTHON_EXE%" server.py

pause
