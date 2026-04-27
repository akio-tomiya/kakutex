import { HEADING_COMMANDS, LIST_ENVS, SUPPORTED_MATH_ENVS, TEXT_COMMAND_REPLACEMENTS } from './config.js';
import { countUnescapedInlineDollars, linesWithOffsets, stripComment } from './utils.js';

function headingLevelFor(command) {
  return {
    section: 1,
    subsection: 2,
    subsubsection: 3,
    paragraph: 4
  }[command] ?? 1;
}

function headingRegex(command) {
  return new RegExp(`^\\\\${command}\\{([\\s\\S]*)\\}(.*)$`);
}

class LineStream {
  constructor(text) {
    const { lines, offsets } = linesWithOffsets(text);
    this.lines = lines;
    this.offsets = offsets;
    this.index = 0;
  }

  eof() {
    return this.index >= this.lines.length;
  }

  peek(offset = 0) {
    return this.lines[this.index + offset] ?? null;
  }

  currentLineNumber() {
    return this.index + 1;
  }

  advance(step = 1) {
    this.index += step;
  }

  rawLineAt(lineNumber) {
    return this.lines[lineNumber - 1] ?? '';
  }

  offsetForLine(lineNumber) {
    return this.offsets[lineNumber - 1] ?? 0;
  }

  endOffsetForLine(lineNumber) {
    const idx = lineNumber - 1;
    return (this.offsets[idx] ?? 0) + (this.lines[idx]?.length ?? 0);
  }
}

function makeBlock(type, lineStart, lineEnd, offsetStart, offsetEnd, data = {}) {
  return { type, lineStart, lineEnd, offsetStart, offsetEnd, ...data };
}

function createDiagnostic(key, severity, lineStart, lineEnd, detail = '') {
  return { key, severity, lineStart, lineEnd, detail };
}

function isBlank(line) {
  return stripComment(line ?? '').trim() === '';
}

function matchHeading(line) {
  const trimmed = stripComment(line ?? '').trim();
  for (const command of HEADING_COMMANDS) {
    const match = trimmed.match(headingRegex(command));
    if (match) {
      return {
        command,
        level: headingLevelFor(command),
        title: match[1].trim(),
        trailing: match[2].trim()
      };
    }
  }
  return null;
}

function matchBeginEnv(line) {
  const trimmed = stripComment(line ?? '').trim();
  const match = trimmed.match(/^\\begin\{([^}]+)\}/);
  if (!match) return null;
  return match[1];
}

function matchEndEnv(line) {
  const trimmed = stripComment(line ?? '').trim();
  const match = trimmed.match(/^\\end\{([^}]+)\}/);
  if (!match) return null;
  return match[1];
}

function collectUntilEnd(stream, envName) {
  const startLine = stream.currentLineNumber();
  const lines = [];
  let endLine = startLine;
  while (!stream.eof()) {
    const raw = stream.peek();
    lines.push(raw);
    endLine = stream.currentLineNumber();
    const closed = matchEndEnv(raw) === envName;
    stream.advance();
    if (closed) {
      return { lines, startLine, endLine, closed: true };
    }
  }
  return { lines, startLine, endLine, closed: false };
}

const COMMON_MATH_COMMANDS = new Set([
  'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'varepsilon', 'zeta', 'eta', 'theta', 'vartheta',
  'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'pi', 'varpi', 'rho', 'varrho', 'sigma', 'varsigma',
  'tau', 'upsilon', 'phi', 'varphi', 'chi', 'psi', 'omega',
  'Gamma', 'Delta', 'Theta', 'Lambda', 'Xi', 'Pi', 'Sigma', 'Upsilon', 'Phi', 'Psi', 'Omega',
  'sin', 'cos', 'tan', 'csc', 'sec', 'cot', 'sinh', 'cosh', 'tanh', 'arcsin', 'arccos', 'arctan',
  'log', 'ln', 'exp', 'det', 'dim', 'ker', 'min', 'max', 'sup', 'inf', 'lim', 'operatorname',
  'mathrm', 'mathbf', 'mathit', 'mathsf', 'mathtt', 'boldsymbol', 'vec', 'hat', 'bar', 'tilde',
  'dot', 'ddot', 'overline', 'underline', 'left', 'right', 'bigl', 'bigr', 'Bigl', 'Bigr',
  'frac', 'dfrac', 'tfrac', 'sqrt', 'sum', 'prod', 'int', 'iint', 'iiint', 'oint', 'partial',
  'cdot', 'times', 'pm', 'mp', 'leq', 'geq', 'neq', 'approx', 'sim', 'to', 'rightarrow', 'leftarrow',
  'mapsto', 'infty', 'ldots', 'cdots', 'vdots', 'ddots', 'qquad', 'quad', 'text', 'label', 'tag',
  'begin', 'end', 'not', 'slashed', 'LaTeX', 'TeX'
]);

