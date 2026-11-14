// Browser-safe uint8-util shim for parse-torrent 11+.
// Avoids Web Crypto (crypto.subtle is unavailable on plain HTTP)
// and avoids Uint8Array.prototype.toHex / toBase64.
import Rusha from 'rusha';

const rusha = new Rusha();
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const text2arr = (str) => encoder.encode(str);

export const arr2text = (data, enc) => {
  if (!enc) return decoder.decode(data);
  return new TextDecoder(enc).decode(data);
};

export const arr2base = (data) =>
  Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString('base64');

export const base2arr = (str) => {
  const buf = Buffer.from(str, 'base64');
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
};

export const arr2hex = (data) =>
  Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString('hex');

export const hex2arr = (str) => {
  const buf = Buffer.from(str, 'hex');
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
};

export const hex2bin = (hex) => Buffer.from(hex, 'hex').toString('binary');

export const bin2hex = (bin) => Buffer.from(bin, 'binary').toString('hex');

export async function hash(data, format) {
  const bytes =
    typeof data === 'string'
      ? text2arr(data)
      : data instanceof ArrayBuffer
        ? new Uint8Array(data)
        : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  const hex = rusha.digest(Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength));
  if (format === 'hex') return hex;
  const out = hex2arr(hex);
  if (format === 'base64') return arr2base(out);
  return out;
}

export const randomBytes = (size) => crypto.getRandomValues(new Uint8Array(size));

export function concat(chunks, size = 0) {
  const length = chunks.length;
  if (!size) {
    for (let i = 0; i < length; i++) size += chunks[i].length;
  }
  const b = new Uint8Array(size);
  let offset = 0;
  for (let i = 0; i < length; i++) {
    b.set(chunks[i], offset);
    offset += chunks[i].length;
  }
  return b;
}

export function equal(a, b) {
  if (a.byteLength !== b.byteLength) return false;
  for (let i = 0; i < a.byteLength; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function compare(a, b) {
  const len = a.byteLength < b.byteLength ? a.byteLength : b.byteLength;
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return a.byteLength - b.byteLength;
}
