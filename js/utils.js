import { state } from "./state.js";

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);

    reader.readAsDataURL(file);
  });
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image."));

    image.src = src;
  });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

export function getSafeCardName() {
  const name = state.currentCard?.data?.name
    ? state.currentCard.data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-|-$/g, "")
    : "character-card";

  return name || "character-card";
}

export function readUint32(bytes, offset) {
  return (
    ((bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3]) >>> 0
  );
}

export function uint32ToBytes(value) {
  return new Uint8Array([
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff
  ]);
}

export function asciiToBytes(text) {
  return new TextEncoder().encode(text);
}

export function latin1ToBytes(text) {
  const bytes = new Uint8Array(text.length);

  for (let i = 0; i < text.length; i++) {
    bytes[i] = text.charCodeAt(i) & 0xff;
  }

  return bytes;
}

export function bytesToAscii(bytes) {
  return new TextDecoder("ascii").decode(bytes);
}

export function bytesToLatin1(bytes) {
  let text = "";

  for (const byte of bytes) {
    text += String.fromCharCode(byte);
  }

  return text;
}

export function utf8ToBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

export function base64ToUtf8(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new TextDecoder().decode(bytes);
}

/* ================================
   Avatar crop geometry
   Shared by the export (pngCards.js), the live preview, and the cropper modal
   so all three agree on exactly which square region of the source is used.
================================ */

export const MAX_AVATAR_ZOOM = 4;

export function clampCrop01(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0.5;
  return Math.min(1, Math.max(0, number));
}

export function clampZoom(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 1;
  return Math.min(MAX_AVATAR_ZOOM, Math.max(1, number));
}

// crop = { x: 0..1, y: 0..1, zoom: 1..MAX }
//  - zoom 1 => square side equals the smaller image dimension (classic center/cover crop)
//  - zoom n => square side shrinks to minDim / n (zoomed in)
//  - x / y position that square within the leftover slack (0 = top/left, 1 = bottom/right)
export function computeCropRect(naturalWidth, naturalHeight, crop) {
  const zoom = clampZoom(crop?.zoom);
  const x = clampCrop01(crop?.x);
  const y = clampCrop01(crop?.y);

  const minDim = Math.min(naturalWidth, naturalHeight);
  const side = minDim / zoom;

  const sx = (naturalWidth - side) * x;
  const sy = (naturalHeight - side) * y;

  return { sx, sy, side, zoom, x, y };
}
