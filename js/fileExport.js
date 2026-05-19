import { state } from "./state.js";
import { createPngCardBlob } from "./pngCards.js";
import { downloadBlob, getSafeCardName } from "./utils.js";

let fileTypeStatus = null;

export function setupFileExport(elements) {
  fileTypeStatus = elements.fileTypeStatus;
}

export function exportCurrentCardJson() {
  if (!state.currentCard) {
    fileTypeStatus.textContent = "Nothing to export";
    return;
  }

  const json = JSON.stringify(state.currentCard, null, 2);
  const blob = new Blob([json], { type: "application/json" });

  downloadBlob(blob, `${getSafeCardName()}.json`);

  fileTypeStatus.textContent = "Exported Character Card V2 JSON";
}

export async function exportCurrentCardPng() {
  if (!state.currentCard) {
    fileTypeStatus.textContent = "Nothing to export";
    return;
  }

  try {
    const finalBlob = await createPngCardBlob();

    downloadBlob(finalBlob, `${getSafeCardName()}.png`);

    fileTypeStatus.textContent = "Exported PNG Character Card";
  } catch (error) {
    console.error(error);
    fileTypeStatus.textContent = "Could not export PNG";
  }
}
