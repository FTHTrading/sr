import os
import shutil
import glob

source_media_dir = r"C:\Users\Kevan\.gemini\antigravity-ide\scratch\media"
target_gallery_dir = r"C:\Users\Kevan\Videos\Unykorn_Miami_Vice_Media_Gallery"

subfolders = {
    "sports": os.path.join(target_gallery_dir, "01_Sports_Baseball_MMA"),
    "exec": os.path.join(target_gallery_dir, "02_Executive_Promos_Hype"),
    "gold": os.path.join(target_gallery_dir, "03_Dignity_Gold_Reserves"),
    "archive": os.path.join(target_gallery_dir, "04_Master_Consolidated_Archive"),
}

for folder in subfolders.values():
    os.makedirs(folder, exist_ok=True)

copied_count = 0
if os.path.exists(source_media_dir):
    for fname in os.listdir(source_media_dir):
        src_file = os.path.join(source_media_dir, fname)
        if not os.path.isfile(src_file):
            continue
        
        fname_lower = fname.lower()
        if any(k in fname_lower for k in ["baseball", "hit", "mma", "fight", "sports"]):
            dest = os.path.join(subfolders["sports"], fname)
        elif any(k in fname_lower for k in ["kevan", "exec", "promo", "hype", "unykorn", "avatar"]):
            dest = os.path.join(subfolders["exec"], fname)
        elif any(k in fname_lower for k in ["gold", "dignity", "reserve"]):
            dest = os.path.join(subfolders["gold"], fname)
        else:
            dest = os.path.join(subfolders["archive"], fname)
            
        shutil.copy2(src_file, dest)
        copied_count += 1

print(f"[+] Successfully organized {copied_count} videos into {target_gallery_dir}")
