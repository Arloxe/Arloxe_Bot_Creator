import { renderCardEditor } from "./botEditor.js";
import { renderLorebookEditor } from "./lorebookEditor.js";
import { createDefaultCard } from "./templates.js";
import { clone, fileToDataUrl, inferAvatarImageType } from "./utils.js";
import { extractCardJsonFromPng } from "./pngCards.js";
import { setCurrentAvatar, setCurrentAvatarCrop, setCurrentAvatarImageType, setCurrentLorebook, state } from "./state.js";
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

  if (isPlainAvatarImage(extension)) {
    inspectAvatarImageFile(file);
    return;
  }

  if (extension !== "json") {
    fileTypeStatus.textContent = "Unsupported file type. Use JSON, PNG card, or PNG/JPG/WebP avatar image.";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    setCurrentAvatar(null);
    setCurrentAvatarImageType();
    setCurrentAvatarCrop();
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
  scrollToWorkspace();

  return;
}

  if (type === "bot") {
    fileTypeStatus.textContent = "Detected: Bot";
    renderCardEditor(normalizeToV2Card(parsed));
    scrollToWorkspace();
    return;
  }

  if (type === "lorebook") {
  fileTypeStatus.textContent = "Detected: Lorebook";

  const lorebook = normalizeLorebook(parsed);
  setCurrentLorebook(lorebook);
  renderLorebookEditor(lorebook, { mode: "standalone" });
  scrollToWorkspace();

  return;
 }

  fileTypeStatus.textContent = "Unknown JSON type";
}

async function inspectPngFile(file) {
  try {
    const avatarDataUrl = await fileToDataUrl(file);
    setCurrentAvatar(avatarDataUrl);
    setCurrentAvatarImageType(await inferAvatarImageType(avatarDataUrl));
    setCurrentAvatarCrop();

    const buffer = await file.arrayBuffer();
    const cardJson = extractCardJsonFromPng(buffer);

    if (!cardJson) {
      fileTypeStatus.textContent = "PNG loaded as avatar, no card data found";

      if (!state.currentCard) {
        renderCardEditor(createDefaultCard(), { openAvatarCropper: true });
      } else {
        renderCardEditor(state.currentCard, { openAvatarCropper: true });
      }

      scrollToWorkspace();
      return;
    }

    const parsed = JSON.parse(cardJson);
    const type = detectFileType(parsed);

    if (type === "bot-with-lorebook") {
  fileTypeStatus.textContent = "Detected PNG: Bot with Lorebook";

  const card = normalizeToV2Card(parsed);
  renderBotWithLorebookWorkspace(card);
  scrollToWorkspace();

  return;
  }

    if (type === "bot") {
      fileTypeStatus.textContent = "Detected PNG: Bot";
      renderCardEditor(normalizeToV2Card(parsed));
      scrollToWorkspace();
      return;
    }

    fileTypeStatus.textContent = "PNG metadata found, but card type is unknown";
  } catch (error) {
    console.error(error);
    fileTypeStatus.textContent = "Could not read PNG card";
  }
}

async function inspectAvatarImageFile(file) {
  try {
    const avatarDataUrl = await fileToDataUrl(file);
    setCurrentAvatar(avatarDataUrl);
    setCurrentAvatarImageType(await inferAvatarImageType(avatarDataUrl));
    setCurrentAvatarCrop();

    if (!state.currentCard) {
      renderCardEditor(createDefaultCard(), { openAvatarCropper: true });
    } else {
      renderCardEditor(state.currentCard, { openAvatarCropper: true });
    }

    fileTypeStatus.textContent = "Image loaded as avatar";
    scrollToWorkspace();
  } catch (error) {
    console.error(error);
    fileTypeStatus.textContent = "Could not read avatar image";
  }
}

function isPlainAvatarImage(extension) {
  return ["jpg", "jpeg", "webp"].includes(extension);
}

