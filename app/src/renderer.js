import { computeHeadingNumbers, expandNoArgMacrosInMath, splitParagraphHardBreaks, tokenizeInlineMath, tokenizeTextCommands } from './preview-helpers.js';

function makeBlockShell(document, block, classes = []) {
  const wrapper = document.createElement('section');
  wrapper.className = ['preview-block', ...classes, block.type === 'heading' ? `heading-level-${Math.min(4, block.level)}` : ''].filter(Boolean).join(' ');
  wrapper.dataset.blockId = block.blockId;
  wrapper.dataset.lineStart = String(block.lineStart);
  wrapper.dataset.lineEnd = String(block.lineEnd);
  return wrapper;
}


function appendTextSegment(parent, document, segment) {
  for (const token of tokenizeTextCommands(segment)) {
    if (token.type === 'textCommand') {
      const span = document.createElement('span');
      span.className = 'inline-math-source text-command-source';
      span.textContent = token.source;
      span.setAttribute('aria-label', token.text);
      parent.append(span);
      continue;
    }
    if (token.text) parent.append(document.createTextNode(token.text));
  }
}

function appendTextWithBreaks(parent, document, text) {
  const segments = splitParagraphHardBreaks(text);
  segments.forEach((segment, index) => {
    if (index > 0) parent.append(document.createElement('br'));
    if (segment) appendTextSegment(parent, document, segment);
  });
}

function appendInlineContent(parent, document, text, userMacros) {
  const tokens = tokenizeInlineMath(text, userMacros);
  for (const token of tokens) {
    if (token.type === 'text') {
      appendTextWithBreaks(parent, document, token.text);
      continue;
    }
    const span = document.createElement('span');
    span.className = 'inline-math-source';
    span.textContent = token.source;
    parent.append(span);
  }
}

function appendHeadingContent(heading, document, title, number, userMacros) {
  if (number) {
    const numberSpan = document.createElement('span');
    numberSpan.className = 'heading-number';
    numberSpan.textContent = `${number} `;
    heading.append(numberSpan);
  }
  appendInlineContent(heading, document, title, userMacros);
}

function renderNestedBlock(block, document, userMacros) {
  if (block.type === 'heading') {
    const heading = document.createElement(`h${Math.min(4, block.level)}`);
    appendInlineContent(heading, document, block.title, userMacros);
    return heading;
  }
  if (block.type === 'paragraph') {
    const p = document.createElement('p');
    appendInlineContent(p, document, block.text, userMacros);
    return p;
  }
  if (block.type === 'math') {
    const div = document.createElement('div');
    div.className = 'math-block-source';
    div.textContent = expandNoArgMacrosInMath(block.text, userMacros);
    return div;
  }
  if (block.type === 'unsupported') {
    const pre = document.createElement('pre');
    pre.textContent = block.text;
    return pre;
  }
  const div = document.createElement('div');
  div.textContent = block.text ?? '';
  return div;
}

function renderBlock(block, document, localeStrings, options) {
  const userMacros = options.userMacros ?? {};
  const headingNumbers = options.headingNumbers ?? new Map();

  if (block.type === 'heading') {
    const wrapper = makeBlockShell(document, block, ['heading']);
    const tag = `h${Math.min(4, block.level)}`;
    const heading = document.createElement(tag);
    appendHeadingContent(heading, document, block.title, headingNumbers.get(block.blockId), userMacros);
    wrapper.append(heading);
    return wrapper;
  }

  if (block.type === 'paragraph') {
    const wrapper = makeBlockShell(document, block, ['paragraph']);
    const p = document.createElement('p');
    appendInlineContent(p, document, block.text, userMacros);
    wrapper.append(p);
    return wrapper;
  }

  if (block.type === 'math') {
    const wrapper = makeBlockShell(document, block, ['math']);
    const div = document.createElement('div');
    div.className = 'math-block-source';
    div.textContent = expandNoArgMacrosInMath(block.text, userMacros);
    wrapper.append(div);
    return wrapper;
  }

  if (block.type === 'list') {
    const wrapper = makeBlockShell(document, block, ['list']);
    const list = document.createElement(block.envName === 'enumerate' ? 'ol' : 'ul');
    for (const item of block.items) {
      const li = document.createElement('li');
      for (const child of item.blocks) {
        li.append(renderNestedBlock(child, document, userMacros));
      }
      list.append(li);
    }
    wrapper.append(list);
    return wrapper;
  }

  const wrapper = makeBlockShell(document, block, ['unsupported']);
  const title = document.createElement('strong');
  title.textContent = localeStrings.unsupported;
  const pre = document.createElement('pre');
  pre.textContent = block.text;
  wrapper.append(title, pre);
  return wrapper;
}

export function renderPreview(previewRoot, blocks, localeStrings, userMacros = {}) {
  previewRoot.replaceChildren();
  if (!blocks.length) {
    const empty = previewRoot.ownerDocument.createElement('div');
    empty.className = 'preview-empty';
    empty.textContent = localeStrings.emptyPreview;
    previewRoot.append(empty);
    return;
  }
  const headingNumbers = computeHeadingNumbers(blocks);
  for (const block of blocks) {
    previewRoot.append(renderBlock(block, previewRoot.ownerDocument, localeStrings, { userMacros, headingNumbers }));
  }
}
