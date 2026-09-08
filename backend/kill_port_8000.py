"""
Script to kill process listening on port 8000 (Uvicorn/FastAPI)
Run with: python kill_port_8000.py
"""

import os
import subprocess
import sys
import time

def kill_port_8000():
    print("🔍 Looking for process on port 8000...")
    
    try:
        # Find process ID using netstat
        cmd = "netstat -ano | findstr :8000"
        result = subprocess.check_output(cmd, shell=True).decode()
        
        if not result:
            print("✅ No process found on port 8000.")
            return
            
        print("⚠️  Found process(es):")
        print(result)
        
        # Extract PIDs
        pids = set()
        for line in result.splitlines():
            parts = line.strip().split()
            if len(parts) > 4:
                pid = parts[-1]
                pids.add(pid)
        
        if not pids:
            print("❌ Could not extract PID.")
            return
            
        print(f"🔪 Killing PIDs: {', '.join(pids)}...")
        
        for pid in pids:
            if pid == "0":
                continue
            try:
                subprocess.run(f"taskkill /F /PID {pid}", shell=True)
                print(f"   ✅ Killed PID {pid}")
            except Exception as e:
                print(f"   ❌ Failed to kill PID {pid}: {e}")
                
        print("\n✅ Port 8000 should be free now.")
        
    except subprocess.CalledProcessError:
        print("✅ No process found on port 8000.")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    kill_port_8000()
