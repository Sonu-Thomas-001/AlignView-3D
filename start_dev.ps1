<#
.SYNOPSIS
    AlignView-3D: Unified Dev Launcher (Frontend + AI Backend)
.DESCRIPTION
    Starts the Next.js Frontend (port 3000) and MeshSegNet Python AI Backend (port 8000).
    Pressing Ctrl+C cleanly shuts down all instances without leaving dangling background processes.
#>

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   🦷 AlignView-3D: Unified Dev Launcher                  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verify / Locate Python in .venv
$AiServiceDir = Join-Path $ProjectRoot "ai_service"
$VenvPython = Join-Path $AiServiceDir ".venv\Scripts\python.exe"

if (-not (Test-Path $VenvPython)) {
    Write-Host "[AI Backend] .venv not found. Falling back to system python..." -ForegroundColor Yellow
    $PythonExe = "python"
} else {
    Write-Host "[AI Backend] Using isolated virtual environment: $VenvPython" -ForegroundColor Green
    $PythonExe = $VenvPython
}

# 2. Start AI Backend (FastAPI on Port 8000)
Write-Host "[1/2] 🚀 Starting MeshSegNet AI Backend (http://127.0.0.1:8000)..." -ForegroundColor Magenta
$BackendProcess = Start-Process -FilePath $PythonExe `
    -ArgumentList "server.py" `
    -WorkingDirectory $AiServiceDir `
    -PassThru

# 3. Start Next.js Frontend (Port 3000)
Write-Host "[2/2] 🌐 Starting Next.js Web App (http://localhost:3000)..." -ForegroundColor Green
$FrontendProcess = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c npm run dev" `
    -WorkingDirectory $ProjectRoot `
    -PassThru

Write-Host ""
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  ✅ Frontend : http://localhost:3000" -ForegroundColor Green
Write-Host "  ✅ AI Worker: http://127.0.0.1:8000" -ForegroundColor Magenta
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  [Press Ctrl+C to terminate both servers]" -ForegroundColor Yellow
Write-Host ""

# Helper to recursively terminate a process and its child processes
function Kill-ProcessTree($processId) {
    if (-not $processId) { return }
    try {
        # Find child processes
        $children = Get-CimInstance Win32_Process | Where-Object { $_.ParentProcessId -eq $processId }
        foreach ($child in $children) {
            Kill-ProcessTree $child.ProcessId
        }
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    } catch {
        # Process already exited
    }
}

# 4. Monitor processes & trap exit / Ctrl+C
try {
    while ($true) {
        # Check if backend crashed
        if ($BackendProcess.HasExited) {
            Write-Host "[WARN] AI Backend process exited with code $($BackendProcess.ExitCode)." -ForegroundColor Yellow
            break
        }
        # Check if frontend crashed
        if ($FrontendProcess.HasExited) {
            Write-Host "[WARN] Frontend dev server process exited with code $($FrontendProcess.ExitCode)." -ForegroundColor Yellow
            break
        }
        Start-Sleep -Seconds 1
    }
}
finally {
    Write-Host ""
    Write-Host "🛑 Shutting down all instances..." -ForegroundColor Red

    if ($BackendProcess -and -not $BackendProcess.HasExited) {
        Write-Host " - Stopping AI Backend (PID: $($BackendProcess.Id))..." -ForegroundColor DarkGray
        Kill-ProcessTree $BackendProcess.Id
    }

    if ($FrontendProcess -and -not $FrontendProcess.HasExited) {
        Write-Host " - Stopping Frontend Server (PID: $($FrontendProcess.Id))..." -ForegroundColor DarkGray
        Kill-ProcessTree $FrontendProcess.Id
    }

    # Free up standard ports if any child lingering
    try {
        $ports = @(3000, 8000)
        foreach ($port in $ports) {
            $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
            foreach ($conn in $connections) {
                if ($conn.OwningProcess -gt 0) {
                    Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
                }
            }
        }
    } catch {
        # Cleanup best-effort
    }

    Write-Host "✨ All servers stopped cleanly." -ForegroundColor Green
}
