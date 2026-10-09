@echo off
TITLE EdgeMind — Master Industrial Edge & Soundbox Launcher
color 0A

echo ========================================================================
echo   EDGEMIND: AIR-GAPPED VECTOR INTELLIGENCE & CRDT FLEET CONTROL
echo ========================================================================
echo   [1/4] Checking Python environment...
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python not found in PATH!
    pause
    exit /b 1
)

echo   [2/4] Initializing Node / Next.js Telemetry Console...
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm not found in PATH!
    pause
    exit /b 1
)

echo   [3/4] Launching Fleet Hub, Edge Nodes, and Next.js UI via scripts/run_project.py...
echo   ------------------------------------------------------------------------
echo   • Industrial UI:        http://localhost:3000
echo   • Device A (Plant N):   http://localhost:8001
echo   • Device B (Plant S):   http://localhost:8002
echo   • Central Hub:          http://localhost:8000
echo   ------------------------------------------------------------------------
python scripts\run_project.py

pause
