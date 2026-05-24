import {
  saveDraftQuietly,
  setCurrentLorebook,
  setCurrentProjectType,
  state
} from "./state.js";

import { createDefaultLorebookEntry } from "./templates.js";
import { confirmAction } from "./confirmDialog.js";
import { escapeHtml } from "./utils.js";

let workspacePanel = null;
let workspaceTitle = null;
let emptyState = null;

export function setupLorebookEditor(elements) {
  workspacePanel = elements.workspacePanel;
  workspaceTitle = elements.workspaceTitle;
  emptyState = elements.emptyState;
}

export function renderLorebookEditor(lorebook, options = {}) {
  const mode = options.mode || "standalone";
  const mountId = options.mountId || "editorMount";

  setCurrentProjectType(mode === "embedded" ? "bot-with-lorebook" : "lorebook");
  setCurrentLorebook(lorebook);

  emptyState.style.display = "none";

  workspaceTitle.textContent = lorebook.name
    ? `Lorebook: ${lorebook.name}`
    : mode === "embedded"
      ? "Embedded Lorebook"
      : "New Lorebook";

  const mount = ensureEditorMount(mountId);

  mount.innerHTML = `
    <form class="editor-form" id="lorebookEditorForm">
      <div class="editor-section">
        <div class="section-title">
          <span class="ui-icon ui-icon-book" aria-hidden="true"></span>
          <div>
            <h3>Lorebook Settings</h3>
            <p>Global scan and insertion behavior for this lorebook.</p>
          </div>
        </div>

        <div class="form-grid two-columns">
          <label class="form-field">
            <span>Lorebook Name</span>
            <input type="text" data-lorebook-field="name" value="${escapeHtml(lorebook.name)}" placeholder="World lore, character notes, factions..." />
          </label>

          <label class="form-field">
            <span>Scan Depth</span>
            <input type="number" data-lorebook-field="scan_depth" value="${escapeHtml(lorebook.scan_depth ?? 2)}" min="0" />
          </label>

          <label class="form-field">
            <span>Token Budget</span>
            <input type="number" data-lorebook-field="token_budget" value="${escapeHtml(lorebook.token_budget ?? 500)}" min="0" />
          </label>

          <label class="form-field checkbox-field">
            <span>Recursive Scanning</span>
            <input type="checkbox" data-lorebook-field="recursive_scanning" ${lorebook.recursive_scanning ? "checked" : ""} />
          </label>
        </div>

        <label class="form-field lorebook-description">
          <span>Description</span>
          <textarea data-lorebook-field="description" rows="4" placeholder="What this lorebook is for...">${escapeHtml(lorebook.description)}</textarea>
        </label>
      </div>

      <div class="editor-section">
        <div class="section-title lorebook-entry-title">
          <span>🗂️</span>
          <div>
            <h3>Lorebook Entries</h3>
            <p>Entries are triggered by keywords and inserted into the prompt.</p>
          </div>

          <button class="secondary-button" type="button" id="addLorebookEntryButton">
            Add Entry
          </button>
        </div>

        <div class="lorebook-entry-list" id="lorebookEntryList"></div>
      </div>
    </form>
  `;

  renderLorebookEntries();
  wireLorebookEvents();
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

function wireLorebookEvents() {
  const form = document.getElementById("lorebookEditorForm");
  const addEntryButton = document.getElementById("addLorebookEntryButton");

  form?.querySelectorAll("[data-lorebook-field]").forEach((input) => {
    input.addEventListener("input", () => updateLorebookFromField(input));
    input.addEventListener("change", () => updateLorebookFromField(input));
  });

  addEntryButton?.addEventListener("click", () => {
  state.currentLorebook.entries = state.currentLorebook.entries || [];
  state.currentLorebook.entries.push(createDefaultLorebookEntry(Date.now()));

  renderLorebookEntries();
  syncEmbeddedLorebook();
  saveDraftQuietly();
  });
}

function updateLorebookFromField(input) {
  if (!state.currentLorebook) return;

  const field = input.dataset.lorebookField;

  if (input.type === "checkbox") {
    state.currentLorebook[field] = input.checked;
  } else if (input.type === "number") {
    state.currentLorebook[field] = Number(input.value || 0);
  } else {
    state.currentLorebook[field] = input.value;
  }

  if (field === "name") {
    workspaceTitle.textContent = input.value
      ? `Lorebook: ${input.value}`
      : "New Lorebook";
  }

  syncEmbeddedLorebook();
  saveDraftQuietly();
}

function renderLorebookEntries() {
  const list = document.getElementById("lorebookEntryList");
  if (!list || !state.currentLorebook) return;

  const entries = state.currentLorebook.entries || [];

  if (entries.length === 0) {
    list.innerHTML = `
      <div class="mini-empty-state">
        <span class="ui-icon ui-icon-book" aria-hidden="true"></span>
        <p>No lorebook entries yet.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = entries.map((entry, index) => {
    const title = entry.name?.trim() || entry.comment?.trim() || `Entry ${index + 1}`;
    const keysPreview = Array.isArray(entry.keys) && entry.keys.length
      ? entry.keys.join(", ")
      : "No keywords yet";

    return `
      <details class="lorebook-entry-item" ${index === entries.length - 1 ? "open" : ""}>
        <summary class="lorebook-entry-summary">
          <div>
            <strong>${escapeHtml(title)}</strong>
            <small>${escapeHtml(keysPreview)}</small>
          </div>

          <button class="tiny-danger-button" type="button" data-remove-lorebook-entry="${index}">
            Remove
          </button>
        </summary>

        <div class="lorebook-entry-body">
          <div class="form-grid two-columns">
            <label class="form-field">
              <span>Name</span>
              <input type="text" data-entry-index="${index}" data-entry-field="name" value="${escapeHtml(entry.name)}" placeholder="Entry name" />
            </label>

            <label class="form-field">
              <span>Comment</span>
              <input type="text" data-entry-index="${index}" data-entry-field="comment" value="${escapeHtml(entry.comment)}" placeholder="Private note / label" />
            </label>

            <label class="form-field">
              <span>Primary Keywords</span>
              <input type="text" data-entry-index="${index}" data-entry-field="keys" value="${escapeHtml((entry.keys || []).join(", "))}" placeholder="kingdom, castle, royal guard" />
            </label>

            <label class="form-field">
              <span>Secondary Keywords</span>
              <input type="text" data-entry-index="${index}" data-entry-field="secondary_keys" value="${escapeHtml((entry.secondary_keys || []).join(", "))}" placeholder="optional extra trigger words" />
            </label>

            <label class="form-field">
              <span>Insertion Order</span>
              <input type="number" data-entry-index="${index}" data-entry-field="insertion_order" value="${escapeHtml(entry.insertion_order ?? 100)}" />
            </label>

            <label class="form-field">
              <span>Priority</span>
              <input type="number" data-entry-index="${index}" data-entry-field="priority" value="${escapeHtml(entry.priority ?? 100)}" />
            </label>

            <label class="form-field">
              <span>Position</span>
              <select data-entry-index="${index}" data-entry-field="position">
                <option value="before_char" ${entry.position === "before_char" ? "selected" : ""}>Before Character</option>
                <option value="after_char" ${entry.position === "after_char" ? "selected" : ""}>After Character</option>
              </select>
            </label>
          </div>

          <div class="lorebook-toggle-grid">
            ${renderEntryCheckbox(index, "enabled", "Enabled", entry.enabled)}
            ${renderEntryCheckbox(index, "constant", "Constant", entry.constant)}
            ${renderEntryCheckbox(index, "selective", "Selective", entry.selective)}
            ${renderEntryCheckbox(index, "case_sensitive", "Case Sensitive", entry.case_sensitive)}
          </div>

          <label class="form-field">
            <span>Content</span>
            <textarea data-entry-index="${index}" data-entry-field="content" rows="7" placeholder="Lore content inserted when this entry triggers...">${escapeHtml(entry.content)}</textarea>
          </label>
        </div>
      </details>
    `;
  }).join("");

  wireEntryEvents();
}

function renderEntryCheckbox(index, field, label, checked) {
  return `
    <label class="toggle-chip">
      <input type="checkbox" data-entry-index="${index}" data-entry-field="${field}" ${checked ? "checked" : ""} />
      <span>${label}</span>
    </label>
  `;
}

function wireEntryEvents() {
  const list = document.getElementById("lorebookEntryList");

  list.querySelectorAll("[data-remove-lorebook-entry]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const index = Number(button.dataset.removeLorebookEntry);
      const shouldRemove = await confirmAction({
        title: "Remove lorebook entry?",
        message: "This entry will be removed from the current lorebook.",
        confirmLabel: "Remove"
      });
      if (!shouldRemove) return;

      state.currentLorebook.entries.splice(index, 1);
      renderLorebookEntries();
      syncEmbeddedLorebook();
      saveDraftQuietly();
    });
  });

  list.querySelectorAll("[data-entry-field]").forEach((input) => {
    input.addEventListener("input", () => updateEntryFromField(input));
    input.addEventListener("change", () => updateEntryFromField(input));
  });
}

function updateEntryFromField(input) {
  const index = Number(input.dataset.entryIndex);
  const field = input.dataset.entryField;
  const entry = state.currentLorebook.entries[index];

  if (!entry) return;

  if (field === "keys" || field === "secondary_keys") {
    entry[field] = input.value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  } else if (input.type === "checkbox") {
    entry[field] = input.checked;
  } else if (input.type === "number") {
    entry[field] = Number(input.value || 0);
  } else {
    entry[field] = input.value;
  }

  syncEmbeddedLorebook();
  saveDraftQuietly();

  updateEntrySummary(input, entry);
}

function updateEntrySummary(input, entry) {
  const details = input.closest(".lorebook-entry-item");
  if (!details) return;

  const title = details.querySelector(".lorebook-entry-summary strong");
  const preview = details.querySelector(".lorebook-entry-summary small");

  if (title) {
    title.textContent = entry.name?.trim() || entry.comment?.trim() || "Untitled Entry";
  }

  if (preview) {
    preview.textContent = Array.isArray(entry.keys) && entry.keys.length
      ? entry.keys.join(", ")
      : "No keywords yet";
  }
}

function syncEmbeddedLorebook() {
  if (state.currentCard && state.currentProjectType === "bot-with-lorebook") {
    state.currentCard.data.character_book = state.currentLorebook;
  }
}
