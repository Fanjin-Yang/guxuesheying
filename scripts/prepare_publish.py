"""Prepare the existing WorkBuddy publish folder without touching source photos."""
from pathlib import Path
import shutil

root = Path(__file__).resolve().parents[1]
target = root / "__publish"
target.mkdir(exist_ok=True)
for name in ("index.html", "gallery.html"):
    shutil.copy2(root / name, target / name)
for name in ("css", "js", "images"):
    shutil.copytree(root / name, target / name, dirs_exist_ok=True)
print("Prepared __publish; upload/publish it through the existing WorkBuddy application.")
