import {
  saveDraftQuietly,
  setCurrentPreset,
  setCurrentProjectType,
  state
} from "./state.js";

import { confirmAction } from "./confirmDialog.js";
import { escapeHtml } from "./utils.js";

let workspacePanel = null;
let workspaceTitle = null;
let emptyState = null;

const NUMBER_FIELDS = [
  ["temperature", "Temperature"],
  ["top_p", "Top P"],
  ["top_k", "Top K"],
  ["top_a", "Top A"],
  ["min_p", "Min P"],
  ["frequency_penalty", "Frequency Penalty"],
  ["presence_penalty", "Presence Penalty"],
  ["repetition_penalty", "Repetition Penalty"],
  ["openai_max_context", "Max Context"],
  ["openai_max_tokens", "Max Tokens"],
  ["seed", "Seed"],
  ["n", "Responses"]
];

const BOOLEAN_FIELDS = [
  ["stream_openai", "Stream"],
  ["wrap_in_quotes", "Wrap In Quotes"],
  ["max_context_unlocked", "Max Context Unlocked"],
  ["claude_use_sysprompt", "Claude System Prompt"],
  ["use_makersuite_sysprompt", "MakerSuite System Prompt"],
  ["squash_system_messages", "Squash System Messages"],
  ["image_inlining", "Inline Images"],
  ["video_inlining", "Inline Video"],
  ["audio_inlining", "Inline Audio"],
  ["continue_prefill", "Continue Prefill"],
  ["function_calling", "Function Calling"],
  ["show_thoughts", "Show Thoughts"],
  ["enable_web_search", "Web Search"],
  ["request_images", "Request Images"]
];

const TEXT_FIELDS = [
  ["impersonation_prompt", "Impersonation Prompt"],
  ["new_chat_prompt", "New Chat Prompt"],
  ["new_group_chat_prompt", "New Group Chat Prompt"],
  ["new_example_chat_prompt", "Example Chat Prompt"],
  ["continue_nudge_prompt", "Continue Nudge Prompt"],
  ["group_nudge_prompt", "Group Nudge Prompt"],
  ["wi_format", "World Info Format"],
  ["scenario_format", "Scenario Format"],
  ["personality_format", "Personality Format"],
  ["assistant_prefill", "Assistant Prefill"],
  ["assistant_impersonation", "Assistant Impersonation"],
  ["continue_postfix", "Continue Postfix"]
];

export function setupPresetEditor(elements) {
  workspacePanel = elements.workspacePanel;
  workspaceTitle = elements.workspaceTitle;
  emptyState = elements.emptyState;
}

export function renderPresetEditor(preset, options = {}) {
  const projectType = options.projectType || "preset";
  const label = options.label || (projectType === "template" ? "Template" : "Preset");

  setCurrentProjectType(projectType);
  setCurrentPreset(preset);

  emptyState.style.display = "none";
  workspaceTitle.textContent = `${label}: ${getPresetTitle(preset)}`;

  const mount = ensureEditorMount();

  mount.innerHTML = `
    <form class="editor-form" id="presetEditorForm">
      <nav class="preset-jump-nav" aria-label="Preset jump navigation">
        <button type="button" data-preset-jump="top">Top</button>
        <button type="button" data-preset-jump="text">Text</button>
        <button type="button" data-preset-jump="middle">Middle</button>
        <button type="button" data-preset-jump="bottom">Bottom</button>
      </nav>

      <div class="editor-section">
        <div class="section-title">
          <span class="ui-icon ui-icon-preset" aria-hidden="true"></span>
          <div>
            <h3>${label} Settings</h3>
            <p>Sampling, context, and provider options stored in this ${label.toLowerCase()}.</p>
          </div>
        </div>

        <div class="form-grid two-columns">
          ${renderNumberFields(preset)}
        </div>

        <div class="preset-toggle-grid">
          ${renderBooleanFields(preset)}
        </div>
      </div>

      <details class="editor-section preset-text-collapse" id="presetTextSection">
        <summary class="preset-section-summary">
          <span class="ui-icon ui-icon-note" aria-hidden="true"></span>
          <div>
            <h3>Preset Text</h3>
            <p>Prompt wrappers and format strings used around the chat.</p>
          </div>
        </summary>

        <div class="form-grid">
          ${renderTextFields(preset)}
        </div>
      </details>

      <div class="editor-section" id="presetPromptSection">
        <div class="section-title preset-prompt-title">
          <span class="ui-icon ui-icon-messages" aria-hidden="true"></span>
          <div>
            <h3>Prompt Blocks</h3>
            <p>Individual SillyTavern prompt entries, markers, roles, and injected content.</p>
          </div>

          <button class="secondary-button" type="button" id="addPresetPromptButton">
            Add Prompt
          </button>
        </div>

        <div class="preset-prompt-search">
          <label class="form-field">
            <span>Search Prompt Blocks</span>
            <input type="search" id="presetPromptSearch" placeholder="Search name, identifier, role, or content..." autocomplete="off" />
          </label>

          <button class="secondary-button" type="button" id="clearPresetPromptSearch">
            Clear
          </button>

          <span class="preset-search-count" id="presetPromptSearchCount"></span>
        </div>

        <div class="preset-prompt-list" id="presetPromptList"></div>
      </div>
    </form>
  `;

  renderPresetPrompts();
  wirePresetEvents();
  wirePresetJumpNav();
}

