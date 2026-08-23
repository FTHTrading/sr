import os
import shutil

source_dirs = [
    r"C:\Users\Kevan\OneDrive - FTH Trading\11-Downloads",
    r"C:\Users\Kevan\Downloads",
]
target_scratch = r"C:\Users\Kevan\.gemini\antigravity-ide\scratch\media"
target_hub = r"C:\Users\Kevan\.gemini\antigravity-ide\scratch\sravan-monetization-hub\media"
target_gallery = r"C:\Users\Kevan\Videos\Unykorn_Miami_Vice_Media_Gallery"

os.makedirs(target_scratch, exist_ok=True)
os.makedirs(target_hub, exist_ok=True)
os.makedirs(target_gallery, exist_ok=True)

keywords = [
    "whitepaper", "baseball", "scene", "hole_in_one", "cinematic", "grok",
    "same_video", "unykorn-emblem", "unykorn-head", "blockchainfraud", "gate_mark"
]

copied_files = []

for sdir in source_dirs:
    if not os.path.exists(sdir):
        continue
    for root, _, files in os.walk(sdir):
        for f in files:
            flower = f.lower()
            if any(k in flower for k in keywords) or flower.endswith(('.obj', '.glb', '.mp4', '.jpg', '.jpeg', '.png', '.pdf')):
                src_path = os.path.join(root, f)
                try:
                    shutil.copy2(src_path, os.path.join(target_scratch, f))
                    shutil.copy2(src_path, os.path.join(target_hub, f))
                    shutil.copy2(src_path, os.path.join(target_gallery, f))
                    copied_files.append(f)
                except Exception as e:
                    pass

print(f"[+] Successfully copied {len(copied_files)} available media & 3D files!")
