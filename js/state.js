export const state = {
  currentProjectType: null,
  currentCard: null,
  currentLorebook: null,
  currentPreset: null,
  currentAvatarDataUrl: null,
  currentAvatarImageType: "square",
  currentAvatarCrop: {
    x: 0.5,
    y: 0.5,
    zoom: 1
  }
};

export function setCurrentCard(card) {
  state.currentCard = card;
}

export function setCurrentLorebook(lorebook) {
  state.currentLorebook = lorebook;
}

export function setCurrentPreset(preset) {
  state.currentPreset = preset;
}

export function setCurrentProjectType(type) {
  state.currentProjectType = type;
}

export function setCurrentAvatar(dataUrl) {
  state.currentAvatarDataUrl = dataUrl;
}

export function setCurrentAvatarImageType(type) {
  state.currentAvatarImageType =
    type === "portrait" || type === "landscape" ? type : "square";
}

export function setCurrentAvatarCrop(crop) {
  state.currentAvatarCrop = {
    x: clampCropValue(crop?.x),
    y: clampCropValue(crop?.y),
    zoom: clampZoomValue(crop?.zoom)
  };
}

function clampCropValue(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0.5;
  }

  return Math.min(1, Math.max(0, number));
}

// Kept in sync with MAX_AVATAR_ZOOM in utils.js (duplicated here to avoid a
// circular import, since utils.js already imports from state.js).
function clampZoomValue(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 1;
  }

  return Math.min(4, Math.max(1, number));
}

export function saveDraftQuietly() {
  if (!state.currentCard && !state.currentLorebook && !state.currentPreset) return;

  const draft = {
    projectType: state.currentProjectType,
    card: state.currentCard,
    lorebook: state.currentLorebook,
    preset: state.currentPreset,
    avatarDataUrl: state.currentAvatarDataUrl,
    avatarImageType: state.currentAvatarImageType,
    avatarCrop: state.currentAvatarCrop
  };

  localStorage.setItem("arloxe-current-card", JSON.stringify(draft));
}

export function saveDraft() {
  if (!state.currentCard && !state.currentLorebook && !state.currentPreset) {
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

    if (parsed?.card || parsed?.lorebook || parsed?.preset) {
      state.currentProjectType = parsed.projectType || null;
      state.currentCard = parsed.card || null;
      state.currentLorebook = parsed.lorebook || null;
      state.currentPreset = parsed.preset || null;
      state.currentAvatarDataUrl = parsed.avatarDataUrl || null;
      setCurrentAvatarImageType(parsed.avatarImageType);
      setCurrentAvatarCrop(parsed.avatarCrop);
      return;
    }

    if (parsed?.spec || parsed?.data) {
      state.currentProjectType = "bot";
      state.currentCard = parsed;
      state.currentLorebook = parsed?.data?.character_book || null;
      state.currentAvatarDataUrl = null;
      setCurrentAvatarImageType();
      setCurrentAvatarCrop();
    }
  } catch {
    localStorage.removeItem("arloxe-current-card");
  }
}

export function clearCurrentProject() {
  state.currentProjectType = null;
  state.currentCard = null;
  state.currentLorebook = null;
  state.currentPreset = null;
  state.currentAvatarDataUrl = null;
  setCurrentAvatarImageType();
  setCurrentAvatarCrop();
}
