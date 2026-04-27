import { TEXT_COMMAND_REPLACEMENTS } from './config.js';

function isCommandLetter(ch) {
  return /[A-Za-z@]/.test(ch ?? '');
}

function isEscaped(text, index) {
  let backslashes = 0;
  for (let i = index - 1; i >= 0 && text[i] === '\\'; i -= 1) {
    backslashes += 1;
  }
  return backslashes % 2 === 1;
}

export function expandNoArgMacrosInMath(source, userMacros = {}, maxPasses = 6) {
  let current = String(source ?? '');
  const macroMap = Object.fromEntries(
    Object.entries(userMacros ?? {}).filter(([name, body]) => typeof name === 'string' && typeof body === 'string' && body.length > 0)
  );
  if (!Object.keys(macroMap).length) return current;

  for (let pass = 0; pass < maxPasses; pass += 1) {
    let changed = false;
    let out = '';
    for (let i = 0; i < current.length;) {
      const ch = current[i];
      if (ch !== '\\') {
        out += ch;
        i += 1;
        continue;
      }
      const next = current[i + 1];
      if (!isCommandLetter(next)) {
        out += ch;
        i += 1;
        continue;
      }
      let j = i + 1;
      while (j < current.length && isCommandLetter(current[j])) {
        j += 1;
      }
      const name = current.slice(i + 1, j);
      if (Object.hasOwn(macroMap, name)) {
        out += macroMap[name];
        i = j;
        changed = true;
        continue;
      }
      out += current.slice(i, j);
      i = j;
    }
    current = out;
    if (!changed) break;
  }
  return current;
}

export function tokenizeInlineMath(text, userMacros = {}) {
  const source = String(text ?? '');
  const tokens = [];
  let buffer = '';
  let i = 0;

  const flushText = () => {
    if (!buffer) return;
    tokens.push({ type: 'text', text: buffer });
    buffer = '';
  };

  while (i < source.length) {
    const ch = source[i];

    if (ch === '$' && !isEscaped(source, i) && source[i + 1] !== '$') {
      let j = i + 1;
      while (j < source.length) {
        if (source[j] === '$' && !isEscaped(source, j) && source[j - 1] !== '$') break;
        j += 1;
      }
      if (j < source.length && source[j] === '$') {
        flushText();
        const body = source.slice(i + 1, j);
        tokens.push({
          type: 'math',
          source: `$${expandNoArgMacrosInMath(body, userMacros)}$`,
          delimiter: '$'
        });
        i = j + 1;
        continue;
      }
    }

    if (ch === '\\' && source[i + 1] === '(' && !isEscaped(source, i)) {
      let j = i + 2;
      while (j < source.length - 1) {
        if (source[j] === '\\' && source[j + 1] === ')' && !isEscaped(source, j)) break;
        j += 1;
      }
      if (j < source.length - 1 && source[j] === '\\' && source[j + 1] === ')') {
        flushText();
        const body = source.slice(i + 2, j);
        tokens.push({
          type: 'math',
          source: `\\(${expandNoArgMacrosInMath(body, userMacros)}\\)`,
          delimiter: '\\(\\)'
        });
        i = j + 2;
        continue;
      }
    }

    buffer += ch;
    i += 1;
  }

  flushText();
  return tokens;
}

export function splitParagraphHardBreaks(text) {
  return String(text ?? '').split(/\\\\/);
}

export function normalizeTextCommands(source) {
  const text = String(source ?? '');
  const entries = Object.entries(TEXT_COMMAND_REPLACEMENTS ?? {})
    .sort(([a], [b]) => b.length - a.length);
  if (!entries.length || !text.includes('\\')) return text;

  let out = '';
  for (let index = 0; index < text.length;) {
    if (text[index] !== '\\') {
      out += text[index];
      index += 1;
      continue;
    }

    let matched = false;
    for (const [name, replacement] of entries) {
      const command = `\\${name}`;
      if (!text.startsWith(command, index)) continue;
      const next = text[index + command.length];
      if (next && /[A-Za-z@]/.test(next)) continue;

      out += replacement;
      index += command.length;
      if (text.startsWith('{}', index)) index += 2;
      if (text[index] === '\\' && text[index + 1] === ' ') {
        out += ' ';
        index += 2;
      }
      matched = true;
      break;
    }

    if (!matched) {
      out += text[index];
      index += 1;
    }
  }
  return out;
}

export function tokenizeTextCommands(source) {
  const text = String(source ?? '');
  const entries = Object.entries(TEXT_COMMAND_REPLACEMENTS ?? {})
    .sort(([a], [b]) => b.length - a.length);
  if (!entries.length || !text.includes('\\')) return text ? [{ type: 'text', text }] : [];

  const tokens = [];
  let buffer = '';
  const flush = () => {
    if (!buffer) return;
    tokens.push({ type: 'text', text: buffer });
    buffer = '';
  };

  for (let index = 0; index < text.length;) {
    if (text[index] !== '\\') {
      buffer += text[index];
      index += 1;
      continue;
    }

    let matched = false;
    for (const [name, replacement] of entries) {
      const command = `\\${name}`;
      if (!text.startsWith(command, index)) continue;
      const next = text[index + command.length];
      if (next && /[A-Za-z@]/.test(next)) continue;

      flush();
      tokens.push({ type: 'textCommand', name, text: replacement, source: `$\\${name}$` });
      index += command.length;
      if (text.startsWith('{}', index)) index += 2;
      if (text[index] === '\\' && text[index + 1] === ' ') {
        buffer += ' ';
        index += 2;
      }
      matched = true;
      break;
    }

    if (!matched) {
      buffer += text[index];
      index += 1;
    }
  }

  flush();
  return tokens;
}

export function computeHeadingNumbers(blocks = []) {
  const counters = [0, 0, 0, 0];
  const labels = new Map();
  for (const block of blocks) {
    if (block?.type !== 'heading') continue;
    const level = Math.max(1, Math.min(4, Number(block.level) || 1));
    if (level === 4) {
      labels.set(block.blockId, '');
      continue;
    }
    for (let i = 0; i < level - 1; i += 1) {
      if (counters[i] === 0) counters[i] = 1;
    }
    counters[level - 1] += 1;
    for (let i = level; i < counters.length; i += 1) counters[i] = 0;
    labels.set(block.blockId, counters.slice(0, level).join('.'));
  }
  return labels;
}
