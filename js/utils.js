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

export async function inferAvatarImageType(dataUrl) {
  const image = await loadImage(dataUrl);
  return image.naturalHeight > image.naturalWidth ? "portrait" : "square";
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
export const AVATAR_OUTPUTS = {
  square: {
    width: 512,
    height: 512,
    aspect: 1
  },
  portrait: {
    width: 512,
    height: 768,
    aspect: 2 / 3
  }
};

export function getAvatarOutput(type) {
  return AVATAR_OUTPUTS[type === "portrait" ? "portrait" : "square"];
}

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
//  - zoom 1 => largest crop of the selected output shape inside the image
//  - zoom n => crop window shrinks from that base rectangle (zoomed in)
//  - x / y position that crop window within leftover slack (0 = top/left, 1 = bottom/right)
export function computeCropRect(naturalWidth, naturalHeight, crop, imageType = "square") {
  const zoom = clampZoom(crop?.zoom);
  const x = clampCrop01(crop?.x);
  const y = clampCrop01(crop?.y);
  const targetAspect = getAvatarOutput(imageType).aspect;
  const naturalAspect = naturalWidth / naturalHeight;

  let baseWidth;
  let baseHeight;

  if (naturalAspect >= targetAspect) {
    baseHeight = naturalHeight;
    baseWidth = baseHeight * targetAspect;
  } else {
    baseWidth = naturalWidth;
    baseHeight = baseWidth / targetAspect;
  }

  const sw = baseWidth / zoom;
  const sh = baseHeight / zoom;
  const sx = (naturalWidth - sw) * x;
  const sy = (naturalHeight - sh) * y;

  return { sx, sy, sw, sh, zoom, x, y };
}

// Downscale an image file/blob to fit within maxDim on the long edge
// (preserving aspect) and return a PNG data URL. Used for lorebook covers
// and similar uploads, to keep base64 inline storage under the localStorage
// quota and to keep exported cards a reasonable size.
export async function resizeImageToDataUrl(blob, maxDim = 768) {
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) throw new Error("Image has no usable dimensions.");

    const scale = Math.min(1, maxDim / Math.max(w, h));
    const tw = Math.max(1, Math.round(w * scale));
    const th = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement("canvas");
    canvas.width = tw;
    canvas.height = th;
    canvas.getContext("2d").drawImage(img, 0, 0, tw, th);

    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}
