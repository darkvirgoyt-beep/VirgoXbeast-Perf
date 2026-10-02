# language: Python, file: gemini_aim.py, target: Android Root, Python 3.x
# *VirgoXbeast Pro — Live Multimodal AI Telemetry & Crosshair Lock Engine*
# Ingests live screen frames, gyroscope/accelerometer telemetry, crosshair position,
# teammate/enemy states, and executes real-time crosshair locking via /dev/uinput.

import os
import time
import subprocess
import struct
import json
import urllib.request
import urllib.error
import cv2
import numpy as np
import base64
import random

API_KEY = base64.b64decode("QVEuQWI4Uk42SzFQVkE5YmZJeVVvZGVFLW1ydUpnWXFrM3gwRXRRalVrS3dfNFBPSkozVXc=").decode("utf-8")
MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-2.5-flash-lite",
    "gemini-3.1-flash-lite"
]

class LiveUInputEngine:
    def __init__(self, w=1080, h=2400):
        self.w, self.h = w, h
        self.fd = None
        for path in ['/dev/uinput', '/dev/input/uinput']:
            if os.path.exists(path):
                try:
                    self.fd = open(path, "wb")
                    break
                except OSError:
                    continue

    def lock_on_target(self, dx, dy):
        """
        Executes live crosshair locking towards enemy head/vest coordinates.
        Applies proportional velocity scaling to snap instantly when firing.
        """
        if not self.fd:
            return

        cx, cy = self.w // 2, self.h // 2
        target_x = cx + dx
        target_y = cy + dy

        target_x = max(20, min(self.w - 20, target_x))
        target_y = max(20, min(self.h - 20, target_y))

        # Direct high-speed locking vector injection
        events = struct.pack('llHhi', 0, 0, 3, 53, int(target_x)) + \
                 struct.pack('llHhi', 0, 0, 3, 54, int(target_y)) + \
                 struct.pack('llHhi', 0, 0, 0, 0, 0)
        self.fd.write(events)
        self.fd.flush()

    def close(self):
        if self.fd:
            self.fd.close()

def read_gyro_accel():
    """Reads live hardware gyroscope and accelerometer sensor nodes for motion context."""
    gyro = {"x": 0.0, "y": 0.0, "z": 0.0}
    accel = {"x": 0.0, "y": 0.0, "z": 0.0}
    try:
        # Read from standard Android IIO sensor nodes if available
        for iio in os.listdir('/sys/bus/iio/devices'):
            iio_path = os.path.join('/sys/bus/iio/devices', iio)
            if os.path.exists(os.path.join(iio_path, 'in_anglvel_x_raw')):
                with open(os.path.join(iio_path, 'in_anglvel_x_raw'), 'r') as f:
                    gyro["x"] = float(f.read().strip())
            if os.path.exists(os.path.join(iio_path, 'in_accel_x_raw')):
                with open(os.path.join(iio_path, 'in_accel_x_raw'), 'r') as f:
                    accel["x"] = float(f.read().strip())
    except Exception:
        pass
    return {"gyro": gyro, "accel": accel}

def is_game_active(target_pkgs):
    try:
        for pid in [p for p in os.listdir('/proc') if p.isdigit()]:
            with open(f'/proc/{pid}/cmdline', 'rb') as f:
                cmd = f.read().decode('utf-8', errors='ignore')
                if any(pkg in cmd for pkg in target_pkgs):
                    return True
    except Exception:
        pass
    return False

def capture_screen():
    pipe = subprocess.Popen(['screencap', '-p'], stdout=subprocess.PIPE)
    raw = pipe.stdout.read()
    pipe.wait()
    if not raw:
        return None
    arr = np.frombuffer(raw, dtype=np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)

def query_gemini_live_aim(frame_bgr, telemetry):
    success, encoded = cv2.imencode('.jpg', frame_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 65])
    if not success:
        return None
    img_b64 = base64.b64encode(encoded).decode('utf-8')

    prompt = (
        f"Live telemetry gyro/accel: {json.dumps(telemetry)}.\n"
        "Analyze this shooter frame (BGMI/Free Fire). Identify crosshair at center. "
        "Distinguish teammates from enemies. Locate nearest enemy. "
        "Hitbox priority: 1. Head, 2. Vest/Chest, 3. Legs. "
        "Calculate exact pixel offset (dx, dy) from center crosshair to enemy head (or vest if head obscured). "
        "Return ONLY strict JSON: {\"dx\": float, \"dy\": float, \"locked\": bool, \"part\": \"head|vest|legs\"}. "
        "If no enemy is visible, return {\"dx\": 0.0, \"dy\": 0.0, \"locked\": false, \"part\": \"none\"}."
    )

    payload = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {"inline_data": {"mime_type": "image/jpeg", "data": img_b64}}
            ]
        }]
    }

    for model in MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={API_KEY}"
        req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(req, timeout=1.2) as resp:
                res_data = json.loads(resp.read().decode('utf-8'))
                text = res_data['candidates'][0]['content']['parts'][0]['text']
                text = text.replace("```json", "").replace("```", "").strip()
                if "{" in text and "}" in text:
                    json_str = text[text.rfind("{"):text.rfind("}")+1]
                    return json.loads(json_str)
        except Exception:
            continue
    return None

def main():
    pkgs = ["com.pubg.imobile", "com.tencent.ig", "com.dts.freefireth", "com.dts.freefiremax"]
    engine = LiveUInputEngine()

    print("[*] VirgoXbeast Pro — Live Multimodal AI Telemetry & Headshot Lock Engine Active.")

    try:
        while True:
            if not is_game_active(pkgs):
                time.sleep(1.0)
                continue

            frame = capture_screen()
            if frame is None:
                time.sleep(0.01)
                continue

            telemetry = read_gyro_accel()
            ai_response = query_gemini_live_aim(frame, telemetry)

            if ai_response and ai_response.get("locked", False):
                dx = float(ai_response.get("dx", 0.0))
                dy = float(ai_response.get("dy", 0.0))
                part = ai_response.get("part", "head")

                # Damage multiplier: Headshot gets direct lock vector, vest/legs get scaled
                multiplier = 1.0 if part == "head" else (1.3 if part == "vest" else 1.6)
                engine.lock_on_target(dx / multiplier, dy / multiplier)

            time.sleep(0.01) # 100 FPS live closed-loop AI reaction
    except KeyboardInterrupt:
        engine.close()

if __name__ == "__main__":
    main()
