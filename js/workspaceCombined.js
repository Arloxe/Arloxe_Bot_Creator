import { renderCardEditor } from "./botEditor.js";
import { renderLorebookEditor } from "./lorebookEditor.js";
import { createDefaultLorebook } from "./templates.js";

let workspacePanel = null;
let workspaceTitle = null;
let emptyState = null;

export function setupCombinedWorkspace(elements) {
  workspacePanel = elements.workspacePanel;
  workspaceTitle = elements.workspaceTitle;
  emptyState = elements.emptyState;
}

export function renderBotWithLorebookWorkspace(card) {
  if (!card.data.character_book) {
    card.data.character_book = createDefaultLorebook();
  }

  emptyState.style.display = "none";

  workspaceTitle.textContent = card.data.name
    ? `Editing: ${card.data.name} + Lorebook`
    : "Bot + Lorebook Editor";

  let mount = document.getElementById("editorMount");

  if (!mount) {
    mount = document.createElement("div");
    mount.id = "editorMount";
    mount.className = "editor-mount";
    workspacePanel.appendChild(mount);
  }

  mount.innerHTML = `
    <div class="combined-editor">
      <details class="workspace-collapse" open>
        <summary class="workspace-collapse-summary">
          <div>
            <strong>Character Editor</strong>
            <small>Edit the card, avatar, greetings, and prompt fields.</small>
          </div>
        </summary>

        <div class="workspace-collapse-body" id="characterEditorMount"></div>
      </details>

      <details class="workspace-collapse" open>
        <summary class="workspace-collapse-summary">
          <div>
            <strong>Lorebook Editor</strong>
            <small>Edit the embedded lorebook stored inside this character card.</small>
          </div>
        </summary>

        <div class="workspace-collapse-body" id="lorebookEditorMount"></div>
      </details>
    </div>
  `;

  renderCardEditor(card, { mountId: "characterEditorMount" });
  renderLorebookEditor(card.data.character_book, {
    mode: "embedded",
    mountId: "lorebookEditorMount"
  });

  workspaceTitle.textContent = card.data.name
    ? `Editing: ${card.data.name} + Lorebook`
    : "Bot + Lorebook Editor";
}