function ensureEditorMount() {
  let mount = document.getElementById("editorMount");

  if (!mount) {
    mount = document.createElement("div");
    mount.id = "editorMount";
    mount.className = "editor-mount";
    workspacePanel.appendChild(mount);
  }

  return mount;
}

function getPresetTitle(preset) {
  return preset.name || `${Array.isArray(preset.prompts) ? preset.prompts.length : 0} prompt blocks`;
}

function renderNumberFields(preset) {
  return NUMBER_FIELDS
    .filter(([field]) => field in preset)
    .map(([field, label]) => `
      <label class="form-field">
        <span>${label}</span>
        <input type="number" step="any" data-preset-field="${field}" value="${escapeHtml(preset[field])}" />
      </label>
    `)
    .join("");
}

function renderBooleanFields(preset) {
  return BOOLEAN_FIELDS
    .filter(([field]) => field in preset)
    .map(([field, label]) => `
      <label class="toggle-chip">
        <input type="checkbox" data-preset-field="${field}" ${preset[field] ? "checked" : ""} />
        <span>${label}</span>
      </label>
    `)
    .join("");
}

function renderTextFields(preset) {
  return TEXT_FIELDS
    .filter(([field]) => field in preset)
    .map(([field, label]) => `
      <label class="form-field">
        <span>${label}</span>
        <textarea data-preset-field="${field}" rows="4">${escapeHtml(preset[field])}</textarea>
      </label>
    `)
    .join("");
}

function wirePresetEvents() {
  const form = document.getElementById("presetEditorForm");
  const addPromptButton = document.getElementById("addPresetPromptButton");
  const searchInput = document.getElementById("presetPromptSearch");
  const clearSearchButton = document.getElementById("clearPresetPromptSearch");

  form?.querySelectorAll("[data-preset-field]").forEach((input) => {
    input.addEventListener("input", () => updatePresetField(input));
    input.addEventListener("change", () => updatePresetField(input));
  });

  addPromptButton?.addEventListener("click", () => {
    state.currentPreset.prompts = state.currentPreset.prompts || [];
    const prompt = createPresetPrompt();
    state.currentPreset.prompts.push(prompt);
    addPromptToOrder(prompt);
    renderPresetPrompts();
    saveDraftQuietly();
  });

  searchInput?.addEventListener("input", () => filterPresetPrompts(searchInput.value));
  clearSearchButton?.addEventListener("click", () => {
    searchInput.value = "";
    filterPresetPrompts("");
    searchInput.focus();
  });
}

function wirePresetJumpNav() {
  document.querySelectorAll("[data-preset-jump]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = getPresetJumpTarget(button.dataset.presetJump);

      target?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  });
}

function getPresetJumpTarget(target) {
  if (target === "top") return workspaceTitle;
  if (target === "text") return document.getElementById("presetTextSection");
  if (target === "bottom") return document.getElementById("presetPromptList")?.lastElementChild;

  if (target === "middle") {
    const prompts = document.querySelectorAll(".preset-prompt-item");
    return prompts[Math.floor(prompts.length / 2)] || document.getElementById("presetPromptSection");
  }

  return null;
}

