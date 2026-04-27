# KakuTeX User Manual

## 1. Overview

KakuTeX is a browser-based memo app for a TeX subset. You write source on the left and read the live preview on the right. It does not run an internal LaTeX compiler. Instead, it returns a readable preview that prioritizes fast feedback.


The disclaimer is included in Section 10 and is also linked from the Info dialog.

## 2. Startup

### 2.1 Local startup

KakuTeX is intended to be opened through a small static server instead of opening `app/index.html` directly. After extracting the bundle, run the following command at the project root.

```bash
python3 -m http.server 8000
```

Then open the following URL in the browser.

```text
http://127.0.0.1:8000/app/
```

This gives stable behavior for MathJax startup, fonts, save dialogs, print dialogs, and relative links. The initial sample also loads exactly as shipped, without unwanted leading indentation.

### 2.2 When opened through `file://`

If you open `app/index.html` directly from Finder or Explorer, the app runs through `file://`. The editor still appears, but math preview and printing may become unstable. If the startup banner appears, refer to this section and also to “10. Known limitations”.

In the current version, the startup banner links to the HTML help page anchored to “2.1 Local startup”. Full `file://` support remains a future improvement.

## 3. Screen layout

The screen is composed of the top menu, the optional input-assist toolbar, the left pane, the middle Sync buttons, and the right pane. The top menu keeps action buttons on the left and the KakuTeX name with version on the right. The upper part of the left pane is the main source editor. The lower part is the new-commands editor. The upper part of the right pane is the preview. The lower part is the diagnostics area. The runtime status message appears on the right side of the preview header instead of a footer bar. The Info button, or the version pill on the right, opens a dialog with the version, the author `Akio Tomiya (with ChatGPT5.4)`, the website link, and the development start date. The Help button opens the localized HTML manual in a new tab and jumps directly to “4. Basic operations”. The HTML manual also includes a link to the PDF version near the top.

The main source editor, the new-commands editor, the preview surface, and the diagnostics surface all scroll internally. When the document becomes long, use those internal scrollbars instead of relying on the full browser page.

The left editor uses a normal `textarea` to prioritize stable rendering across browsers. The earlier overlay-based highlight approach was removed because it could make text harder to read in some environments.

## 4. Basic operations

### 4.1 Create a new note

Press `New` to reset the app to the initial sample. If there are unsaved changes, the browser confirmation dialog appears before the reset.

### 4.2 Open a `.texs` archive

Use `Open .texs` to choose a saved archive. The current v1 app reliably reads the store-only ZIP-based `.texs` archives produced by itself.

### 4.3 Save a `.texs` archive

`Save .texs` stores the current body, macros, UI settings, and metadata in a single `.texs` archive. In supported browsers running under `https:` or `localhost` / `127.0.0.1`, the native save dialog opens so that you can choose the destination and file name. In unsupported environments, the app falls back to a normal browser download.

### 4.4 Export `.tex`

`Export .tex` creates a minimal `.tex` file. English-only notes stay lightweight. If Japanese text is detected in the body or in the macro editor, the exporter inserts `luatexja` only on the LuaLaTeX path. Supported browsers let you choose the destination and file name through the native save dialog.

The primary compilation path is the following.

```bash
lualatex exported_file.tex
```

An alternative DVI-based path is also possible.

```bash
uplatex exported_file.tex
# or
platex exported_file.tex

dvipdfmx exported_file.dvi
```

`pxjahyper` is not inserted by default. Add it yourself only if you later add `hyperref` and intentionally use a (u)pLaTeX workflow.

### 4.5 Export PDF

`Print / PDF` opens the browser print dialog for the current page. During printing, CSS hides the source editor, Sync buttons, and diagnostics so that the print layout focuses on the preview pane. From there, choose “Save as PDF” in the browser. This is not a LaTeX-typeset PDF. It is a PDF of the readable preview.

### 4.6 Undo

`Undo` restores the last snapshot for whichever editor you touched most recently. The body editor and the new-commands editor keep separate lightweight histories. The current version does not implement redo yet.

### 4.7 Input assist

Press `Input assist` to reveal a second toolbar below the main menu. The current version inserts the following snippets at the caret position.

- `Math`: `\begin{align} ... \end{align}`
- `Fraction`: `\frac{1}{2}`
- `Sum`: `\sum_{i=1}^{N}`
- `Integral`: `\int_{}^{} \mathrm{d}x`

Press the button again, now labeled `Simple`, to hide the second toolbar. The visible / hidden state is saved in autosave and in `.texs` through `ui.json`.

### 4.8 Change the UI language

At first launch, the UI language is chosen from the browser language. If the browser reports Japanese, the app starts in Japanese. Otherwise it starts in English. You can switch at any time with the language button on the right. The body text and macro text themselves are not rewritten.

### 4.9 About dialog

Press `Info`, or click the version pill on the right, to open an About-style dialog. It shows the current version, the development start date `2026-04-19`, the author `Akio Tomiya (with ChatGPT5.4)`, the author page link, and a link to the disclaimer. Use it when you need to confirm the bundle version or the public author metadata.

### 4.10 Help

`Help` opens the HTML manual in a new tab. When the UI is Japanese, it opens the Japanese manual. When the UI is English, it opens the English manual. The link jumps directly to “4. Basic operations” because that is usually the first section you need after launching the app. The HTML manual also links to the PDF version at the top.

## 5. Using Sync

