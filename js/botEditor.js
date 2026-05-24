import {
  saveDraftQuietly,
  setCurrentAvatar,
  setCurrentAvatarImageType,
  setCurrentAvatarCrop,
  setCurrentCard,
  setCurrentProjectType,
  state
} from "./state.js";

import { escapeHtml, fileToDataUrl, inferAvatarImageType } from "./utils.js";
import { applyCropToImage, openAvatarCropper } from "./avatarCropper.js";
import { confirmAction } from "./confirmDialog.js";

let workspacePanel = null;
let workspaceTitle = null;
let emptyState = null;
let exportButton = null;

export function setupBotEditor(elements) {
  workspacePanel = elements.workspacePanel;
  workspaceTitle = elements.workspaceTitle;
  emptyState = elements.emptyState;
  exportButton = elements.exportButton;
}

export function renderCardEditor(card, options = {}) {
    const mountId = options.mountId || "editorMount";

  setCurrentProjectType("bot");
  setCurrentCard(card);

  const depthPrompt = card.data.extensions?.depth_prompt || {};

  ensurePngExportButton();

  emptyState.style.display = "none";
  workspaceTitle.textContent = card.data.name
    ? `Editing: ${card.data.name}`
    : "New Character Card";

  const mount = ensureEditorMount(mountId);

  mount.innerHTML = `
    <form class="editor-form" id="cardEditorForm">
      <div class="editor-section avatar-section">
        <div class="section-title">
          <span class="ui-icon ui-icon-image" aria-hidden="true"></span>
          <div>
            <h3>Avatar</h3>
            <p>This image becomes the visible PNG card when exporting as PNG.</p>
          </div>
        </div>

        <div class="avatar-editor">
          <div
            class="avatar-preview ${state.currentAvatarImageType === "portrait" ? "is-portrait" : ""} ${state.currentAvatarDataUrl ? "is-editable" : ""}"
            id="avatarPreview"
            ${state.currentAvatarDataUrl ? 'role="button" tabindex="0" aria-label="Reposition avatar crop"' : ""}
          >
            ${
              state.currentAvatarDataUrl
                ? `<img src="${state.currentAvatarDataUrl}" alt="Character avatar preview" id="avatarPreviewImage" draggable="false" />
                   <span class="avatar-preview-hint">Click to reposition</span>`
                : `<div class="avatar-placeholder">
                    <span class="ui-icon ui-icon-image" aria-hidden="true"></span>
                    <strong>No avatar yet</strong>
                    <small>Upload an image to export PNG cards.</small>
                  </div>`
            }
          </div>

          <div class="avatar-controls">
            <input type="file" id="avatarInput" accept="image/png,image/jpeg,image/webp" hidden />

            <button class="secondary-button" type="button" id="chooseAvatarButton">
              Choose Avatar
            </button>

            ${
              state.currentAvatarDataUrl
                ? `<button class="secondary-button" type="button" id="editCropButton">
                    <span class="button-icon ui-icon ui-icon-edit" aria-hidden="true"></span>
                    Reposition
                  </button>`
                : ""
            }

            <button class="secondary-button" type="button" id="clearAvatarButton">
              Remove Avatar
            </button>

            <label class="avatar-type-control">
              <span>Image Type</span>
              <select id="avatarImageTypeSelect">
                <option value="square" ${state.currentAvatarImageType !== "portrait" ? "selected" : ""}>Square</option>
                <option value="portrait" ${state.currentAvatarImageType === "portrait" ? "selected" : ""}>Portrait</option>
              </select>
            </label>

            <p>
              Choose Square or Portrait output. Click the preview (or “Reposition”) to drag and zoom which part of the source image becomes the card image.
            </p>
          </div>
        </div>
      </div>

      <div class="editor-section">
        <div class="section-title">
          <span class="ui-icon ui-icon-user" aria-hidden="true"></span>
          <div>
            <h3>Basic Character Info</h3>
            <p>The core identity fields for Character Card V2.</p>
          </div>
        </div>

        <div class="form-grid two-columns">
          <label class="form-field">
            <span>Name</span>
            <input type="text" data-card-field="name" value="${escapeHtml(fieldValue(card.data.name))}" placeholder="Character name" />
          </label>

          <label class="form-field">
            <span>Creator</span>
            <input type="text" data-card-field="creator" value="${escapeHtml(fieldValue(card.data.creator))}" placeholder="Arloxe" />
          </label>

          <label class="form-field">
            <span>Character Version</span>
            <input type="text" data-card-field="character_version" value="${escapeHtml(fieldValue(card.data.character_version))}" placeholder="1.0" />
          </label>

          <div class="form-field">
            <span>Tags</span>
            <div class="tag-chip-input" id="tagChipInput">
              <div class="tag-chip-list" id="tagChipList"></div>
              <input type="text" id="tagAddInput" class="tag-add-input" placeholder="Add a tag, press Enter" />
            </div>
          </div>
        </div>
      </div>

      <div class="editor-section">
        <div class="section-title">
          <span class="ui-icon ui-icon-persona" aria-hidden="true"></span>
          <div>
            <h3>Persona</h3>
            <p>The meat and magic of the character.</p>
          </div>
        </div>

        <div class="form-grid">
          <label class="form-field">
            <span>Description</span>
            <textarea data-card-field="description" rows="8" placeholder="Appearance, backstory, behavior, relationships...">${escapeHtml(fieldValue(card.data.description))}</textarea>
          </label>

          <label class="form-field">
            <span>Personality</span>
            <textarea data-card-field="personality" rows="5" placeholder="Personality traits, quirks, speaking style...">${escapeHtml(fieldValue(card.data.personality))}</textarea>
          </label>

          <label class="form-field">
            <span>Scenario</span>
            <textarea data-card-field="scenario" rows="5" placeholder="The situation the character starts in...">${escapeHtml(fieldValue(card.data.scenario))}</textarea>
          </label>
        </div>
      </div>

      <div class="editor-section">
        <div class="section-title">
          <span class="ui-icon ui-icon-message" aria-hidden="true"></span>
          <div>
            <h3>Messages</h3>
            <p>Greeting and example dialogue.</p>
          </div>
        </div>

        <div class="form-grid">
          <label class="form-field">
            <span>First Message</span>
            <textarea data-card-field="first_mes" rows="8" placeholder="The opening greeting...">${escapeHtml(fieldValue(card.data.first_mes))}</textarea>
          </label>

          <label class="form-field">
            <span>Example Messages</span>
            <textarea data-card-field="mes_example" rows="7" placeholder="<START> example chats, dialogue samples, etc.">${escapeHtml(fieldValue(card.data.mes_example))}</textarea>
          </label>
        </div>
      </div>

      <div class="editor-section">
        <div class="section-title">
          <span class="ui-icon ui-icon-greetings" aria-hidden="true"></span>
          <div>
            <h3>Alternate Greetings</h3>
            <p>Add extra openings for SillyTavern/Chub-style multi-greeting cards.</p>
          </div>
        </div>

        <div class="alt-greetings-list" id="altGreetingsList"></div>

        <button class="secondary-button" type="button" id="addGreetingButton">
          Add Greeting
        </button>
      </div>

      <div class="editor-section">
        <div class="section-title">
          <span class="ui-icon ui-icon-settings" aria-hidden="true"></span>
          <div>
            <h3>Advanced Prompt Fields</h3>
            <p>Optional steering text for models and frontends that support it.</p>
          </div>
        </div>

        <div class="form-grid">
          <label class="form-field">
            <span>System Prompt</span>
            <textarea data-card-field="system_prompt" rows="5" placeholder="Optional system prompt...">${escapeHtml(fieldValue(card.data.system_prompt))}</textarea>
          </label>

          <label class="form-field">
            <span>Post-History Instructions</span>
            <textarea data-card-field="post_history_instructions" rows="5" placeholder="Instructions inserted after chat history...">${escapeHtml(fieldValue(card.data.post_history_instructions))}</textarea>
          </label>

          <label class="form-field">
            <span>Creator Notes</span>
            <textarea data-card-field="creator_notes" rows="5" placeholder="Notes for users, usage tips, warnings, credits...">${escapeHtml(fieldValue(card.data.creator_notes))}</textarea>
          </label>
        </div>
      </div>

      <div class="editor-section">
        <div class="section-title">
          <span class="ui-icon ui-icon-character-note" aria-hidden="true"></span>
          <div>
            <h3>Character's Note</h3>
            <p>A depth-injected steering prompt. Inserted x messages deep into the chat history (x = depth), so it stays close to the model's attention. Stored in <code>extensions.depth_prompt</code> for SillyTavern/Chub. Leave the note empty to omit it from the card.</p>
          </div>
        </div>

        <div class="form-grid">
          <label class="form-field">
            <span>Note</span>
            <textarea data-depth-field="prompt" rows="5" placeholder="# Notes&#10;- Key facts the model should always remember...">${escapeHtml(fieldValue(depthPrompt.prompt))}</textarea>
          </label>
        </div>

        <div class="form-grid two-columns">
          <label class="form-field">
            <span>Depth</span>
            <input type="number" data-depth-field="depth" min="0" value="${escapeHtml(depthPrompt.depth ?? 4)}" />
          </label>

          <label class="form-field">
            <span>Role</span>
            <select data-depth-field="role">
              <option value="system" ${(depthPrompt.role || "system") === "system" ? "selected" : ""}>System</option>
              <option value="user" ${depthPrompt.role === "user" ? "selected" : ""}>User</option>
              <option value="assistant" ${depthPrompt.role === "assistant" ? "selected" : ""}>Assistant</option>
            </select>
          </label>
        </div>
      </div>
    </form>
  `;

  renderAlternateGreetings();
  wireCardEditorEvents();
  wireDepthPromptEvents();
  wireTagEvents();
  wireAvatarEvents();

  if (options.openAvatarCropper && state.currentAvatarDataUrl) {
    requestAnimationFrame(runAvatarCropper);
  }
}

