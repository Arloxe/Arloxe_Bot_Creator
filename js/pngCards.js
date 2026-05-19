import { state } from "./state.js";
import {
  asciiToBytes,
  base64ToUtf8,
  bytesToAscii,
  bytesToLatin1,
  latin1ToBytes,
  loadImage,
  readUint32,
  uint32ToBytes,
  utf8ToBase64
} from "./utils.js";

export function extractCardJsonFromPng(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);

  if (!isPng(bytes)) {
    return null;
  }

  let offset = 8;

  while (offset < bytes.length) {
    const length = readUint32(bytes, offset);
    const type = bytesToAscii(bytes.slice(offset + 4, offset + 8));
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;

    if (type === "tEXt") {
      const chunkData = bytes.slice(dataStart, dataEnd);
      const separatorIndex = chunkData.indexOf(0);

      if (separatorIndex !== -1) {
        const keyword = bytesToLatin1(chunkData.slice(0, separatorIndex));
        const text = bytesToLatin1(chunkData.slice(separatorIndex + 1));

        if (keyword === "chara") {
          return base64ToUtf8(text);
        }
      }
    }

    offset = dataEnd + 4;
  }

  return null;
}

export async function createPngCardBlob() {
  if (!state.currentCard) {
    throw new Error("No card is currently open.");
  }

  const pngBlob = await createAvatarPngBlob();
  const pngBuffer = await pngBlob.arrayBuffer();

  const cardJson = JSON.stringify(state.currentCard);
  const cardBase64 = utf8ToBase64(cardJson);

  const pngWithMetadata = insertTextChunkIntoPng(
    pngBuffer,
    "chara",
    cardBase64
  );

  return new Blob([pngWithMetadata], { type: "image/png" });
}

async function createAvatarPngBlob() {
  const canvas = document.createElement("canvas");
  const size = 512;

  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");

  if (!state.currentAvatarDataUrl) {
    drawPlaceholderAvatar(ctx, size);
    return canvasToBlob(canvas);
  }

  const image = await loadImage(state.currentAvatarDataUrl);

  const sourceSize = Math.min(image.width, image.height);
  const sx = (image.width - sourceSize) / 2;
  const sy = (image.height - sourceSize) / 2;

  ctx.drawImage(
    image,
    sx,
    sy,
    sourceSize,
    sourceSize,
    0,
    0,
    size,
    size
  );

  return canvasToBlob(canvas);
}

function drawPlaceholderAvatar(ctx, size) {
  const bg = ctx.createLinearGradient(0, 0, size, size);
  bg.addColorStop(0, "#1a211a");
  bg.addColorStop(1, "#cba449");

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.36, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f3ead8";
  ctx.font = "bold 64px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const name = state.currentCard?.data?.name?.trim() || "Card";
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || "")
    .join("");

  ctx.fillText(initials || "V2", size / 2, size / 2);
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not create PNG blob."));
    }, "image/png");
  });
}

function insertTextChunkIntoPng(arrayBuffer, keyword, text) {
  const original = new Uint8Array(arrayBuffer);

  if (!isPng(original)) {
    throw new Error("Not a valid PNG.");
  }

  const keywordBytes = asciiToBytes(keyword);
  const textBytes = latin1ToBytes(text);

  const chunkData = new Uint8Array(keywordBytes.length + 1 + textBytes.length);
  chunkData.set(keywordBytes, 0);
  chunkData[keywordBytes.length] = 0;
  chunkData.set(textBytes, keywordBytes.length + 1);

  const textChunk = createPngChunk("tEXt", chunkData);

  let offset = 8;
  let iendOffset = -1;

  while (offset < original.length) {
    const length = readUint32(original, offset);
    const type = bytesToAscii(original.slice(offset + 4, offset + 8));

    if (type === "IEND") {
      iendOffset = offset;
      break;
    }

    offset += 12 + length;
  }

  if (iendOffset === -1) {
    throw new Error("PNG is missing IEND chunk.");
  }

  const beforeIend = original.slice(0, iendOffset);
  const fromIend = original.slice(iendOffset);

  const result = new Uint8Array(
    beforeIend.length + textChunk.length + fromIend.length
  );

  result.set(beforeIend, 0);
  result.set(textChunk, beforeIend.length);
  result.set(fromIend, beforeIend.length + textChunk.length);

  return result;
}

function createPngChunk(type, data) {
  const typeBytes = asciiToBytes(type);
  const lengthBytes = uint32ToBytes(data.length);

  const crcInput = new Uint8Array(typeBytes.length + data.length);
  crcInput.set(typeBytes, 0);
  crcInput.set(data, typeBytes.length);

  const crcBytes = uint32ToBytes(crc32(crcInput));

  const chunk = new Uint8Array(4 + 4 + data.length + 4);
  chunk.set(lengthBytes, 0);
  chunk.set(typeBytes, 4);
  chunk.set(data, 8);
  chunk.set(crcBytes, 8 + data.length);

  return chunk;
}

function isPng(bytes) {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  return signature.every((byte, index) => bytes[index] === byte);
}

const crcTable = (() => {
  const table = new Uint32Array(256);

  for (let i = 0; i < 256; i++) {
    let c = i;

    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }

    table[i] = c >>> 0;
  }

  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;

  for (let i = 0; i < bytes.length; i++) {
    crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}