function scrollToWorkspace() {
  requestAnimationFrame(() => {
    workspaceTitle?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
}

function isCharacterCardSpec(json) {
  return typeof json?.spec === "string" && json.spec.startsWith("chara_card_v") && Boolean(json?.data);
}

function isV2Card(json) {
  return json?.spec === "chara_card_v2" && Boolean(json?.data);
}

function looksLikeCard(json) {
  const data = json?.data;

  return Boolean(
    isCharacterCardSpec(json) ||
    data?.first_mes ||
    data?.first_message ||
    data?.personality ||
    data?.scenario ||
    data?.mes_example ||
    json?.first_mes ||
    json?.first_message ||
    json?.personality ||
    json?.scenario ||
    json?.mes_example
  );
}

function looksLikeLorebook(json) {
  return Boolean(
    looksLikeLorebookObject(json) ||
    looksLikeLorebookObject(json?.data?.character_book)
  );
}

function looksLikeLorebookObject(lorebook) {
  if (!lorebook || typeof lorebook !== "object") return false;

  return Boolean(
    hasLorebookEntries(lorebook.entries) ||
    "scan_depth" in lorebook ||
    "token_budget" in lorebook ||
    "recursive_scanning" in lorebook
  );
}

function hasLorebookEntries(entries) {
  return Array.isArray(entries) || isRecord(entries);
}

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function detectFileType(json) {
  const card = looksLikeCard(json);
  const lorebook = looksLikeLorebook(json);

  if (card && lorebook) return "bot-with-lorebook";
  if (card) return "bot";
  if (lorebook) return "lorebook";

  return "unknown";
}

export function normalizeToV2Card(json) {
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

  const source = isCharacterCardSpec(json)
    ? json.data
    : json;

  const card = createDefaultCard();

  card.data.name = source?.name || "";
  card.data.description = source?.description || "";
  card.data.personality = source?.personality || "";
  card.data.scenario = source?.scenario || "";
  card.data.first_mes = source?.first_mes || source?.first_message || "";
  card.data.mes_example = source?.mes_example || "";

  card.data.creator_notes = source?.creator_notes || source?.creatorcomment || "";
  card.data.system_prompt = source?.system_prompt || "";
  card.data.post_history_instructions = source?.post_history_instructions || "";

  if (Array.isArray(source?.alternate_greetings)) {
    card.data.alternate_greetings = source.alternate_greetings;
  }

  if (Array.isArray(source?.tags)) {
    card.data.tags = source.tags;
  }

  card.data.creator = source?.creator || "";
  card.data.character_version = source?.character_version || "";
  card.data.extensions = source?.extensions || {};

  if (source?.character_book) {
    card.data.character_book = normalizeLorebook(source.character_book);
  }

  return card;
}

export function normalizeLorebook(json) {
  const lorebook = json?.data?.character_book || json;

  return {
    name: lorebook.name || "",
    description: lorebook.description || "",
    scan_depth: Number(lorebook.scan_depth ?? 2),
    token_budget: Number(lorebook.token_budget ?? 500),
    recursive_scanning: Boolean(lorebook.recursive_scanning),
    extensions: lorebook.extensions || {},
    entries: normalizeLorebookEntries(lorebook.entries)
  };
}

function normalizeLorebookEntries(entries) {
  const entryList = Array.isArray(entries)
    ? entries
    : isRecord(entries)
      ? Object.values(entries)
      : [];

  return entryList.map((entry, index) => ({
    ...entry,
    keys: Array.isArray(entry.keys)
      ? entry.keys
      : Array.isArray(entry.key)
        ? entry.key
        : [],
    secondary_keys: Array.isArray(entry.secondary_keys)
      ? entry.secondary_keys
      : Array.isArray(entry.keysecondary)
        ? entry.keysecondary
        : [],
    content: entry.content || "",
    enabled: entry.enabled ?? !entry.disable,
    insertion_order: Number(entry.insertion_order ?? entry.order ?? 100),
    case_sensitive: Boolean(entry.case_sensitive),
    name: entry.name || entry.comment || `Entry ${index + 1}`,
    priority: Number(entry.priority ?? entry.order ?? 100),
    id: entry.id ?? entry.uid ?? Date.now() + index,
    comment: entry.comment || "",
    selective: Boolean(entry.selective),
    constant: Boolean(entry.constant),
    position: entry.position || "before_char",
    extensions: entry.extensions || {}
  }));
}

