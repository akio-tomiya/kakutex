import { escapeHtml } from './utils.js';

const COMMENT_RE = /(^|[^\\])(%.*$)/gm;
const ENV_RE = /(\\(?:begin|end)\{[^}]+\})/g;
const COMMAND_RE = /(\\(?:section|subsection|subsubsection|paragraph|item|newcommand)\b)/g;
const MACRO_RE = /(\\[A-Za-z@]+)/g;
const MATH_RE = /(\$\$|\$|\\\[|\\\]|\\\(|\\\))/g;
const BRACE_RE = /(\{|\})/g;

export function highlightSource(text) {
  let html = escapeHtml(String(text ?? ''));
  html = html.replace(COMMENT_RE, (_, lead, body) => `${lead}<span class="token-comment">${body}</span>`);
  html = html.replace(ENV_RE, '<span class="token-env">$1</span>');
  html = html.replace(COMMAND_RE, '<span class="token-command">$1</span>');
  html = html.replace(MATH_RE, '<span class="token-math">$1</span>');
  html = html.replace(BRACE_RE, '<span class="token-brace">$1</span>');
  html = html.replace(MACRO_RE, '<span class="token-macro">$1</span>');
  return html + (html.endsWith('\n') ? '' : '\n');
}
