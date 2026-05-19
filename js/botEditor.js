import {
  saveDraftQuietly,
  setCurrentAvatar,
  setCurrentCard,
  setCurrentProjectType,
  state
} from "./state.js";

import { escapeHtml, fileToDataUrl } from "./utils.js";

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
          <span>🖼️</span>
          <div>
            <h3>Avatar</h3>
            <p>This image becomes the visible PNG card when exporting as PNG.</p>
          </div>
        </div>

        <div class="avatar-editor">
          <div class="avatar-preview" id="avatarPreview">
            ${
              state.currentAvatarDataUrl
                ? `<img src="${state.currentAvatarDataUrl}" alt="Character avatar preview" />`
                : `<div class="avatar-placeholder">
                    <span>🌿</span>
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

            <button class="secondary-button" type="button" id="clearAvatarButton">
              Clear Avatar
            </button>

            <p>
              Recommended: square image, PNG or JPG. The exporter crops it into a clean square card image.
            </p>
          </div>
        </div>
      </div>

      <div class="editor-section">
        <div class="section-title">
          <span>🧍</span>
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

          <label class="form-field">
            <span>Tags</span>
            <input type="text" data-card-field="tags" value="${escapeHtml((card.data.tags || []).join(", "))}" placeholder="AnyPOV, fantasy, romance" />
          </label>
        </div>
      </div>

      <div class="editor-section">
        <div class="section-title">
          <span>🧠</span>
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
          <span>💬</span>
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
          <span>🎭</span>
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
          <span>⚙️</span>
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
    </form>
  `;

  renderAlternateGreetings();
  wireCardEditorEvents();
  wireAvatarEvents();
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
        <span>🌱</span>
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
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const index = Number(button.dataset.removeGreeting);
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

function updateCardFromField(input) {
  if (!state.currentCard) return;

  const field = input.dataset.cardField;

  if (field === "tags") {
    state.currentCard.data.tags = input.value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    return;
  }

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

  chooseAvatarButton?.addEventListener("click", () => {
    avatarInput.click();
  });

  clearAvatarButton?.addEventListener("click", () => {
    setCurrentAvatar(null);
    saveDraftQuietly();
    renderCardEditor(state.currentCard);
  });

  avatarInput?.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const dataUrl = await fileToDataUrl(file);
    setCurrentAvatar(dataUrl);

    saveDraftQuietly();
    renderCardEditor(state.currentCard);
  });
}