function updatePresetField(input) {
  const field = input.dataset.presetField;

  if (!state.currentPreset || !field) return;

  if (input.type === "checkbox") {
    state.currentPreset[field] = input.checked;
  } else if (input.type === "number") {
    state.currentPreset[field] = Number(input.value || 0);
  } else {
    state.currentPreset[field] = input.value;
  }

  saveDraftQuietly();
}

function renderPresetPrompts() {
  const list = document.getElementById("presetPromptList");
  if (!list || !state.currentPreset) return;

  const prompts = Array.isArray(state.currentPreset.prompts)
    ? state.currentPreset.prompts
    : [];

  if (prompts.length === 0) {
    list.innerHTML = `
      <div class="mini-empty-state">
        <span class="ui-icon ui-icon-note" aria-hidden="true"></span>
        <p>No prompt blocks yet.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = prompts.map((prompt, index) => renderPromptItem(prompt, index)).join("");
  wirePromptEvents();
  wirePromptDragEvents();
  filterPresetPrompts(document.getElementById("presetPromptSearch")?.value || "");
}

function renderPromptItem(prompt, index) {
  const title = prompt.name?.trim() || prompt.identifier?.trim() || `Prompt ${index + 1}`;
  const preview = prompt.marker
    ? "Marker prompt"
    : prompt.content?.trim() || "No content";

  return `
    <details class="preset-prompt-item" data-prompt-index="${index}">
      <summary class="preset-prompt-summary">
        <button class="preset-drag-handle" type="button" title="Drag to reorder" aria-label="Drag ${escapeHtml(title)} to reorder">
          <span aria-hidden="true">::</span>
        </button>

        <div class="preset-prompt-info">
          <strong>${escapeHtml(title)}</strong>
          <small>${escapeHtml(preview)}</small>
        </div>

        <div class="preset-prompt-actions">
          <button class="preset-menu-button" type="button" data-preset-menu="${index}" aria-label="Open prompt move menu" aria-expanded="false">
            ...
          </button>

          <div class="preset-move-menu" data-preset-menu-panel="${index}" hidden>
            <button type="button" data-move-preset-prompt="${index}" data-move-target="top">Move to Top</button>
            <button type="button" data-move-preset-prompt="${index}" data-move-target="middle">Move to Middle</button>
            <button type="button" data-move-preset-prompt="${index}" data-move-target="bottom">Move to Bottom</button>
          </div>

          <button class="tiny-danger-button" type="button" data-remove-preset-prompt="${index}">
            Delete
          </button>
        </div>
      </summary>

      <div class="preset-prompt-body">
        <div class="form-grid two-columns">
          ${renderPromptTextInput(index, "name", "Name", prompt.name)}
          ${renderPromptTextInput(index, "identifier", "Identifier", prompt.identifier)}

          <label class="form-field">
            <span>Role</span>
            <select data-prompt-index="${index}" data-prompt-field="role">
              ${renderRoleOption(prompt.role, "system")}
              ${renderRoleOption(prompt.role, "user")}
              ${renderRoleOption(prompt.role, "assistant")}
            </select>
          </label>

          ${renderPromptNumberInput(index, "injection_position", "Injection Position", prompt.injection_position)}
          ${renderPromptNumberInput(index, "injection_depth", "Injection Depth", prompt.injection_depth)}
          ${renderPromptNumberInput(index, "injection_order", "Injection Order", prompt.injection_order)}
        </div>

        <div class="preset-toggle-grid">
          ${renderPromptCheckbox(index, "enabled", "Enabled", prompt.enabled)}
          ${renderPromptCheckbox(index, "system_prompt", "System Prompt", prompt.system_prompt)}
          ${renderPromptCheckbox(index, "marker", "Marker", prompt.marker)}
          ${renderPromptCheckbox(index, "forbid_overrides", "Forbid Overrides", prompt.forbid_overrides)}
        </div>

        <label class="form-field">
          <span>Content</span>
          <textarea data-prompt-index="${index}" data-prompt-field="content" rows="8">${escapeHtml(prompt.content || "")}</textarea>
        </label>
      </div>
    </details>
  `;
}

function filterPresetPrompts(query) {
  const normalizedQuery = query.trim().toLowerCase();
  const prompts = state.currentPreset?.prompts || [];
  const items = document.querySelectorAll(".preset-prompt-item");
  const count = document.getElementById("presetPromptSearchCount");
  let visibleCount = 0;

  items.forEach((item) => {
    const index = Number(item.dataset.promptIndex);
    const prompt = prompts[index];
    const haystack = getPromptSearchText(prompt);
    const isVisible = !normalizedQuery || haystack.includes(normalizedQuery);

    item.hidden = !isVisible;

    if (isVisible) {
      visibleCount += 1;
    }
  });

  if (count) {
    count.textContent = normalizedQuery
      ? `${visibleCount} of ${prompts.length} shown`
      : `${prompts.length} blocks`;
  }
}

function getPromptSearchText(prompt) {
  if (!prompt) return "";

  return [
    prompt.name,
    prompt.identifier,
    prompt.id,
    prompt.role,
    prompt.content
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function renderPromptTextInput(index, field, label, value) {
  return `
    <label class="form-field">
      <span>${label}</span>
      <input type="text" data-prompt-index="${index}" data-prompt-field="${field}" value="${escapeHtml(value || "")}" />
    </label>
  `;
}

function renderPromptNumberInput(index, field, label, value) {
  return `
    <label class="form-field">
      <span>${label}</span>
      <input type="number" data-prompt-index="${index}" data-prompt-field="${field}" value="${escapeHtml(value ?? 0)}" />
    </label>
  `;
}

function renderPromptCheckbox(index, field, label, checked) {
  return `
    <label class="toggle-chip">
      <input type="checkbox" data-prompt-index="${index}" data-prompt-field="${field}" ${checked ? "checked" : ""} />
      <span>${label}</span>
    </label>
  `;
}

function renderRoleOption(currentRole, role) {
  return `<option value="${role}" ${currentRole === role ? "selected" : ""}>${role}</option>`;
}

function wirePromptEvents() {
  const list = document.getElementById("presetPromptList");

  list.querySelectorAll("[data-preset-menu]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      togglePromptMoveMenu(button);
    });
  });

  list.querySelectorAll("[data-move-preset-prompt]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const index = Number(button.dataset.movePresetPrompt);
      movePromptToTarget(index, button.dataset.moveTarget);
    });
  });

  list.querySelectorAll("[data-remove-preset-prompt]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const index = Number(button.dataset.removePresetPrompt);
      const prompt = state.currentPreset.prompts[index];
      const promptTitle = prompt?.name?.trim() || prompt?.identifier?.trim() || `Prompt ${index + 1}`;
      const shouldRemove = await confirmAction({
        title: "Delete preset prompt?",
        message: `"${promptTitle}" will be removed from this preset.`,
        confirmLabel: "Delete Prompt"
      });

      if (!shouldRemove) return;

      state.currentPreset.prompts.splice(index, 1);
      removePromptFromOrders(prompt);
      renderPresetPrompts();
      saveDraftQuietly();
    });
  });

  list.querySelectorAll("[data-prompt-field]").forEach((input) => {
    input.addEventListener("input", () => updatePromptField(input));
    input.addEventListener("change", () => updatePromptField(input));
  });

  list.querySelectorAll(".preset-drag-handle").forEach((handle) => {
    handle.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
  });
}

function togglePromptMoveMenu(button) {
  const index = button.dataset.presetMenu;
  const panel = document.querySelector(`[data-preset-menu-panel="${index}"]`);
  const willOpen = panel?.hidden;

  closePromptMoveMenus();

  if (!panel || !willOpen) return;

  panel.hidden = false;
  button.setAttribute("aria-expanded", "true");

  const menuRect = panel.getBoundingClientRect();
  const footer = document.querySelector(".site-footer");
  const boundary = footer
    ? footer.getBoundingClientRect().top
    : window.innerHeight - 16;

  if (menuRect.bottom > boundary) {
    panel.classList.add("drop-up");
  }
}

function closePromptMoveMenus() {
  document.querySelectorAll("[data-preset-menu-panel]").forEach((panel) => {
    panel.hidden = true;
    panel.classList.remove("drop-up");
  });

  document.querySelectorAll("[data-preset-menu]").forEach((button) => {
    button.setAttribute("aria-expanded", "false");
  });
}

function wirePromptDragEvents() {
  const list = document.getElementById("presetPromptList");
  if (!list) return;

  let draggedItem = null;
  let autoScrollFrame = null;
  let lastClientY = 0;
  let didMove = false;

  list.querySelectorAll(".preset-drag-handle").forEach((handle) => {
    handle.addEventListener("pointerdown", (event) => {
      const item = handle.closest(".preset-prompt-item");
      if (!item || event.button !== 0) return;

      event.preventDefault();
      event.stopPropagation();
      draggedItem = item;
      didMove = false;
      lastClientY = event.clientY;
      item.classList.add("is-dragging");
      handle.setPointerCapture?.(event.pointerId);

      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp, { once: true });
      document.addEventListener("pointercancel", handlePointerCancel, { once: true });
    });
  });

  function handlePointerMove(event) {
    if (!draggedItem) return;

    event.preventDefault();
    didMove = true;
    lastClientY = event.clientY;
    updateAutoScroll();

    const afterElement = getDragAfterElement(list, event.clientY);

    if (!afterElement) {
      list.appendChild(draggedItem);
    } else if (afterElement !== draggedItem) {
      list.insertBefore(draggedItem, afterElement);
    }
  }

  function handlePointerUp(event) {
    if (!draggedItem) return;

    event.preventDefault();
    event.stopPropagation();
    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointercancel", handlePointerCancel);
    stopAutoScroll();

    draggedItem.classList.remove("is-dragging");

    if (didMove) {
      commitPromptDomOrder();
    }

    draggedItem = null;
    didMove = false;
  }

  function handlePointerCancel() {
    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);
    stopAutoScroll();

    draggedItem?.classList.remove("is-dragging");
    draggedItem = null;
    didMove = false;
  }

  function updateAutoScroll() {
    if (autoScrollFrame) return;

    const edgeSize = 96;

    function step() {
      const distanceTop = lastClientY;
      const distanceBottom = window.innerHeight - lastClientY;
      let delta = 0;

      if (distanceTop < edgeSize) {
        delta = -Math.max(6, edgeSize - distanceTop) / 2;
      } else if (distanceBottom < edgeSize) {
        delta = Math.max(6, edgeSize - distanceBottom) / 2;
      }

      if (delta !== 0) {
        window.scrollBy(0, delta);
        autoScrollFrame = requestAnimationFrame(step);
      } else {
        autoScrollFrame = null;
      }
    }

    autoScrollFrame = requestAnimationFrame(step);
  }

  function stopAutoScroll() {
    if (autoScrollFrame) {
      cancelAnimationFrame(autoScrollFrame);
      autoScrollFrame = null;
    }
  }
}

function getDragAfterElement(list, y) {
  const items = [...list.querySelectorAll(".preset-prompt-item:not(.is-dragging)")];

  return items.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    }

    return closest;
  }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
}

function commitPromptDomOrder() {
  const list = document.getElementById("presetPromptList");
  const prompts = state.currentPreset?.prompts;

  if (!list || !Array.isArray(prompts)) return;

  const orderedIndexes = [...list.querySelectorAll(".preset-prompt-item")]
    .map((item) => Number(item.dataset.promptIndex))
    .filter((index) => Number.isInteger(index) && prompts[index]);

  if (orderedIndexes.length !== prompts.length) return;

  state.currentPreset.prompts = orderedIndexes.map((index) => prompts[index]);
  syncPromptOrdersToPromptList();
  renderPresetPrompts();
  saveDraftQuietly();
}

function movePromptToTarget(index, target) {
  const prompts = state.currentPreset?.prompts;
  if (!Array.isArray(prompts) || !prompts[index]) return;

  const [prompt] = prompts.splice(index, 1);
  const destination = getPromptMoveIndex(target, prompts.length);

  prompts.splice(destination, 0, prompt);
  closePromptMoveMenus();
  syncPromptOrdersToPromptList();
  renderPresetPrompts();
  saveDraftQuietly();

  requestAnimationFrame(() => {
    document
      .querySelector(`.preset-prompt-item[data-prompt-index="${destination}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

function getPromptMoveIndex(target, promptCountAfterRemoval) {
  if (target === "top") return 0;
  if (target === "middle") return Math.floor(promptCountAfterRemoval / 2);
  return promptCountAfterRemoval;
}

function updatePromptField(input) {
  const index = Number(input.dataset.promptIndex);
  const field = input.dataset.promptField;
  const prompt = state.currentPreset?.prompts?.[index];

  if (!prompt || !field) return;

  const previousIdentifier = prompt.identifier || prompt.id;

  if (input.type === "checkbox") {
    prompt[field] = input.checked;
    syncPromptOrderEnabled(prompt);
  } else if (input.type === "number") {
    prompt[field] = Number(input.value || 0);
  } else {
    prompt[field] = input.value;
  }

  if (field === "identifier" || field === "id") {
    syncPromptOrderIdentifier(previousIdentifier, prompt.identifier || prompt.id);
  }

  updatePromptSummary(input, prompt);
  saveDraftQuietly();
}

function updatePromptSummary(input, prompt) {
  const details = input.closest(".preset-prompt-item");
  if (!details) return;

  const title = details.querySelector(".preset-prompt-summary strong");
  const preview = details.querySelector(".preset-prompt-summary small");

  if (title) {
    title.textContent = prompt.name?.trim() || prompt.identifier?.trim() || "Untitled Prompt";
  }

  if (preview) {
    preview.textContent = prompt.marker
      ? "Marker prompt"
      : prompt.content?.trim() || "No content";
  }
}

function syncPromptOrderEnabled(prompt) {
  const orders = state.currentPreset?.prompt_order;
  const identifier = prompt.identifier || prompt.id;

  if (!Array.isArray(orders) || !identifier) return;

  orders.forEach((group) => {
    group.order?.forEach((entry) => {
      if (entry.identifier === identifier) {
        entry.enabled = Boolean(prompt.enabled);
      }
    });
  });
}

function syncPromptOrderIdentifier(previousIdentifier, nextIdentifier) {
  const orders = state.currentPreset?.prompt_order;

  if (!Array.isArray(orders) || !previousIdentifier || !nextIdentifier) return;

  orders.forEach((group) => {
    group.order?.forEach((entry) => {
      if (entry.identifier === previousIdentifier) {
        entry.identifier = nextIdentifier;
      }
    });
  });
}

function addPromptToOrder(prompt) {
  const identifier = prompt.identifier || prompt.id;
  if (!identifier) return;

  state.currentPreset.prompt_order = Array.isArray(state.currentPreset.prompt_order)
    ? state.currentPreset.prompt_order
    : [];

  if (state.currentPreset.prompt_order.length === 0) {
    state.currentPreset.prompt_order.push({ character_id: 100001, order: [] });
  }

  const order = state.currentPreset.prompt_order[0].order || [];
  state.currentPreset.prompt_order[0].order = order;

  if (!order.some((entry) => entry.identifier === identifier)) {
    order.push({ identifier, enabled: Boolean(prompt.enabled) });
  }
}

function removePromptFromOrders(prompt) {
  const orders = state.currentPreset?.prompt_order;
  const identifier = prompt?.identifier || prompt?.id;

  if (!Array.isArray(orders) || !identifier) return;

  orders.forEach((group) => {
    if (Array.isArray(group.order)) {
      group.order = group.order.filter((entry) => entry.identifier !== identifier);
    }
  });
}

function syncPromptOrdersToPromptList() {
  const orders = state.currentPreset?.prompt_order;
  const promptIdentifiers = state.currentPreset?.prompts
    ?.map((prompt) => prompt.identifier || prompt.id)
    .filter(Boolean);

  if (!Array.isArray(orders) || !Array.isArray(promptIdentifiers)) return;

  orders.forEach((group) => {
    if (!Array.isArray(group.order)) return;

    const entriesByIdentifier = new Map(
      group.order.map((entry) => [entry.identifier, entry])
    );
    const reorderedEntries = promptIdentifiers
      .filter((identifier) => entriesByIdentifier.has(identifier))
      .map((identifier) => entriesByIdentifier.get(identifier));
    const remainingEntries = group.order.filter((entry) => !promptIdentifiers.includes(entry.identifier));

    group.order = [...reorderedEntries, ...remainingEntries];
  });
}

function createPresetPrompt() {
  const id = crypto.randomUUID?.() || String(Date.now());

  return {
    id,
    identifier: id,
    name: "New Prompt",
    role: "user",
    content: "",
    enabled: true,
    system_prompt: false,
    marker: false,
    injection_position: 0,
    injection_depth: 4,
    forbid_overrides: false
  };
}
