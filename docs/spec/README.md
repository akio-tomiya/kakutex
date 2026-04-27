# KakuTeX Specification Package

This package contains the v1.5 specification document for KakuTeX, the browser-based TeX subset memo app. The revised edition matches the current reference implementation, which uses static HTML/CSS/JavaScript and MathJax 3, treats network-connected browser use on a personal homepage as the primary deployment path, and preserves an offline distribution option from the same build output.

## Contents

- `spec/main.tex` : LuaLaTeX source of the specification
- `kakutex-spec-v1.5.md` : markdown mirror used for fallback PDF generation
- `dist/kakutex-spec-v1.5.pdf` : compiled or fallback-generated PDF
- `Makefile` : local build entry point
- `Dockerfile` : reproducible PDF build environment
- `latexmkrc` : latexmk settings
- `examples/sample_note/` : sample `.texs` payload files
- `examples/sample_note.texs` : zipped example archive
- `examples/exported_sample.tex` : reference `.tex` export shape

## Build locally

### Option 1: native build

Requirements:

- `lualatex`
- TeX Live packages including Japanese support and extras

Build:

```bash
make all
```

Clean:

```bash
make clean
```

### Option 2: fallback build when `lualatex` is unavailable

```bash
python3 ../../tools/build_docs.py --spec-only
```

This keeps `spec/main.tex` as the source artifact and generates `dist/kakutex-spec-v1.5.pdf` from the markdown mirror.

### Option 3: Docker build

```bash
docker build -t kakutex-spec .
docker run --rm -v "$PWD":/work kakutex-spec
```

The output PDF is written to `dist/kakutex-spec-v1.5.pdf`.