function hasUnescapedHash(text) {
  const source = String(text ?? '');
  for (let i = 0; i < source.length; i += 1) {
    if (source[i] !== '#') continue;
    let backslashes = 0;
    for (let j = i - 1; j >= 0 && source[j] === '\\'; j -= 1) backslashes += 1;
    if (backslashes % 2 === 0) return true;
  }
  return false;
}

function extractInlineMathBodies(text) {
  const source = String(text ?? '');
  const parts = [];
  let i = 0;
  while (i < source.length) {
    if (source[i] === '$' && source[i + 1] !== '$') {
      let j = i + 1;
      while (j < source.length) {
        if (source[j] === '$' && source[j - 1] !== '\\') break;
        j += 1;
      }
      if (j < source.length) {
        parts.push(source.slice(i + 1, j));
        i = j + 1;
        continue;
      }
    }
    if (source[i] === '\\' && source[i + 1] === '(') {
      let j = i + 2;
      while (j < source.length - 1) {
        if (source[j] === '\\' && source[j + 1] === ')' && source[j - 1] !== '\\') break;
        j += 1;
      }
      if (j < source.length - 1) {
        parts.push(source.slice(i + 2, j));
        i = j + 2;
        continue;
      }
    }
    i += 1;
  }
  return parts;
}

function inspectMathSource(source, lineStart, lineEnd, userMacros = {}, options = {}) {
  const diagnostics = [];
  const macroNames = new Set(Object.keys(userMacros ?? {}));
  const ignoreCommands = options.ignoreCommands ?? new Set();
  const text = String(source ?? '');
  const seenUnknown = new Set();

  if (hasUnescapedHash(text)) {
    diagnostics.push(createDiagnostic('diagIllegalHash', 'error', lineStart, lineEnd, '#'));
  }
  if (/\\(?:dfrac|tfrac|frac)(?!\s*\{)/.test(text)) {
    diagnostics.push(createDiagnostic('diagFracSyntax', 'error', lineStart, lineEnd, '\\frac'));
  }

  const commandRe = /\\([A-Za-z]+)\b/g;
  let match;
  while ((match = commandRe.exec(text)) !== null) {
    const name = match[1];
    if (COMMON_MATH_COMMANDS.has(name) || macroNames.has(name) || ignoreCommands.has(name)) continue;
    if (seenUnknown.has(name)) continue;
    seenUnknown.add(name);
    diagnostics.push(createDiagnostic('diagUnknownMathCommand', 'error', lineStart, lineEnd, `\\${name}`));
  }

  return diagnostics;
}

function collectDelimitedMath(stream, startToken, endToken) {
  const startLine = stream.currentLineNumber();
  const lines = [];
  let endLine = startLine;
  let closed = false;
  while (!stream.eof()) {
    const raw = stream.peek();
    lines.push(raw);
    endLine = stream.currentLineNumber();
    const stripped = stripComment(raw);
    stream.advance();
    if (stripped.includes(endToken) && (startLine !== endLine || stripped.indexOf(endToken) > stripped.indexOf(startToken))) {
      closed = true;
      break;
    }
  }
  return { lines, startLine, endLine, closed };
}

function transformEqnarray(raw) {
  const renamed = raw
    .replace(/\\begin\{eqnarray\*\}/, '\\begin{align*}')
    .replace(/\\end\{eqnarray\*\}/, '\\end{align*}')
    .replace(/\\begin\{eqnarray\}/, '\\begin{align}')
    .replace(/\\end\{eqnarray\}/, '\\end{align}');
  return renamed
    .replace(/&\s*=\s*&/g, '&=')
    .replace(/&\s*\\leq\s*&/g, '&\\leq')
    .replace(/&\s*\\geq\s*&/g, '&\\geq');
}

function inspectMathEnvironment(lines, envName, startLine, lineOffset, userMacros = {}) {
  const diagnostics = [];
  const lastIndex = lines.length - 1;
  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index];
    const stripped = stripComment(raw).trim();
    if (!stripped) continue;
    const isBoundaryLine = index === 0 || index === lastIndex;
    const beginEnv = matchBeginEnv(raw);
    const endEnv = matchEndEnv(raw);
    const absoluteLine = startLine + index + lineOffset;

    if (beginEnv && (!isBoundaryLine || beginEnv !== envName) && !SUPPORTED_MATH_ENVS.has(beginEnv)) {
      diagnostics.push(createDiagnostic('diagMathNestedEnv', 'error', absoluteLine, absoluteLine, `\\begin{${beginEnv}}`));
    }

    if (endEnv && (!isBoundaryLine || endEnv !== envName) && !SUPPORTED_MATH_ENVS.has(endEnv)) {
      diagnostics.push(createDiagnostic('diagMathNestedEnv', 'error', absoluteLine, absoluteLine, `\\end{${endEnv}}`));
    }

    if (/^\\item\b/.test(stripped)) {
      diagnostics.push(createDiagnostic('diagMathItem', 'error', absoluteLine, absoluteLine, '\\item'));
    }

    if (!isBoundaryLine) {
      diagnostics.push(...inspectMathSource(stripped, absoluteLine, absoluteLine, userMacros, { ignoreCommands: new Set([envName.replace(/\*$/, '')]) }));
    }
  }
  return diagnostics;
}