function ensureEditorMount(mountId = "editorMount") {
  let mount = document.getElementById(mountId);

  if (!mount) {
    mount = document.createElement("div");
    mount.id = mountId;
    mount.className = "editor-mount";
    workspacePanel.appendChild(mount);
  }

  return mount;
}

function ensurePngExportButton() {
  if (document.getElementById("exportPngButton")) return;

  const pngButton = document.createElement("button");
  pngButton.className = "primary-button";
  pngButton.type = "button";
  pngButton.id = "exportPngButton";
  pngButton.textContent = "Export PNG";

  exportButton?.insertAdjacentElement("afterend", pngButton);

  pngButton.addEventListener("click", () => {
    document.dispatchEvent(new CustomEvent("arloxe:export-png"));
  });
}

function fieldValue(value) {
  return value ?? "";
}

function renderAlternateGreetings() {
  const list = document.getElementById("altGreetingsList");
  if (!list || !state.currentCard) return;

  const greetings = state.currentCard.data.alternate_greetings || [];

  if (greetings.length === 0) {
    list.innerHTML = `
      <div class="mini-empty-state">
        <span class="ui-icon ui-icon-greetings" aria-hidden="true"></span>
        <p>No alternate greetings yet.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = greetings.map((greeting, index) => {
    const preview = greeting.trim()
      ? escapeHtml(greeting.trim().slice(0, 90)) + (greeting.trim().length > 90 ? "..." : "")
      : "Empty greeting";

    return `
      <details class="alt-greeting-item" ${index === greetings.length - 1 ? "open" : ""}>
        <summary class="alt-greeting-summary">
          <div>
            <strong>Greeting ${index + 2}</strong>
            <small>${preview}</small>
          </div>

          <button class="tiny-danger-button" type="button" data-remove-greeting="${index}">
            Remove
          </button>
        </summary>

        <textarea data-alt-greeting="${index}" rows="7" placeholder="Alternate greeting...">${escapeHtml(greeting)}</textarea>
      </details>
    `;
  }).join("");

  list.querySelectorAll("[data-remove-greeting]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const index = Number(button.dataset.removeGreeting);
      const shouldRemove = await confirmAction({
        title: "Remove alternate greeting?",
        message: "This greeting will be removed from the current character.",
        confirmLabel: "Remove"
      });
      if (!shouldRemove) return;

      state.currentCard.data.alternate_greetings.splice(index, 1);
      renderAlternateGreetings();
      saveDraftQuietly();
    });
  });

  list.querySelectorAll("[data-alt-greeting]").forEach((textarea) => {
    textarea.addEventListener("input", () => {
      const index = Number(textarea.dataset.altGreeting);
      state.currentCard.data.alternate_greetings[index] = textarea.value;
      saveDraftQuietly();

      const details = textarea.closest(".alt-greeting-item");
      const preview = details?.querySelector(".alt-greeting-summary small");

      if (preview) {
        const trimmed = textarea.value.trim();
        preview.textContent = trimmed
          ? trimmed.slice(0, 90) + (trimmed.length > 90 ? "..." : "")
          : "Empty greeting";
      }
    });
  });
}

function wireCardEditorEvents() {
  const form = document.getElementById("cardEditorForm");
  const addGreetingButton = document.getElementById("addGreetingButton");

  form?.querySelectorAll("[data-card-field]").forEach((input) => {
    input.addEventListener("input", () => {
      updateCardFromField(input);
      saveDraftQuietly();
    });
  });

  addGreetingButton?.addEventListener("click", () => {
    state.currentCard.data.alternate_greetings =
      state.currentCard.data.alternate_greetings || [];

    state.currentCard.data.alternate_greetings.push("");
    renderAlternateGreetings();
    saveDraftQuietly();
  });
}

function renderTagChips() {
  const list = document.getElementById("tagChipList");
  if (!list || !state.currentCard) return;

  const tags = state.currentCard.data.tags || [];

  list.innerHTML = tags
    .map(
      (tag, index) => `
      <span class="tag-chip">
        <span class="tag-chip-label">${escapeHtml(tag)}</span>
        <button type="button" class="tag-chip-remove" data-remove-tag="${index}" aria-label="Remove tag ${escapeHtml(tag)}">×</button>
      </span>
    `
    )
    .join("");

  list.querySelectorAll("[data-remove-tag]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const index = Number(button.dataset.removeTag);
      state.currentCard.data.tags.splice(index, 1);
      renderTagChips();
      saveDraftQuietly();
    });
  });
}

function addTagsFromString(value) {
  if (!state.currentCard) return;

  state.currentCard.data.tags = state.currentCard.data.tags || [];

  // Splitting on comma lets a pasted "a, b, c" become three chips at once.
  const incoming = value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  for (const tag of incoming) {
    const isDuplicate = state.currentCard.data.tags.some(
      (existing) => existing.toLowerCase() === tag.toLowerCase()
    );

    if (!isDuplicate) {
      state.currentCard.data.tags.push(tag);
    }
  }
}

function wireTagEvents() {
  const input = document.getElementById("tagAddInput");
  if (!input) return;

  const commit = () => {
    if (!input.value.trim()) return;

    addTagsFromString(input.value);
    input.value = "";
    renderTagChips();
    saveDraftQuietly();
  };

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit();
      return;
    }

    // Backspace on an empty input removes the last chip, like most tag editors.
    if (event.key === "Backspace" && input.value === "") {
      const tags = state.currentCard?.data?.tags;

      if (tags && tags.length) {
        tags.pop();
        renderTagChips();
        saveDraftQuietly();
      }
    }
  });

  // Don't lose a tag the user typed but didn't press Enter on.
  input.addEventListener("blur", commit);

  renderTagChips();
}

function wireDepthPromptEvents() {
  const form = document.getElementById("cardEditorForm");

  form?.querySelectorAll("[data-depth-field]").forEach((input) => {
    const handler = () => {
      updateDepthPrompt();
      saveDraftQuietly();
    };

    input.addEventListener("input", handler);
    input.addEventListener("change", handler);
  });
}

function updateDepthPrompt() {
  if (!state.currentCard) return;

  const form = document.getElementById("cardEditorForm");
  if (!form) return;

  const data = state.currentCard.data;
  data.extensions = data.extensions || {};

  const prompt = form.querySelector('[data-depth-field="prompt"]')?.value ?? "";
  const depth = form.querySelector('[data-depth-field="depth"]')?.value ?? 4;
  const role = form.querySelector('[data-depth-field="role"]')?.value || "system";

  // An empty note means "no character note" — keep it out of the card
  // entirely instead of writing a meaningless empty depth_prompt.
  if (!prompt.trim()) {
    delete data.extensions.depth_prompt;
    return;
  }

  data.extensions.depth_prompt = {
    prompt,
    depth: Number(depth || 0),
    role
  };
}

function updateCardFromField(input) {
  if (!state.currentCard) return;

  const field = input.dataset.cardField;

  state.currentCard.data[field] = input.value;

  if (field === "name") {
    workspaceTitle.textContent = input.value
      ? `Editing: ${input.value}`
      : "New Character Card";
  }
}

function wireAvatarEvents() {
  const avatarInput = document.getElementById("avatarInput");
  const chooseAvatarButton = document.getElementById("chooseAvatarButton");
  const clearAvatarButton = document.getElementById("clearAvatarButton");
  const editCropButton = document.getElementById("editCropButton");
  const preview = document.getElementById("avatarPreview");
  const avatarImageTypeSelect = document.getElementById("avatarImageTypeSelect");

  // Lay the preview image out to match the current crop.
  applyPreviewCrop();

  chooseAvatarButton?.addEventListener("click", () => {
    avatarInput.click();
  });

  clearAvatarButton?.addEventListener("click", async () => {
    const shouldClear = await confirmAction({
      title: "Remove avatar?",
      message: "The current avatar image and crop settings will be removed from this character.",
      confirmLabel: "Remove Avatar"
    });
    if (!shouldClear) return;

    setCurrentAvatar(null);
    setCurrentAvatarImageType();
    setCurrentAvatarCrop();
    saveDraftQuietly();
    renderCardEditor(state.currentCard);
  });

  editCropButton?.addEventListener("click", runAvatarCropper);

  avatarImageTypeSelect?.addEventListener("change", () => {
    setCurrentAvatarImageType(avatarImageTypeSelect.value);
    setCurrentAvatarCrop();
    saveDraftQuietly();
    renderCardEditor(state.currentCard, {
      openAvatarCropper: Boolean(state.currentAvatarDataUrl)
    });
  });

  if (preview && state.currentAvatarDataUrl) {
    preview.addEventListener("click", runAvatarCropper);
    preview.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        runAvatarCropper();
      }
    });
  }

  avatarInput?.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const dataUrl = await fileToDataUrl(file);
    setCurrentAvatar(dataUrl);
    setCurrentAvatarImageType(await inferAvatarImageType(dataUrl));
    setCurrentAvatarCrop();

    saveDraftQuietly();
    renderCardEditor(state.currentCard);

    // Auto-open the cropper so the user can frame the freshly chosen image.
    runAvatarCropper();
  });
}

// Opens the cropper for the current avatar and persists the chosen crop.
// Shared by the preview click, the Reposition button, and avatar upload/change.
async function runAvatarCropper() {
  if (!state.currentAvatarDataUrl) return;

  const result = await openAvatarCropper(
    state.currentAvatarDataUrl,
    state.currentAvatarCrop,
    state.currentAvatarImageType
  );

  if (result) {
    setCurrentAvatarCrop(result);
    applyPreviewCrop();
    saveDraftQuietly();
  }
}

function applyPreviewCrop() {
  const box = document.getElementById("avatarPreview");
  const image = document.getElementById("avatarPreviewImage");
  if (!box || !image) return;

  const run = () => applyCropToImage(
    image,
    box.clientWidth || 220,
    box.clientHeight || box.clientWidth || 220,
    state.currentAvatarCrop,
    state.currentAvatarImageType
  );

  if (image.complete && image.naturalWidth) {
    run();
  } else {
    image.addEventListener("load", run, { once: true });
  }
}
