"""
Unykorn Video Render Studio Local HTTP API Server
Port: 5000

Serves the Web UI and accepts POST /render requests from the browser to assemble hype videos.
"""

import os
import json
import subprocess
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

SCRATCH_DIR = Path(r"C:\Users\Kevan\.gemini\antigravity-ide\scratch")
MEDIA_DIR = SCRATCH_DIR / "media"

class StudioRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(SCRATCH_DIR), **kwargs)

    def do_POST(self):
        if self.path == "/api/render":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            try:
                data = json.loads(body.decode("utf-8"))
                title = data.get("title", "UNYKORN REVENUE RAILS")
                clips = data.get("clips", [])
                output_name = data.get("output", "custom_hype_render.mp4")

                print(f"[*] API Render Request received: Title='{title}', Clips={len(clips)}")
                
                # Build render command
                if not clips:
                    clips = [
                        "Kevanbtc_create_a_profession.mp4",
                        "use_our_logos_and_colors_and_h.mp4",
                        "left side perfect_hit_fr.mp4",
                        "unykorn_promo.mp4",
                        "maybe_dignity_gold_and_unykorn.mp4",
                        "hell_ya_that_is_what_im_talkin.mp4"
                    ]

                concat_list = SCRATCH_DIR / "concat_list.txt"
                with open(concat_list, "w", encoding="utf-8") as f:
                    for clip in clips:
                        cpath = MEDIA_DIR / clip
                        if not cpath.exists():
                            cpath = SCRATCH_DIR / clip
                        if cpath.exists():
                            f.write(f"file '{str(cpath).replace('\\', '/')}'\n")

                out_file = SCRATCH_DIR / output_name

                cmd = [
                    "ffmpeg", "-y",
                    "-f", "concat", "-safe", "0", "-i", str(concat_list),
                    "-c:v", "h264_nvenc", "-preset", "p6", "-tune", "hq", "-rc", "vbr", "-cq", "19",
                    "-c:a", "aac", "-b:a", "192k",
                    "-vf", f"scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,drawtext=text='{title}':fontcolor=gold:fontsize=48:x=(w-text_w)/2:y=h-100",
                    str(out_file)
                ]

                res = subprocess.run(cmd, capture_output=True, text=True)
                if res.returncode != 0:
                    # CPU fallback
                    cmd_fb = [
                        "ffmpeg", "-y",
                        "-f", "concat", "-safe", "0", "-i", str(concat_list),
                        "-c:v", "libx264", "-preset", "fast",
                        "-c:a", "aac", "-b:a", "192k",
                        "-vf", f"scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2",
                        str(out_file)
                    ]
                    subprocess.run(cmd_fb, capture_output=True, text=True)

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                response = {"status": "success", "file": f"/{output_name}", "path": str(out_file)}
                self.wfile.write(json.dumps(response).encode("utf-8"))
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
        else:
            super().do_POST()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

def run(port=5000):
    server_address = ("", port)
    httpd = HTTPServer(server_address, StudioRequestHandler)
    print(f"[*] Unykorn Video Render Studio Server running at http://localhost:{port}")
    httpd.serve_forever()

if __name__ == "__main__":
    run()