function inspectParagraphLines(lines, startLine, lineOffset, userMacros = {}) {
  const diagnostics = [];
  for (let index = 0; index < lines.length; index += 1) {
    const stripped = stripComment(lines[index]).trim();
    if (!stripped) continue;
    const absoluteLine = startLine + index + lineOffset;
    if (/^\\item\b/.test(stripped)) {
      diagnostics.push(createDiagnostic('diagItemOutsideList', 'error', absoluteLine, absoluteLine, '\\item'));
      continue;
    }
    if (hasUnescapedHash(stripped)) {
      diagnostics.push(createDiagnostic('diagIllegalHash', 'error', absoluteLine, absoluteLine, '#'));
      continue;
    }
    if (/^\\(?:dfrac|tfrac|frac)(?:_|\s|$)/.test(stripped) && !/^\\(?:dfrac|tfrac|frac)\s*\{/.test(stripped)) {
      diagnostics.push(createDiagnostic('diagFracSyntax', 'error', absoluteLine, absoluteLine, stripped));
      continue;
    }
    const commandAtStart = stripped.match(/^\\([A-Za-z]+)\b/);
    if (commandAtStart && !matchHeading(stripped) && !matchBeginEnv(stripped) && !matchEndEnv(stripped)) {
      const name = commandAtStart[1];
      if (!Object.hasOwn(userMacros ?? {}, name) && !Object.hasOwn(TEXT_COMMAND_REPLACEMENTS ?? {}, name)) {
        diagnostics.push(createDiagnostic('diagUnknownTextCommand', 'warning', absoluteLine, absoluteLine, `\\${name}`));
      }
    }
    for (const body of extractInlineMathBodies(stripped)) {
      diagnostics.push(...inspectMathSource(body, absoluteLine, absoluteLine, userMacros));
    }
  }
  return diagnostics;
}

function parseParagraph(stream) {
  const startLine = stream.currentLineNumber();
  const lines = [];
  while (!stream.eof()) {
    const raw = stream.peek();
    if (isBlank(raw)) break;
    if (matchHeading(raw)) break;
    const beginEnv = matchBeginEnv(raw);
    if (beginEnv || stripComment(raw).trim().startsWith('$$') || stripComment(raw).trim().startsWith('\\[')) break;
    lines.push(stripComment(raw).replace(/\s+$/, ''));
    stream.advance();
  }
  const joined = lines.join('\n').trim();
  const endLine = Math.max(startLine, stream.currentLineNumber() - 1);
  return { text: joined, startLine, endLine };
}

function parseList(stream, envName, diagnostics, userMacros = {}) {
  const beginLine = stream.currentLineNumber();
  stream.advance();
  const items = [];
  let closed = false;

  while (!stream.eof()) {
    const raw = stream.peek();
    const stripped = stripComment(raw).trim();
    if (!stripped) {
      stream.advance();
      continue;
    }
    if (matchEndEnv(raw) === envName) {
      closed = true;
      const endLine = stream.currentLineNumber();
      stream.advance();
      return { items, beginLine, endLine, closed };
    }
    if (!stripped.startsWith('\\item')) {
      diagnostics.push(createDiagnostic('diagUnknownBlock', 'info', stream.currentLineNumber(), stream.currentLineNumber(), stripped));
      stream.advance();
      continue;
    }
    const itemStart = stream.currentLineNumber();
    const firstLine = stripped.replace(/^\\item\s*/, '');
    stream.advance();
    const itemLines = [];
    if (firstLine) itemLines.push(firstLine);
    let depth = 0;
    while (!stream.eof()) {
      const look = stream.peek();
      const lookStripped = stripComment(look).trim();
      const beginEnv = matchBeginEnv(look);
      const endEnv = matchEndEnv(look);
      if (depth === 0 && (lookStripped.startsWith('\\item') || endEnv === envName)) {
        break;
      }
      if (LIST_ENVS.has(beginEnv)) depth += 1;
      if (LIST_ENVS.has(endEnv) && depth > 0) depth -= 1;
      itemLines.push(look);
      stream.advance();
    }
    const itemText = itemLines.join('\n');
    const parsed = parseDocument(itemText, { lineOffset: itemStart - 1, userMacros });
    items.push({
      lineStart: itemStart,
      lineEnd: itemStart + itemLines.length,
      blocks: parsed.blocks,
      diagnostics: parsed.diagnostics
    });
    diagnostics.push(...parsed.diagnostics);
  }

  return { items, beginLine, endLine: stream.currentLineNumber(), closed };
}

export function parseDocument(text, options = {}) {
  const stream = new LineStream(text);
  const diagnostics = [];
  const blocks = [];
  const lineOffset = options.lineOffset ?? 0;
  const userMacros = options.userMacros ?? {};

  while (!stream.eof()) {
    const raw = stream.peek();
    const lineNumber = stream.currentLineNumber();

    if (isBlank(raw)) {
      stream.advance();
      continue;
    }

    const heading = matchHeading(raw);
    if (heading) {
      const offsetStart = stream.offsetForLine(lineNumber);
      const offsetEnd = stream.endOffsetForLine(lineNumber);
      blocks.push(makeBlock(
        'heading',
        lineNumber + lineOffset,
        lineNumber + lineOffset,
        offsetStart,
        offsetEnd,
        { level: heading.level, title: heading.title }
      ));
      stream.advance();
      if (heading.trailing) {
        blocks.push(makeBlock(
          'paragraph',
          lineNumber + lineOffset,
          lineNumber + lineOffset,
          offsetStart,
          offsetEnd,
          { text: heading.trailing }
        ));
      }
      continue;
    }

    const beginEnv = matchBeginEnv(raw);
    if (beginEnv && LIST_ENVS.has(beginEnv)) {
      const parsedList = parseList(stream, beginEnv, diagnostics, userMacros);
      const offsetStart = stream.offsetForLine(parsedList.beginLine);
      const offsetEnd = stream.endOffsetForLine(parsedList.endLine);
      blocks.push(makeBlock(
        'list',
        parsedList.beginLine + lineOffset,
        parsedList.endLine + lineOffset,
        offsetStart,
        offsetEnd,
        { envName: beginEnv, items: parsedList.items }
      ));
      if (!parsedList.closed) {
        diagnostics.push(createDiagnostic('diagUnclosedEnv', 'error', parsedList.beginLine + lineOffset, parsedList.endLine + lineOffset, beginEnv));
      }
      continue;
    }

    if (beginEnv && SUPPORTED_MATH_ENVS.has(beginEnv)) {
      const collected = collectUntilEnd(stream, beginEnv);
      let rawText = collected.lines.join('\n');
      if (beginEnv.startsWith('eqnarray')) {
        rawText = transformEqnarray(rawText);
        diagnostics.push(createDiagnostic('diagEqnarray', 'info', collected.startLine + lineOffset, collected.endLine + lineOffset, beginEnv));
      }
      diagnostics.push(...inspectMathEnvironment(collected.lines, beginEnv, collected.startLine, lineOffset, userMacros));
      if (!collected.closed) {
        diagnostics.push(createDiagnostic('diagUnclosedEnv', 'error', collected.startLine + lineOffset, collected.endLine + lineOffset, beginEnv));
      }
      blocks.push(makeBlock(
        'math',
        collected.startLine + lineOffset,
        collected.endLine + lineOffset,
        stream.offsetForLine(collected.startLine),
        stream.endOffsetForLine(collected.endLine),
        { text: rawText, display: true, envName: beginEnv }
      ));
      continue;
    }

    if (beginEnv && !LIST_ENVS.has(beginEnv)) {
      const collected = collectUntilEnd(stream, beginEnv);
      const rawText = collected.lines.join('\n');
      diagnostics.push(createDiagnostic('diagUnsupportedEnv', 'warning', collected.startLine + lineOffset, collected.endLine + lineOffset, beginEnv));
      if (!collected.closed) {
        diagnostics.push(createDiagnostic('diagUnclosedEnv', 'error', collected.startLine + lineOffset, collected.endLine + lineOffset, beginEnv));
      }
      blocks.push(makeBlock(
        'unsupported',
        collected.startLine + lineOffset,
        collected.endLine + lineOffset,
        stream.offsetForLine(collected.startLine),
        stream.endOffsetForLine(collected.endLine),
        { text: rawText, envName: beginEnv }
      ));
      continue;
    }

    const stripped = stripComment(raw).trim();
    if (stripped.startsWith('$$')) {
      const collected = collectDelimitedMath(stream, '$$', '$$');
      if (!collected.closed) {
        diagnostics.push(createDiagnostic('diagUnclosedEnv', 'error', collected.startLine + lineOffset, collected.endLine + lineOffset, '$$'));
      }
      diagnostics.push(...inspectMathSource(collected.lines.join('\n'), collected.startLine + lineOffset, collected.endLine + lineOffset, userMacros));
      blocks.push(makeBlock(
        'math',
        collected.startLine + lineOffset,
        collected.endLine + lineOffset,
        stream.offsetForLine(collected.startLine),
        stream.endOffsetForLine(collected.endLine),
        { text: collected.lines.join('\n'), display: true, envName: '$$' }
      ));
      continue;
    }

    if (stripped.startsWith('\\[')) {
      const collected = collectDelimitedMath(stream, '\\[', '\\]');
      if (!collected.closed) {
        diagnostics.push(createDiagnostic('diagUnclosedEnv', 'error', collected.startLine + lineOffset, collected.endLine + lineOffset, '\\['));
      }
      diagnostics.push(...inspectMathSource(collected.lines.join('\n'), collected.startLine + lineOffset, collected.endLine + lineOffset, userMacros));
      blocks.push(makeBlock(
        'math',
        collected.startLine + lineOffset,
        collected.endLine + lineOffset,
        stream.offsetForLine(collected.startLine),
        stream.endOffsetForLine(collected.endLine),
        { text: collected.lines.join('\n'), display: true, envName: '\\[' }
      ));
      continue;
    }

    const paragraph = parseParagraph(stream);
    if (paragraph.text) {
      if (countUnescapedInlineDollars(paragraph.text) % 2 === 1) {
        diagnostics.push(createDiagnostic('diagOddDollar', 'warning', paragraph.startLine + lineOffset, paragraph.endLine + lineOffset, paragraph.text));
      }
      diagnostics.push(...inspectParagraphLines(paragraph.text.split('\n'), paragraph.startLine, lineOffset, userMacros));
      blocks.push(makeBlock(
        'paragraph',
        paragraph.startLine + lineOffset,
        paragraph.endLine + lineOffset,
        stream.offsetForLine(paragraph.startLine),
        stream.endOffsetForLine(paragraph.endLine),
        { text: paragraph.text }
      ));
    } else {
      stream.advance();
    }
  }

  return { blocks, diagnostics };
}
