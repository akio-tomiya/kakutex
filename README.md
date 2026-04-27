# KakuTeX v0.0.1

KakuTeX is a lightweight browser-based editor for practical LaTeX-like technical notes.
It focuses on a small TeX subset, fast live preview, `.tex` export, browser-print PDF export, `.texs` archive save/load, and block-level Sync between source and preview.

This is a **public preview** release. It is designed for quick technical and mathematical notes, not for full LaTeX document production.

The project follows the original goal of a browser-based TeX subset memo app with live preview, export, PDF output, archive I/O, and source/preview Sync. See the project notes and bundled documentation for details.

## Try locally

From the repository root:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://127.0.0.1:8000/app/
```

Opening `app/index.html` directly through `file://` may work for editing, but MathJax, printing, and relative help links are more reliable through a local static server.

## Deploy with GitHub Pages

If you push this repository to GitHub and enable GitHub Pages from the repository root, the app should be available at:

```text
https://<user-or-org>.github.io/<repo>/app/
```

The `.nojekyll` file is included so GitHub Pages serves the static files directly.

The public app needs both `app/` and `docs/` at the same relative level because Help and Info links point into `docs/user_manual/`.

## What works in v0.0.1

- TeX-subset source editor
- MathJax-based live preview
- `\section`, `\subsection`, `\subsubsection`, and unnumbered `\paragraph` preview headings
- Inline math and common display math environments
- `itemize` and `enumerate`
- no-argument `\newcommand`
- built-in `\slashed{...}` preview macro
- text commands such as `\LaTeX` and `\TeX`
- diagnostics for common incomplete or misplaced constructs
- `.texs` save/load as a ZIP-style archive
- `.tex` export
- browser print / PDF export from the preview
- block-level source/preview Sync
- Japanese / English UI
- Help and About dialogs
- Undo and a small input-assist toolbar

## What KakuTeX is not

KakuTeX is **not** a full LaTeX compiler and does not try to reproduce strict LaTeX page layout.
It does not support figures, BibTeX, complex packages, full source/PDF position synchronization, or real internal LaTeX compilation.

The preview is meant for fast reading while drafting. For important documents, export `.tex` and compile/check it in your own TeX environment.

## `.tex` export and TeX engines

The primary tested local compile path is:

```bash
lualatex exported_file.tex
```

If Japanese text is detected, KakuTeX inserts `luatexja` conditionally only on the LuaLaTeX path.
An alternative DVI-based path is:

```bash
uplatex exported_file.tex
# or
platex exported_file.tex

dvipdfmx exported_file.dvi
```

`pxjahyper` is **not** inserted by default. Add it yourself only if you later add `hyperref` and intentionally use a (u)pLaTeX workflow.

## Analytics

KakuTeX v0.0.1 does not include an in-app analytics script.
Basic repository traffic may be checked through GitHub Insights.

## Repository layout

```text
app/                 Public web app entry point and bundled MathJax
app/src/             Source modules used to build app/app.bundle.js
docs/user_manual/    User manuals, HTML and PDF
docs/admin_manual/   Deployment/admin manual, HTML and PDF
docs/spec/           Specification source and generated PDF
examples/            Example body/macros/exported TeX/.texs archive
tests/               Unit and smoke tests
tools/               Build, document, screenshot, and package helpers
third_party/         Third-party license files
```

## Development commands

```bash
npm test
npm run smoke
npm run build:bundle
npm run docs
npm run package
```

## License

KakuTeX itself is released under the MIT License.
Bundled MathJax files are distributed under the Apache License 2.0; see `THIRD_PARTY_NOTICES.md` and `third_party/LICENSE-mathjax.txt`.

KakuTeX is not affiliated with the TeX Users Group, the LaTeX Project, or MathJax.

Author: Akio Tomiya
Developed with assistance from ChatGPT.
