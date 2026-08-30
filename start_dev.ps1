<#
.SYNOPSIS
    AlignView-3D: Unified Headless Dev Launcher (Frontend + AI Backend)
.DESCRIPTION
    Starts the Next.js Frontend (port 3000) and MeshSegNet Python AI Backend (port 8000)
    in the background without opening any extra windows.
    Pressing Ctrl+C or stopping the script cleanly kills both instances and frees the ports.
#>

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   AlignView-3D: Unified Dev Server (Single Window)       " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Locate Python in .venv
$AiServiceDir = Join-Path $ProjectRoot "ai_service"
$VenvPython = Join-Path $AiServiceDir ".venv\Scripts\python.exe"

if (Test-Path $VenvPython) {
    $PythonExe = $VenvPython
    Write-Host "[AI Backend] Using isolated virtual environment: .venv" -ForegroundColor Green
} else {
    $PythonExe = "python"
    Write-Host "[AI Backend] .venv not found, using system Python." -ForegroundColor Yellow
}

# Helper to recursively terminate a process tree
function Kill-ProcessTree($processId) {
    if (-not $processId) { return }
    try {
        $children = Get-CimInstance Win32_Process | Where-Object { $_.ParentProcessId -eq $processId }
        foreach ($child in $children) {
            Kill-ProcessTree $child.ProcessId
        }
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    } catch {
        # Process already exited
    }
}

# 2. Start AI Backend in background (NO NEW WINDOW)
Write-Host "[1/2] Starting MeshSegNet AI Worker on http://127.0.0.1:8000 ..." -ForegroundColor Magenta
$BackendProcess = Start-Process -FilePath $PythonExe `
    -ArgumentList "server.py" `
    -WorkingDirectory $AiServiceDir `
    -NoNewWindow `
    -PassThru

# 3. Start Next.js Frontend in background (NO NEW WINDOW)
Write-Host "[2/2] Starting Next.js Dev Server on http://localhost:3000 ..." -ForegroundColor Green
$FrontendProcess = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c npm run dev" `
    -WorkingDirectory $ProjectRoot `
    -NoNewWindow `
    -PassThru

Write-Host ""
Write-Host "==========================================================" -ForegroundColor DarkGray
Write-Host "  Application running in the current console:" -ForegroundColor White
Write-Host "  -> Frontend : http://localhost:3000" -ForegroundColor Cyan
Write-Host "  -> AI Worker: http://127.0.0.1:8000" -ForegroundColor Magenta
Write-Host "==========================================================" -ForegroundColor DarkGray
Write-Host "  [Press Ctrl+C at any time to shut down both servers]" -ForegroundColor Yellow
Write-Host ""

# 4. Keep alive & trap exit / Ctrl+C
try {
    while ($true) {
        if ($BackendProcess.HasExited) {
            Write-Host "[WARN] AI Backend exited (Exit code: $($BackendProcess.ExitCode))." -ForegroundColor Yellow
            break
        }
        if ($FrontendProcess.HasExited) {
            Write-Host "[WARN] Frontend server exited (Exit code: $($FrontendProcess.ExitCode))." -ForegroundColor Yellow
            break
        }
        Start-Sleep -Seconds 1
    }
}
finally {
    Write-Host ""
    Write-Host "Shutting down all instances..." -ForegroundColor Red

    if ($BackendProcess -and -not $BackendProcess.HasExited) {
        Write-Host " - Stopping AI Backend (PID: $($BackendProcess.Id))..." -ForegroundColor DarkGray
        Kill-ProcessTree $BackendProcess.Id
    }

    if ($FrontendProcess -and -not $FrontendProcess.HasExited) {
        Write-Host " - Stopping Frontend Server (PID: $($FrontendProcess.Id))..." -ForegroundColor DarkGray
        Kill-ProcessTree $FrontendProcess.Id
    }

    # Free up standard ports if any dangling child left
    try {
        @(3000, 8000) | ForEach-Object {
            $conns = Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue
            foreach ($conn in $conns) {
                if ($conn.OwningProcess -gt 0) {
                    Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
                }
            }
        }
    } catch {
        # Best-effort port cleanup
    }

    Write-Host "All servers stopped cleanly." -ForegroundColor Green
}
