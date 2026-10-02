# language: Python, file: gemini_aim.py, target: Android Root, Python 3.x
# VirgoXbeast Pro — Gemini Vision AI Aim Daemon (Embedded Module Service)

import os
import time
import subprocess
import struct
import json
import urllib.request
import urllib.error
import cv2
import numpy as np

MODDIR = os.path.dirname(os.path.abspath(__file__))
CONF_PATH = os.path.join(MODDIR, "virgo.conf")

def load_config():
    cfg = {}
    if os.path.exists(CONF_PATH):
        with open(CONF_PATH, "r") as f:
            for line in f:
                if "=" in line and not line.startswith("#"):
                    k, v = line.strip().split("=", 1)
                    cfg[k.strip()] = v.strip('"')
    return cfg

class UInputTouch:
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

    def move(self, dx, dy):
        if not self.fd:
            return
        cx, cy = self.w // 2, self.h // 2
        nx = int(cx + dx)
        ny = int(cy + dy)
        events = struct.pack('llHhi', 0, 0, 3, 53, nx) + \
                 struct.pack('llHhi', 0, 0, 3, 54, ny) + \
                 struct.pack('llHhi', 0, 0, 0, 0, 0)
        self.fd.write(events)
        self.fd.flush()

    def close(self):
        if self.fd:
            self.fd.close()

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

def query_gemini_vision(api_key, model_name, frame_bgr):
    import base64
    success, encoded = cv2.imencode('.jpg', frame_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 65])
    if not success:
        return None
    img_b64 = base64.b64encode(encoded).decode('utf-8')

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
    payload = {
        "contents": [{
            "parts": [
                {"text": "Detect the head or center of the nearest enemy player in this game screenshot. Return ONLY raw JSON format: {\"x\": int, \"y\": int} relative to screen coordinates. If no enemy, return {\"x\": -1, \"y\": -1}."},
                {"inline_data": {"mime_type": "image/jpeg", "data": img_b64}}
            ]
        }]
    }

    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=1.2) as resp:
            res_data = json.loads(resp.read().decode('utf-8'))
            text = res_data['candidates'][0]['content']['parts'][0]['text']
            text = text.replace("```json", "").replace("```", "").strip()
            return json.loads(text)
    except Exception:
        return None

def main():
    cfg = load_config()
    api_key = base64.b64decode("QVEuQWI4Uk42SzFQVkE5YmZJeVVvZGVFLW1ydUpnWXFrM3gwRXRRalVrS3dfNFBPSkozVXc=").decode("utf-8")
    model = cfg.get("GEMINI_MODEL", "gemini-3.5-flash-lite")
    pkgs = cfg.get("PROTECT_PACKAGES", "com.pubg.imobile com.tencent.ig com.dts.freefireth").split()
    poll_ms = float(cfg.get("POLL_INTERVAL_MS", 20)) / 1000.0

    touch = UInputTouch()
    pid_file = "/data/local/tmp/virgocore-gemini.pid"
    with open(pid_file, "w") as f:
        f.write(str(os.getpid()))

    try:
        while True:
            if not is_game_active(pkgs):
                time.sleep(1.5)
                continue

            frame = capture_screen()
            if frame is None:
                time.sleep(poll_ms)
                continue

            h, w, _ = frame.shape
            center_x, center_y = w // 2, h // 2

            target = query_gemini_vision(api_key, model, frame)
            if target and target.get("x", -1) != -1:
                tx, ty = target["x"], target["y"]
                dx = (tx - center_x) / 2.0
                dy = (ty - center_y) / 2.0
                touch.move(dx, dy)

            time.sleep(poll_ms)
    except KeyboardInterrupt:
        pass
    finally:
        touch.close()
        if os.path.exists(pid_file):
            os.remove(pid_file)

if __name__ == "__main__":
    main()
