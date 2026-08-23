"""
Unykorn Master Deals, Owners & Infrastructure Video Generator
Engine: Alienware NVIDIA NVENC + FFmpeg + Python

Assembles a multi-segment master video explaining:
1. Executive Overview (UnyKorn LLC, Kevan, Sravan, FTH Trading)
2. Fast Cash Settlement Rails (FlashRouter, LegacyChain, Genesis402)
3. Institutional RWA & Credit (GoldBit, Capital, LDX RWA, Dignity Gold, BitGo)
4. High-Ticket Asset Tokenization (Relics, Art, Liquor, Time, Smoke, MMA, Miami)
5. 23 Endpoints & Current Live Status
"""

import os
import sys
import subprocess
from pathlib import Path

MEDIA_DIR = Path(r"C:\Users\Kevan\.gemini\antigravity-ide\scratch\media")
OUTPUT_DIR = Path(r"C:\Users\Kevan\.gemini\antigravity-ide\scratch")

DEAL_SEGMENTS = [
    {
        "clip": "Kevanbtc_create_a_profession.mp4",
        "overlay": "UNYKORN LLC // KEVAN & SRAVAN EXECUTIVE REVIEW",
        "detail": "UnyKorn LLC (Wyoming LLC) - LEI: 2549008J7LUHSQ73SI26. Total AUC: $4.82B across 155 on-chain assets."
    },
    {
        "clip": "The_Technology_of_a_Double_Close.mp4",
        "overlay": "FLASHROUTER.IO // REAL ESTATE DOUBLE-CLOSE RAILS",
        "detail": "Wholesalers & Title Escrow Companies - Fee: $500-$1,500 HUD-1 tech fee + 50-100 bps origination split."
    },
    {
        "clip": "your-legacy.mp4",
        "overlay": "LEGACYCHAIN.APP // DIGITAL ESTATE & TRUST VAULTS",
        "detail": "Estate Planning Attorneys & HNW Families - Fee: $999 B2B attorney seat licenses + $99-$299 B2C vaults."
    },
    {
        "clip": "unykorn_mma_pro_60fps_commercial.mp4",
        "overlay": "MMA.UNYKORN.AI // COMBAT SPORTS PURSE SYNDICATION",
        "detail": "MMA Fighters & Event Promoters - Fee: 5.0% fight purse syndication + PPV ticketing fees."
    },
    {
        "clip": "maybe_dignity_gold_and_unykorn.mp4",
        "overlay": "DIGNITY GOLD & GOLDBIT // PHYSICAL RESERVE VAULTS",
        "detail": "Institutional Lenders & BitGo Custody - Fee: 25-75 bps origination spread + qualified reserve issuance."
    },
    {
        "clip": "left side perfect_hit_fr.mp4",
        "overlay": "UNYKORN NETWORK GRID // 23 LIVE ENDPOINTS ACTIVE",
        "detail": "goldbit.unykorn.ai/#network - Live execution mesh across 4 core gateway nodes."
    },
    {
        "clip": "hell_ya_that_is_what_im_talkin.mp4",
        "overlay": "MONETIZATION VALVES OPEN // IMMEDIATELY REVENUE READY",
        "detail": "Monetization active across 3 cash engines. Ready for immediate fee extraction."
    }
]

def build_master_deal_video(output_name="unykorn_master_deals_explained.mp4"):
    print("[*] Initializing Unykorn Master Deals & Owners Video Assembly...")
    
    valid_clips = []
    concat_list = OUTPUT_DIR / "master_deals_concat.txt"
    
    with open(concat_list, "w", encoding="utf-8") as f:
        for seg in DEAL_SEGMENTS:
            cpath = MEDIA_DIR / seg["clip"]
            if not cpath.exists():
                cpath = OUTPUT_DIR / seg["clip"]
            if cpath.exists():
                valid_clips.append(seg)
                f.write(f"file '{str(cpath).replace('\\', '/')}'\n")
                print(f"  [+] Added Segment: {seg['overlay']}")
            else:
                print(f"  [-] Segment clip missing: {seg['clip']}")

    if not valid_clips:
        print("[!] Error: No deal segment clips found.")
        return False

    out_file = OUTPUT_DIR / output_name
    print(f"[*] Rendering Master Deal Assembly via NVIDIA GPU NVENC -> {out_file}")

    # Build FFmpeg command with NVIDIA NVENC acceleration
    cmd = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0", "-i", str(concat_list),
        "-c:v", "h264_nvenc", "-preset", "p6", "-tune", "hq", "-rc", "vbr", "-cq", "19",
        "-c:a", "aac", "-b:a", "192k",
        "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,drawtext=text='UNYKORN DEALS & INFRASTRUCTURE':fontcolor=gold:fontsize=44:x=(w-text_w)/2:y=80",
        str(out_file)
    ]

    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0:
        print(f"[SUCCESS] Master Deals Video rendered: {out_file}")
        return str(out_file)
    else:
        print(f"[!] NVENC Warning, running CPU fallback...")
        cmd_fb = [
            "ffmpeg", "-y",
            "-f", "concat", "-safe", "0", "-i", str(concat_list),
            "-c:v", "libx264", "-preset", "fast",
            "-c:a", "aac", "-b:a", "192k",
            "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2",
            str(out_file)
        ]
        res_fb = subprocess.run(cmd_fb, capture_output=True, text=True)
        if res_fb.returncode == 0:
            print(f"[SUCCESS] Master Deals Video rendered via fallback: {out_file}")
            return str(out_file)
        else:
            print(f"[ERROR] Render failed: {res_fb.stderr[-300:]}")
            return False

if __name__ == "__main__":
    build_master_deal_video()
