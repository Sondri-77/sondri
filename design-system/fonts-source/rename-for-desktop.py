"""Prefix every installed Sondri display face with 'Sondri ' so one search
term surfaces the whole library in any app. Desktop copies only — the web
build in public/fonts keeps the vendor names."""
import os, shutil, sys
from fontTools.ttLib import TTFont

SRC = "/Volumes/CORE-02/projects/sondri/design-system/fonts-source"
DEST = os.path.expanduser("~/Library/Fonts")
OUT = sys.argv[1]  # staging dir
PREFIX = "Sondri "

# nameID: 1 family, 3 unique id, 4 full name, 6 postscript, 16 typographic family
FAMILY_IDS = {1, 16}
FULL_IDS = {3, 4, 18}
PS_IDS = {6}

files = []
seen = set()
for root, _, names in os.walk(SRC):
    for n in sorted(names):
        if not n.lower().endswith((".otf", ".ttf")):
            continue
        base = os.path.splitext(n)[0]
        if base in seen:
            continue
        # prefer OTF: skip a TTF whose OTF twin exists anywhere
        if n.lower().endswith(".ttf"):
            twin = any(base + ".otf" == f for _, _, fs in os.walk(SRC) for f in fs)
            if twin:
                continue
        seen.add(base)
        files.append(os.path.join(root, n))

os.makedirs(OUT, exist_ok=True)
renamed = []
for path in files:
    font = TTFont(path)
    name = font["name"]
    for rec in name.names:
        try:
            val = rec.toUnicode()
        except Exception:
            continue
        if val.startswith(PREFIX):
            continue
        if rec.nameID in FAMILY_IDS or rec.nameID in FULL_IDS:
            rec.string = PREFIX + val
        elif rec.nameID in PS_IDS:
            rec.string = "Sondri" + val.lstrip()
    fam = name.getDebugName(1)
    ext = os.path.splitext(path)[1]
    out_name = "Sondri " + os.path.basename(path)
    font.save(os.path.join(OUT, out_name))
    font.close()
    renamed.append((os.path.basename(path), fam))

for old, fam in renamed:
    print(f"{old:42} -> {fam}")
print(f"\n{len(renamed)} files staged in {OUT}")
