"""
Unykorn GPU-Accelerated Hype Video Generator
Engine: Alienware NVIDIA NVENC + FFmpeg + Python

Usage:
  python build_hype_video.py --title "UNYKORN MONETIZATION RAILS" --output "unykorn_hype_master.mp4"
"""

import os
import sys
import argparse
import subprocess
from pathlib import Path

MEDIA_DIR = Path(r"C:\Users\Kevan\.gemini\antigravity-ide\scratch\media")
OUTPUT_DIR = Path(r"C:\Users\Kevan\.gemini\antigravity-ide\scratch")

DEFAULT_CLIPS = [
    "Kevanbtc_create_a_profession.mp4",
    "use_our_logos_and_colors_and_h.mp4",
    "left side perfect_hit_fr.mp4",
    "unykorn_promo.mp4",
    "maybe_dignity_gold_and_unykorn.mp4",
    "hell_ya_that_is_what_im_talkin.mp4"
]

AUDIO_TRACK = "WhatsApp Video 2026-08-23 at 4.02.26 AM.mp4"

def generate_hype_video(title="UNYKORN INFRASTRUCTURE", output_name="unykorn_hype_render.mp4"):
    print(f"[*] Initializing NVIDIA NVENC Hype Video Pipeline on Alienware...")
    print(f"[*] Title: {title}")
    
    # 1. Create file list for FFmpeg concatenation
    concat_list = OUTPUT_DIR / "concat_list.txt"
    valid_clips = []
    
    for clip_name in DEFAULT_CLIPS:
        clip_path = MEDIA_DIR / clip_name
        if clip_path.exists():
            valid_clips.append(clip_path)
            print(f"  [+] Added clip: {clip_name}")
        else:
            print(f"  [-] Clip not found: {clip_name}")
            
    if not valid_clips:
        print("[!] Error: No valid video clips found in media directory.")
        return False
        
    with open(concat_list, "w", encoding="utf-8") as f:
        for clip in valid_clips:
            # Escape paths for ffmpeg concat
            f.write(f"file '{str(clip).replace('\\', '/')}'\n")

    audio_path = MEDIA_DIR / AUDIO_TRACK
    out_file = OUTPUT_DIR / output_name

    print(f"[*] Executing FFmpeg GPU NVENC Render -> {out_file}")
    
    # Build FFmpeg command with NVIDIA GPU NVENC acceleration
    cmd = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0", "-i", str(concat_list),
        "-c:v", "h264_nvenc", "-preset", "p6", "-tune", "hq", "-rc", "vbr", "-cq", "19",
        "-c:a", "aac", "-b:a", "192k",
        "-vf", f"scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,drawtext=text='{title}':fontcolor=gold:fontsize=48:x=(w-text_w)/2:y=h-100",
        str(out_file)
    ]
    
    try:
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode == 0:
            print(f"[SUCCESS] Hype Video rendered cleanly using NVIDIA NVENC: {out_file}")
            return str(out_file)
        else:
            print(f"[!] NVENC Warning, falling back to CPU h264: {res.stderr[-300:]}")
            # Fallback command without nvenc
            cmd_fallback = [
                "ffmpeg", "-y",
                "-f", "concat", "-safe", "0", "-i", str(concat_list),
                "-c:v", "libx264", "-preset", "fast",
                "-c:a", "aac", "-b:a", "192k",
                "-vf", f"scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2",
                str(out_file)
            ]
            res_fb = subprocess.run(cmd_fallback, capture_output=True, text=True)
            if res_fb.returncode == 0:
                print(f"[SUCCESS] Hype Video rendered: {out_file}")
                return str(out_file)
            else:
                print(f"[ERROR] Render failed: {res_fb.stderr[-300:]}")
                return False
    except Exception as e:
        print(f"[ERROR] Exception during video render: {e}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Alienware Hype Video Render Engine")
    parser.add_argument("--title", default="UNYKORN INFRASTRUCTURE RAILS", help="Overlay title text")
    parser.add_argument("--output", default="unykorn_hype_render.mp4", help="Output filename")
    args = parser.parse_args()

    generate_hype_video(title=args.title, output_name=args.output)
