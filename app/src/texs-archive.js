import { APP_VERSION, DEFAULT_FILE_NAME } from './config.js';
import { normalizeNewlines, serializeJson, todayIso } from './utils.js';

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function uint16LE(value) {
  return [value & 0xff, (value >>> 8) & 0xff];
}

function uint32LE(value) {
  return [value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff];
}

function concatArrays(chunks) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

function encodeUtf8(text) {
  return new TextEncoder().encode(text);
}

function decodeUtf8(bytes) {
  return new TextDecoder().decode(bytes);
}

export function buildTexsArchive({ body, macros, ui, meta }) {
  const entries = [
    {
      name: 'body.tex',
      bytes: encodeUtf8(normalizeNewlines(body))
    },
    {
      name: 'macros.tex',
      bytes: encodeUtf8(normalizeNewlines(macros))
    },
    {
      name: 'ui.json',
      bytes: encodeUtf8(serializeJson(ui))
    },
    {
      name: 'meta.json',
      bytes: encodeUtf8(serializeJson({
        format: 'texs',
        version: 1,
        generator: `kakutex ${APP_VERSION}`,
        createdAt: meta?.createdAt ?? todayIso(),
        updatedAt: todayIso(),
        fileName: meta?.fileName ?? DEFAULT_FILE_NAME,
        ...meta
      }))
    }
  ];

  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encodeUtf8(entry.name);
    const crc = crc32(entry.bytes);
    const localHeader = new Uint8Array([
      ...uint32LE(0x04034b50),
      ...uint16LE(20),
      ...uint16LE(0x0800),
      ...uint16LE(0),
      ...uint16LE(0), ...uint16LE(0),
      ...uint32LE(crc),
      ...uint32LE(entry.bytes.length),
      ...uint32LE(entry.bytes.length),
      ...uint16LE(nameBytes.length),
      ...uint16LE(0)
    ]);
    const localRecord = concatArrays([localHeader, nameBytes, entry.bytes]);
    localParts.push(localRecord);

    const centralHeader = new Uint8Array([
      ...uint32LE(0x02014b50),
      ...uint16LE(20),
      ...uint16LE(20),
      ...uint16LE(0x0800),
      ...uint16LE(0),
      ...uint16LE(0), ...uint16LE(0),
      ...uint32LE(crc),
      ...uint32LE(entry.bytes.length),
      ...uint32LE(entry.bytes.length),
      ...uint16LE(nameBytes.length),
      ...uint16LE(0),
      ...uint16LE(0),
      ...uint16LE(0),
      ...uint16LE(0),
      ...uint32LE(0),
      ...uint32LE(offset)
    ]);
    const centralRecord = concatArrays([centralHeader, nameBytes]);
    centralParts.push(centralRecord);
    offset += localRecord.length;
  }

  const centralDirectory = concatArrays(centralParts);
  const endRecord = new Uint8Array([
    ...uint32LE(0x06054b50),
    ...uint16LE(0), ...uint16LE(0),
    ...uint16LE(entries.length),
    ...uint16LE(entries.length),
    ...uint32LE(centralDirectory.length),
    ...uint32LE(offset),
    ...uint16LE(0)
  ]);

  return new Blob([concatArrays([...localParts, centralDirectory, endRecord])], { type: 'application/zip' });
}

function readU16(view, offset) {
  return view.getUint16(offset, true);
}

function readU32(view, offset) {
  return view.getUint32(offset, true);
}

export async function parseTexsArchive(file) {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i -= 1) {
    if (readU32(view, i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) {
    throw new Error('EOCD not found');
  }

  const count = readU16(view, eocd + 10);
  const centralOffset = readU32(view, eocd + 16);
  let cursor = centralOffset;
  const entries = {};

  for (let i = 0; i < count; i += 1) {
    if (readU32(view, cursor) !== 0x02014b50) {
      throw new Error('Central directory entry missing');
    }
    const compression = readU16(view, cursor + 10);
    const compressedSize = readU32(view, cursor + 20);
    const fileNameLength = readU16(view, cursor + 28);
    const extraLength = readU16(view, cursor + 30);
    const commentLength = readU16(view, cursor + 32);
    const localOffset = readU32(view, cursor + 42);
    const nameBytes = bytes.slice(cursor + 46, cursor + 46 + fileNameLength);
    const name = decodeUtf8(nameBytes);

    if (readU32(view, localOffset) !== 0x04034b50) {
      throw new Error('Local header missing');
    }
    const localCompression = readU16(view, localOffset + 8);
    const localNameLength = readU16(view, localOffset + 26);
    const localExtraLength = readU16(view, localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const dataEnd = dataStart + compressedSize;

    if (compression !== 0 || localCompression !== 0) {
      throw new Error('Only store method is supported in v1');
    }
    entries[name] = decodeUtf8(bytes.slice(dataStart, dataEnd));
    cursor += 46 + fileNameLength + extraLength + commentLength;
  }

  return {
    body: entries['body.tex'] ?? '',
    macros: entries['macros.tex'] ?? '',
    ui: entries['ui.json'] ? JSON.parse(entries['ui.json']) : {},
    meta: entries['meta.json'] ? JSON.parse(entries['meta.json']) : {}
  };
}
