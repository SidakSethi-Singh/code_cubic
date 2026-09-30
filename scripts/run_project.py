#!/usr/bin/env python3
"""
EdgeMind Master Runtime Launcher
Launches all 4 core topology services concurrently:
1. Fleet Central Hub Control Plane (port 8000)
2. Device A - Plant North Edge Node (port 8001)
3. Device B - Plant South Edge Node (port 8002)
4. Industrial Telemetry Next.js UI Console (port 3000)
"""

import os
import sys
import subprocess
import time
import signal
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

def main():
    print("=" * 70)
    print("  EDGEMIND: INDUSTRIAL OFFLINE VECTOR MEMORY & CRDT FLEET CONTROL")
    print("=" * 70)
    print(f"Working Directory: {REPO_ROOT}\n")

    # Set up environment variables
    env_base = os.environ.copy()
    env_base["PYTHONPATH"] = str(REPO_ROOT)

    # 1. Environment for Hub (port 8000)
    env_hub = env_base.copy()

    # 2. Environment for Device A (port 8001)
    env_dev_a = env_base.copy()
    env_dev_a["DEVICE_ID"] = "Device A"
    env_dev_a["SITE_ID"] = "Plant North"
    env_dev_a["ASSET_ID"] = "P-204"
    env_dev_a["PORT"] = "8001"
    env_dev_a["DEVICE_DATA_DIR"] = str(REPO_ROOT / "data" / "devices" / "device_a")

    # 3. Environment for Device B (port 8002)
    env_dev_b = env_base.copy()
    env_dev_b["DEVICE_ID"] = "Device B"
    env_dev_b["SITE_ID"] = "Plant South"
    env_dev_b["ASSET_ID"] = "T-34"
    env_dev_b["PORT"] = "8002"
    env_dev_b["DEVICE_DATA_DIR"] = str(REPO_ROOT / "data" / "devices" / "device_b")

    procs = []

    try:
        print("[1/4] Starting Fleet Central Hub API on http://localhost:8000 ...")
        cmd_hub = [sys.executable, "-m", "uvicorn", "hub.app.main:app", "--host", "0.0.0.0", "--port", "8000", "--log-level", "warning"]
        p_hub = subprocess.Popen(cmd_hub, cwd=str(REPO_ROOT), env=env_hub)
        procs.append(("Hub (8000)", p_hub))

        print("[2/4] Starting Device A (Plant North) Node on http://localhost:8001 ...")
        cmd_dev_a = [sys.executable, "-m", "uvicorn", "device.app.main:app", "--host", "0.0.0.0", "--port", "8001", "--log-level", "warning"]
        p_dev_a = subprocess.Popen(cmd_dev_a, cwd=str(REPO_ROOT), env=env_dev_a)
        procs.append(("Device A (8001)", p_dev_a))

        print("[3/4] Starting Device B (Plant South) Node on http://localhost:8002 ...")
        cmd_dev_b = [sys.executable, "-m", "uvicorn", "device.app.main:app", "--host", "0.0.0.0", "--port", "8002", "--log-level", "warning"]
        p_dev_b = subprocess.Popen(cmd_dev_b, cwd=str(REPO_ROOT), env=env_dev_b)
        procs.append(("Device B (8002)", p_dev_b))

        ui_dir = REPO_ROOT / "ui"
        print("[4/4] Starting Next.js Industrial Telemetry UI on http://localhost:3000 ...")
        # On Windows, use npx / npm via shell or absolute executable
        npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
        p_ui = subprocess.Popen([npm_cmd, "run", "dev"], cwd=str(ui_dir), env=env_base)
        procs.append(("Next.js UI (3000)", p_ui))

        time.sleep(3)

        print("\n" + "=" * 70)
        print("  ALL SERVICES RUNNING SUCCESSFULLY!")
        print("=" * 70)
        print("  • UI Console:        http://localhost:3000")
        print("  • Fleet Central Hub: http://localhost:8000/docs")
        print("  • Device A Node:     http://localhost:8001/docs")
        print("  • Device B Node:     http://localhost:8002/docs")
        print("=" * 70)
        print("Press Ctrl+C to terminate all services.\n")

        # Keep alive
        while True:
            for name, p in procs:
                ret = p.poll()
                if ret is not None:
                    print(f"Warning: Process '{name}' exited with code {ret}")
            time.sleep(1)

    except KeyboardInterrupt:
        print("\nReceived termination signal. Shutting down all services...")
    finally:
        for name, p in procs:
            if p.poll() is None:
                print(f"Terminating {name}...")
                p.terminate()
                try:
                    p.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    p.kill()
        print("All EdgeMind services stopped.")

if __name__ == "__main__":
    main()
