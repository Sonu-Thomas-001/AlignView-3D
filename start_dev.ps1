<#
.SYNOPSIS
    AlignView-3D: Dev Launcher
.DESCRIPTION
    Starts the Next.js Frontend (port 3000) cleanly.
#>

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   AlignView-3D: Dev Server                               " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Starting Next.js Dev Server on http://localhost:3000 ..." -ForegroundColor Green
npm run dev
