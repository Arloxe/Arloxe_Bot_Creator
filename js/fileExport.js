import { state } from "./state.js";
import { createPngCardBlob } from "./pngCards.js";
import { downloadBlob, getSafeCardName } from "./utils.js";

let fileTypeStatus = null;

export function setupFileExport(elements) {
  fileTypeStatus = elements.fileTypeStatus;
}

export function exportCurrentCardJson() {
  const project = getCurrentJsonProject();

  if (!project) {
    fileTypeStatus.textContent = "Nothing to export";
    return;
  }

  const json = JSON.stringify(project.data, null, 2);
  const blob = new Blob([json], { type: "application/json" });

  downloadBlob(blob, `${project.fileName}.json`);

  fileTypeStatus.textContent = `Exported ${project.label} JSON`;
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

function getCurrentJsonProject() {
  if (state.currentCard) {
    return {
      data: state.currentCard,
      fileName: getSafeCardName(),
      label: "Character Card"
    };
  }

  if (state.currentLorebook) {
    return {
      data: state.currentLorebook,
      fileName: getSafeFileName(state.currentLorebook.name || "lorebook"),
      label: "Lorebook"
    };
  }

  if (state.currentPreset) {
    const isTemplate = state.currentProjectType === "template";

    return {
      data: state.currentPreset,
      fileName: getSafeFileName(state.currentPreset.name || "preset"),
      label: isTemplate ? "Template" : "Preset"
    };
  }

  return null;
}

function getSafeFileName(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "arloxe-export";
}
