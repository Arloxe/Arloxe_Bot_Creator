export const state = {
  currentProjectType: null,
  currentCard: null,
  currentLorebook: null,
  currentAvatarDataUrl: null
};

export function setCurrentCard(card) {
  state.currentCard = card;
}

export function setCurrentLorebook(lorebook) {
  state.currentLorebook = lorebook;
}

export function setCurrentProjectType(type) {
  state.currentProjectType = type;
}

export function setCurrentAvatar(dataUrl) {
  state.currentAvatarDataUrl = dataUrl;
}

export function saveDraftQuietly() {
  if (!state.currentCard && !state.currentLorebook) return;

  const draft = {
    projectType: state.currentProjectType,
    card: state.currentCard,
    lorebook: state.currentLorebook,
    avatarDataUrl: state.currentAvatarDataUrl
  };

  localStorage.setItem("arloxe-current-card", JSON.stringify(draft));
}

export function saveDraft() {
  if (!state.currentCard && !state.currentLorebook) {
    return {
      success: false,
      message: "Nothing to save"
    };
  }

  saveDraftQuietly();

  return {
    success: true,
    message: "Draft saved locally"
  };
}

export function loadSavedDraft() {
  const saved = localStorage.getItem("arloxe-current-card");
  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);

    if (parsed?.card || parsed?.lorebook) {
      state.currentProjectType = parsed.projectType || null;
      state.currentCard = parsed.card || null;
      state.currentLorebook = parsed.lorebook || null;
      state.currentAvatarDataUrl = parsed.avatarDataUrl || null;
      return;
    }

    if (parsed?.spec || parsed?.data) {
      state.currentProjectType = "bot";
      state.currentCard = parsed;
      state.currentLorebook = parsed?.data?.character_book || null;
      state.currentAvatarDataUrl = null;
    }
  } catch {
    localStorage.removeItem("arloxe-current-card");
  }
}

export function clearCurrentProject() {
  state.currentProjectType = null;
  state.currentCard = null;
  state.currentLorebook = null;
  state.currentAvatarDataUrl = null;
}