The middle `→` button moves the preview to the block closest to the current cursor position in the source editor. The middle `←` button moves back from the selected preview block to the corresponding source position. You can also click a preview block directly and then jump back to the source.

Sync is block-based rather than character-based. It works at the level of paragraphs, headings, math blocks, and lists, so it does not attempt exact character-position matching.

## 6. Supported TeX subset

### 6.1 Headings

- `\section{...}`
- `\subsection{...}`
- `\subsubsection{...}`
- `\paragraph{...}`

The preview automatically adds heading numbers. `\paragraph` is rendered as its own small heading block, but it remains unnumbered.

### 6.2 Text commands

The current version handles `\LaTeX` and `\TeX` as text commands inside normal prose. This is a narrow feature intended to keep the shipped sample and ordinary notes readable.

### 6.3 Math

Inline math supports `$...$` and `\(...\)`. Display math supports `$$...$$`, `\[...\]`, `equation`, `equation*`, `align`, `align*`, `gather`, and `gather*`.

`eqnarray` and `eqnarray*` are previewed through a compatibility layer that maps them to an `align`-like form. This is mainly intended to rescue older notes. The diagnostics area reports that compatibility conversion.

Inside normal text, `\\` is treated as an explicit hard line break. Inside math it keeps its usual line-break role. `\slashed{...}` is provided as a built-in macro.

### 6.4 Lists

`itemize` and `enumerate` are supported. Inside each `\item`, you can write paragraphs, inline math, display math, and nested lists.

### 6.5 New commands

The new-commands editor accepts only no-argument `\newcommand` definitions. Typical examples are the following.

```tex
\newcommand{\Tr}{\operatorname{Tr}}
\newcommand{\Det}{\operatorname{Det}}
```

Argumented `\newcommand` remains unsupported in v1 and is treated as a warning. `\slashed{...}` is built in.

If document-level constructs such as `enumerate` or `\item` appear inside an `align` block, the app tries not to fail silently. Instead, it reports the issue through diagnostics. It also uses heuristics to flag inputs such as `$\info$`, a bare `#`, an incomplete `\frac_`, or `\item` outside `itemize` / `enumerate`.

## 7. Example input

This is the same English sample shown at first launch.

```tex
\section{Introduction}
KakuTeX is a web app for a subset of \LaTeX with fast rendering.\\
Hard line breaks work, and inline math such as $E=mc^2$ is supported.
日本語も使えます。

\subsection{Linear algebra}
\begin{align}
\Tr M &= 0 \\
\Det A &= 1 \\
\slashed{D} &= \gamma^\mu A_\mu \\
\int \mathrm{d}x \; \sin x &= -\cos x + C
\end{align}

\begin{itemize}
\item First bullet item
\item Second bullet item
\end{itemize}

\subsubsection{Subsubsection}
\paragraph{Paragraph} This is a short paragraph heading example.
```

The new-commands example is the following.

```tex
\newcommand{\Tr}{\operatorname{Tr}}
\newcommand{\Det}{\operatorname{Det}}
```

## 8. `.texs` format

`.texs` is a ZIP-based container. In the current version it stores the following four files.

- `body.tex`
- `macros.tex`
- `ui.json`
- `meta.json`

`ui.json` stores `locale` and `inputAssist`. `meta.json` stores values such as the format name, generator, creation time, update time, and file name.

## 9. Autosave and unsaved-change warnings

The editor content is autosaved to `localStorage`. If you try to close the browser window or tab with unsaved changes, the browser warning appears. The exact wording of that warning depends on the browser, so the app does not try to force custom long messages.

## 10. Known limitations

- Figures, bibliography, BibTeX, and complex LaTeX packages are not supported.
- `\newcommand` is limited to the no-argument form.
- Sync is block-based rather than character-based.
- PDF export is based on browser printing and is not a LaTeX-typeset PDF.
- `.texs` loading currently prioritizes the store-only archives saved by this app.
- The left editor intentionally uses a plain textarea and does not provide syntax coloring.
- `file://` direct opening continues with a warning banner, but full support is not complete yet. For stable use, follow “2.1 Local startup”.
- The visual appearance of `\slashed` is a simplified approximation rather than an exact LaTeX match for all possible arguments.
- The native save dialog for choosing the destination and file name is available only in supported browsers running in a secure context. Unsupported environments fall back to a browser download.
- Undo is currently one-way only. Redo is not implemented yet.


## 11. Disclaimer

This English manual contains the disclaimer in this section. The same disclaimer is linked from the Info dialog in English UI.

KakuTeX is a lightweight tool for research notes and personal memo writing. Its display output, math preview, `.tex` export, and browser-print PDF output are provided without any warranty of correctness, completeness, or fitness for a particular purpose. When you use it for research results, submissions, business documents, lecture notes, or any other important material, you must verify the content, formulas, diagnostics, exported `.tex`, and compiled PDF yourself.

This app does not implement all of LaTeX. It supports only a limited subset. Unsupported syntax, browser differences, MathJax behavior, TeX-engine differences, missing local packages, and browser-dependent save dialogs may cause output that differs from your expectations. The author and development assistants are not responsible for data loss, wrong notation, failed compilation, or research/business damage caused by use of KakuTeX.

If you enter confidential or personal information, you are responsible for checking the publication location, browser environment, save destination, `.texs` archive handling, and local storage behavior. KakuTeX is not designed around advertising, cloud storage, or external transmission, but access control and distribution management are the responsibility of the person who deploys it.
