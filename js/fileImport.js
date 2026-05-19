import { renderCardEditor } from "./botEditor.js";
import { renderLorebookEditor } from "./lorebookEditor.js";
import { createDefaultCard } from "./templates.js";
import { clone, fileToDataUrl } from "./utils.js";
import { extractCardJsonFromPng } from "./pngCards.js";
import { setCurrentAvatar, setCurrentLorebook, state } from "./state.js";
import { renderBotWithLorebookWorkspace } from "./workspaceCombined.js";

let fileTypeStatus = null;
let workspaceTitle = null;
let emptyState = null;

export function setupFileImport(elements) {
  fileTypeStatus = elements.fileTypeStatus;
  workspaceTitle = elements.workspaceTitle;
  emptyState = elements.emptyState;
}

export function handleFile(file) {
  if (!file) return;

  const extension = file.name.split(".").pop().toLowerCase();

  if (extension === "png") {
    inspectPngFile(file);
    return;
  }

  if (extension !== "json") {
    fileTypeStatus.textContent = "Unsupported file type";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    setCurrentAvatar(null);
    inspectJsonFile(reader.result);
  };

  reader.readAsText(file);
}

function inspectJsonFile(fileText) {
  let parsed;

  try {
    parsed = JSON.parse(fileText);
  } catch {
    fileTypeStatus.textContent = "Invalid JSON";
    return;
  }

  const type = detectFileType(parsed);

  if (type === "bot-with-lorebook") {
  fileTypeStatus.textContent = "Detected: Bot with Lorebook";

  const card = normalizeToV2Card(parsed);
  renderBotWithLorebookWorkspace(card);

  return;
}

  if (type === "bot") {
    fileTypeStatus.textContent = "Detected: Bot";
    renderCardEditor(normalizeToV2Card(parsed));
    return;
  }

  if (type === "lorebook") {
  fileTypeStatus.textContent = "Detected: Lorebook";

  const lorebook = normalizeLorebook(parsed);
  setCurrentLorebook(lorebook);
  renderLorebookEditor(lorebook, { mode: "standalone" });

  return;
 }

  fileTypeStatus.textContent = "Unknown JSON type";
}

async function inspectPngFile(file) {
  try {
    const avatarDataUrl = await fileToDataUrl(file);
    setCurrentAvatar(avatarDataUrl);

    const buffer = await file.arrayBuffer();
    const cardJson = extractCardJsonFromPng(buffer);

    if (!cardJson) {
      fileTypeStatus.textContent = "PNG loaded as avatar, no card data found";

      if (!state.currentCard) {
        renderCardEditor(createDefaultCard());
      } else {
        renderCardEditor(state.currentCard);
      }

      return;
    }

    const parsed = JSON.parse(cardJson);
    const type = detectFileType(parsed);

    if (type === "bot-with-lorebook") {
  fileTypeStatus.textContent = "Detected PNG: Bot with Lorebook";

  const card = normalizeToV2Card(parsed);
  renderBotWithLorebookWorkspace(card);

  return;
  }

    if (type === "bot") {
      fileTypeStatus.textContent = "Detected PNG: Bot";
      renderCardEditor(normalizeToV2Card(parsed));
      return;
    }

    fileTypeStatus.textContent = "PNG metadata found, but card type is unknown";
  } catch (error) {
    console.error(error);
    fileTypeStatus.textContent = "Could not read PNG card";
  }
}

function isV2Card(json) {
  return json?.spec === "chara_card_v2" && Boolean(json?.data);
}

function looksLikeCard(json) {
  return Boolean(
    isV2Card(json) ||
    json?.data?.name ||
    json?.data?.first_mes ||
    json?.name ||
    json?.first_mes ||
    json?.description
  );
}

function looksLikeLorebook(json) {
  return Boolean(
    Array.isArray(json?.entries) ||
    Array.isArray(json?.data?.character_book?.entries) ||
    json?.data?.character_book
  );
}

function detectFileType(json) {
  const card = looksLikeCard(json);
  const lorebook = looksLikeLorebook(json);

  if (card && lorebook) return "bot-with-lorebook";
  if (card) return "bot";
  if (lorebook) return "lorebook";

  return "unknown";
}

function normalizeToV2Card(json) {
  if (isV2Card(json)) {
    const card = clone(json);

    card.spec = card.spec || "chara_card_v2";
    card.spec_version = card.spec_version || "2.0";
    card.data = card.data || {};
    card.data.extensions = card.data.extensions || {};
    card.data.alternate_greetings = Array.isArray(card.data.alternate_greetings)
      ? card.data.alternate_greetings
      : [];
    card.data.tags = Array.isArray(card.data.tags)
      ? card.data.tags
      : [];

    return card;
  }

  const card = createDefaultCard();

  card.data.name = json?.name || "";
  card.data.description = json?.description || "";
  card.data.personality = json?.personality || "";
  card.data.scenario = json?.scenario || "";
  card.data.first_mes = json?.first_mes || json?.first_message || "";
  card.data.mes_example = json?.mes_example || "";

  card.data.creator_notes = json?.creator_notes || "";
  card.data.system_prompt = json?.system_prompt || "";
  card.data.post_history_instructions = json?.post_history_instructions || "";

  if (Array.isArray(json?.alternate_greetings)) {
    card.data.alternate_greetings = json.alternate_greetings;
  }

  if (Array.isArray(json?.tags)) {
    card.data.tags = json.tags;
  }

  card.data.creator = json?.creator || "";
  card.data.character_version = json?.character_version || "";

  return card;
}

function normalizeLorebook(json) {
  const lorebook = json?.data?.character_book || json;

  return {
    name: lorebook.name || "",
    description: lorebook.description || "",
    scan_depth: Number(lorebook.scan_depth ?? 2),
    token_budget: Number(lorebook.token_budget ?? 500),
    recursive_scanning: Boolean(lorebook.recursive_scanning),
    extensions: lorebook.extensions || {},
    entries: Array.isArray(lorebook.entries) ? lorebook.entries : []
  };
}
