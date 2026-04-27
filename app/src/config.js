export const APP_VERSION = '0.0.1';
export const APP_STARTED_AT = '2026-04-19';
export const APP_AUTHOR_NAME = 'Akio Tomiya (with ChatGPT5.4)';
export const APP_AUTHOR_URL = 'https://www2.yukawa.kyoto-u.ac.jp/~akio.tomiya/';
export const APP_STORAGE_KEY = 'kakutex.autosave.v1';
export const DEFAULT_FILE_NAME = 'note.texs';
export const EXPORT_TEX_NAME = 'note.tex';

export const SUPPORTED_MATH_ENVS = new Set([
  'equation', 'equation*',
  'align', 'align*',
  'gather', 'gather*',
  'aligned', 'gathered', 'split', 'alignat', 'alignat*',
  'eqnarray', 'eqnarray*'
]);

export const LIST_ENVS = new Set(['itemize', 'enumerate']);
export const HEADING_COMMANDS = ['section', 'subsection', 'subsubsection', 'paragraph'];

export const BUILTIN_MACROS = Object.freeze({
  slashed: [String.raw`{\not\!#1}`, 1]
});

export const DEFAULT_BODY = String.raw`\section{Introduction}
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
\paragraph{Paragraph} This is a short paragraph heading example.`;

export const DEFAULT_MACROS = String.raw`% no-argument macros only
\newcommand{\Tr}{\operatorname{Tr}}
\newcommand{\Det}{\operatorname{Det}}`;


export const INPUT_ASSIST_SNIPPETS = Object.freeze({
  math: {
    key: 'assistMath',
    text: String.raw`\begin{align}
  {{cursor}}
\end{align}`
  },
  frac: {
    key: 'assistFrac',
    text: String.raw`\frac{1}{2}{{cursor}}`
  },
  sum: {
    key: 'assistSum',
    text: String.raw`\sum_{i=1}^{N} {{cursor}}`
  },
  integral: {
    key: 'assistIntegral',
    text: String.raw`\int_{}^{} \mathrm{d}x {{cursor}}`
  }
});

export const TEXT_COMMAND_REPLACEMENTS = Object.freeze({
  LaTeX: 'LaTeX',
  TeX: 'TeX'
});
