import { loadPartials } from "./partials.js";
import { renderCardEditor, setupBotEditor } from "./botEditor.js";
import { exportCurrentCardJson, exportCurrentCardPng, setupFileExport } from "./fileExport.js";
import { handleFile, setupFileImport } from "./fileImport.js";
import { createDefaultCard, createDefaultLorebook } from "./templates.js";
import { renderLorebookEditor, setupLorebookEditor } from "./lorebookEditor.js";
import {
  loadSavedDraft,
  saveDraft,
  setCurrentAvatar,
  setCurrentLorebook,
  state
} from "./state.js";

import {
  renderBotWithLorebookWorkspace,
  setupCombinedWorkspace
} from "./workspaceCombined.js";

await loadPartials();

/* ================================
   DOM Elements
================================ */

const html = document.documentElement;
const accentSelect = document.getElementById("accentSelect");

const menuToggle = document.getElementById("menuToggle");
const closeMenu = document.getElementById("closeMenu");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");

const themeToggle = document.getElementById("themeToggle");
const themeIcon = themeToggle?.querySelector(".theme-icon");
const themeLabel = themeToggle?.querySelector(".theme-label");

const settingsButton = document.getElementById("settingsButton");
const settingsPanel = document.getElementById("settingsPanel");
const closeSettings = document.getElementById("closeSettings");

const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const browseFileButton = document.getElementById("browseFileButton");
const fileTypeStatus = document.getElementById("fileTypeStatus");

const workspacePanel = document.getElementById("workspacePanel");
const workspaceTitle = document.getElementById("workspaceTitle");
const emptyState = document.getElementById("emptyState");
const saveDraftButton = document.getElementById("saveDraftButton");
const exportButton = document.getElementById("exportButton");

const navActions = document.querySelectorAll("[data-action]");

/* ================================
   Setup Modules
================================ */

setupBotEditor({
  workspacePanel,
  workspaceTitle,
  emptyState,
  exportButton
});

setupCombinedWorkspace({
  workspacePanel,
  workspaceTitle,
  emptyState
});

setupLorebookEditor({
  workspacePanel,
  workspaceTitle,
  emptyState
});

setupFileImport({
  fileTypeStatus,
  workspaceTitle,
  emptyState
});

setupFileExport({
  fileTypeStatus
});

/* ================================
   Sidebar
================================ */

function openSidebar() {
  sidebar.classList.add("is-open");
  sidebarOverlay.classList.add("is-open");
}

function closeSidebar() {
  sidebar.classList.remove("is-open");
  sidebarOverlay.classList.remove("is-open");
}

/* ================================
   Theme
================================ */

function setTheme(theme) {
  html.dataset.theme = theme;
  localStorage.setItem("arloxe-theme", theme);

  if (theme === "light") {
    themeIcon.textContent = "☀️";
    themeLabel.textContent = "Light";
  } else {
    themeIcon.textContent = "🌙";
    themeLabel.textContent = "Dark";
  }
}

function toggleTheme() {
  const currentTheme = html.dataset.theme || "dark";
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  setTheme(nextTheme);
}

function setAccent(accent) {
  html.dataset.accent = accent;
  localStorage.setItem("arloxe-accent", accent);

  if (accentSelect) {
    accentSelect.value = accent;
  }
}

function initAccent() {
  const savedAccent = localStorage.getItem("arloxe-accent") || "forest-gold";
  setAccent(savedAccent);
}

/* ================================
   Settings
================================ */

function toggleSettings() {
  const isOpen = settingsPanel.classList.toggle("is-open");
  settingsPanel.setAttribute("aria-hidden", String(!isOpen));
}

function closeSettingsPanel() {
  settingsPanel.classList.remove("is-open");
  settingsPanel.setAttribute("aria-hidden", "true");
}

/* ================================
   Actions
================================ */

function setActiveAction(action) {
  document.querySelectorAll(".nav-action").forEach((button) => {
    button.classList.toggle("active", button.dataset.action === action);
  });
}

function handleAction(action) {
  setActiveAction(action);

  if (action === "new-bot") {
    setCurrentAvatar(null);
    renderCardEditor(createDefaultCard());
    fileTypeStatus.textContent = "New bot created";
    closeSidebar();
    return;
  }

  if (action === "new-bot-lorebook") {
  setCurrentAvatar(null);

  const card = createDefaultCard();
  card.data.character_book = createDefaultLorebook();

  renderBotWithLorebookWorkspace(card);

  fileTypeStatus.textContent = "New bot with empty lorebook";
  closeSidebar();
  return;
  }

  if (action === "new-lorebook") {
  setCurrentAvatar(null);
  setCurrentLorebook(createDefaultLorebook());

  renderLorebookEditor(state.currentLorebook, { mode: "standalone" });

  fileTypeStatus.textContent = "New lorebook created";
  closeSidebar();
  return;
  }

  if (action === "edit-file") {
    document.getElementById("editPanel")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
    closeSidebar();
  }
}

/* ================================
   Init
================================ */

function init() {
  const savedTheme = localStorage.getItem("arloxe-theme") || "dark";
  setTheme(savedTheme);
  initAccent();

  loadSavedDraft();

  const route = window.location.hash.replace("#", "");

  if (route) {
    handleAction(route);
    return;
  }

  if (state.currentCard && state.currentProjectType === "bot-with-lorebook") {
  renderBotWithLorebookWorkspace(state.currentCard);
  fileTypeStatus.textContent = "Loaded saved bot + lorebook draft";
  return;
  }

  if (state.currentLorebook && state.currentProjectType === "lorebook") {
    renderLorebookEditor(state.currentLorebook, { mode: "standalone" });
    fileTypeStatus.textContent = "Loaded saved lorebook draft";
    return;
  }

  if (state.currentCard) {
    renderCardEditor(state.currentCard);
    fileTypeStatus.textContent = "Loaded saved draft";
  }
}

init();

/* ================================
   Event Listeners
================================ */

menuToggle?.addEventListener("click", openSidebar);
closeMenu?.addEventListener("click", closeSidebar);
sidebarOverlay?.addEventListener("click", closeSidebar);

themeToggle?.addEventListener("click", toggleTheme);
accentSelect?.addEventListener("change", () => {
  setAccent(accentSelect.value);
});

settingsButton?.addEventListener("click", toggleSettings);
closeSettings?.addEventListener("click", closeSettingsPanel);

saveDraftButton?.addEventListener("click", () => {
  const result = saveDraft();
  fileTypeStatus.textContent = result.message;
});

exportButton?.addEventListener("click", exportCurrentCardJson);

document.addEventListener("arloxe:export-png", exportCurrentCardPng);

navActions.forEach((button) => {
  button.addEventListener("click", () => {
    handleAction(button.dataset.action);
  });
});

browseFileButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  fileInput.click();
});

dropZone?.addEventListener("click", () => {
  fileInput.click();
});

fileInput?.addEventListener("change", (event) => {
  const file = event.target.files[0];
  handleFile(file);
});

dropZone?.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("is-dragging");
});

dropZone?.addEventListener("dragleave", () => {
  dropZone.classList.remove("is-dragging");
});

dropZone?.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("is-dragging");

  const file = event.dataTransfer.files[0];
  handleFile(file);
});