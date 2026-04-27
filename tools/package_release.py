from __future__ import annotations

from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
VERSION = ROOT.joinpath('VERSION').read_text(encoding='utf-8').strip()
OUT = ROOT / 'dist' / f'kakutex-{VERSION}-bundle.zip'

EXCLUDE_PARTS = {'.git', '__pycache__'}
EXCLUDE_SUFFIXES = {'.pyc'}

OUT.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(OUT, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
    for path in sorted(ROOT.rglob('*')):
        rel = path.relative_to(ROOT)
        if path == OUT:
            continue
        if rel.parts and rel.parts[0] == 'dist' and path.suffix == '.zip':
            continue
        if any(part in EXCLUDE_PARTS for part in rel.parts):
            continue
        if path.suffix in EXCLUDE_SUFFIXES:
            continue
        zf.write(path, rel.as_posix())
print(OUT)
