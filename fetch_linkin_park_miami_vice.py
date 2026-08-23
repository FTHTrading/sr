import os
import yt_dlp

output_path = r"C:\Users\Kevan\.gemini\antigravity-ide\scratch\media\miami_vice_linkin_park"

ydl_opts = {
    'format': 'bestaudio/best',
    'outtmpl': output_path + '.%(ext)s',
    'postprocessors': [{
        'key': 'FFmpegExtractAudio',
        'preferredcodec': 'mp3',
        'preferredquality': '192',
    }],
    'quiet': False
}

search_query = "ytsearch1:Linkin Park Jay Z Numb Encore Miami Vice soundtrack"

print(f"[*] Downloading Linkin Park Miami Vice soundtrack via yt-dlp...")
with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    ydl.download([search_query])

print(f"[+] Download complete: {output_path}.mp3")
