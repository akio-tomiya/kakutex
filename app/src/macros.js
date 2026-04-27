import { BUILTIN_MACROS } from './config.js';
import { stripComment } from './utils.js';

const MACRO_RE = /^\\newcommand\s*\{\\([A-Za-z@]+)\}\s*(?:\[(\d+)\])?\s*\{([\s\S]*)\}\s*$/;
const RESERVED_NAMES = new Set(Object.keys(BUILTIN_MACROS));

export function parseMacros(source) {
  const diagnostics = [];
  const map = {};
  const rawLines = String(source ?? '').split(/\n/);

  for (let index = 0; index < rawLines.length; index += 1) {
    const raw = rawLines[index];
    const text = stripComment(raw).trim();
    if (!text) continue;
    const match = text.match(MACRO_RE);
    if (!match) {
      diagnostics.push({
        severity: 'warning',
        lineStart: index + 1,
        lineEnd: index + 1,
        key: 'diagMacroSyntax',
        detail: raw
      });
      continue;
    }
    const [, name, argCount, body] = match;
    if (argCount && Number(argCount) > 0) {
      diagnostics.push({
        severity: 'warning',
        lineStart: index + 1,
        lineEnd: index + 1,
        key: 'diagMacroArgs',
        detail: `\\${name}`
      });
      continue;
    }
    if (RESERVED_NAMES.has(name)) {
      diagnostics.push({
        severity: 'warning',
        lineStart: index + 1,
        lineEnd: index + 1,
        key: 'diagMacroReserved',
        detail: `\\${name}`
      });
      continue;
    }
    if (Object.hasOwn(map, name)) {
      diagnostics.push({
        severity: 'info',
        lineStart: index + 1,
        lineEnd: index + 1,
        key: 'diagMacroDuplicate',
        detail: `\\${name}`
      });
    }
    map[name] = body;
  }

  return {
    macros: map,
    builtins: BUILTIN_MACROS,
    diagnostics
  };
}

export function mergedMathJaxMacros(userMacros) {
  return {
    ...Object.fromEntries(Object.entries(userMacros).map(([name, body]) => [name, body])),
    ...BUILTIN_MACROS
  };
}
