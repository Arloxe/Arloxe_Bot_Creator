import { clampCrop01, computeCropRect, MAX_AVATAR_ZOOM } from "./utils.js";

/* ================================
   Avatar Cropper
   An interactive "drag to position + zoom" cropper rendered in a modal
   (markup lives in partials/image_preview_fragment.html). It reads/writes the
   same { x, y, zoom } crop model used by the export and the live preview.
================================ */

// Position/scale a preview <img> inside a square box so it shows exactly the
// crop region. Shared by the editor's small avatar preview.
export function applyCropToImage(imageEl, boxSize, crop) {
  const nw = imageEl.naturalWidth;
  const nh = imageEl.naturalHeight;
  if (!nw || !nh || !boxSize) return;

  const { sx, sy, side } = computeCropRect(nw, nh, crop);
  const scale = boxSize / side; // display px per source px

  imageEl.style.width = `${nw * scale}px`;
  imageEl.style.height = `${nh * scale}px`;
  imageEl.style.left = `${-sx * scale}px`;
  imageEl.style.top = `${-sy * scale}px`;
}

function getElements() {
  const root = document.getElementById("avatarCropper");
  if (!root) return null;

  return {
    root,
    stage: document.getElementById("avatarCropperStage"),
    image: document.getElementById("avatarCropperImage"),
    zoom: document.getElementById("avatarCropperZoom"),
    apply: document.getElementById("avatarCropperApply"),
    reset: document.getElementById("avatarCropperReset")
  };
}

// Opens the cropper for the given image. Resolves with a new { x, y, zoom }
// crop on Apply, or null if the user cancels/closes.
export function openAvatarCropper(dataUrl, initialCrop) {
  return new Promise((resolve) => {
    const el = getElements();
    if (!el || !el.stage || !el.image) {
      resolve(null);
      return;
    }

    let nw = 0;
    let nh = 0;
    let boxSize = 0;
    let baseScale = 0; // scale at zoom 1 (smaller dimension fills the stage)
    let scale = 0;
    let zoom = 1;
    let left = 0;
    let top = 0;

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    function clampPan() {
      const dispW = nw * scale;
      const dispH = nh * scale;
      left = Math.min(0, Math.max(boxSize - dispW, left));
      top = Math.min(0, Math.max(boxSize - dispH, top));
    }

    function render() {
      el.image.style.width = `${nw * scale}px`;
      el.image.style.height = `${nh * scale}px`;
      el.image.style.left = `${left}px`;
      el.image.style.top = `${top}px`;
    }

    // Re-zoom while keeping the stage's centre pinned to the same source pixel.
    function setZoom(nextZoom) {
      const focalX = boxSize / 2;
      const focalY = boxSize / 2;
      const srcX = (focalX - left) / scale;
      const srcY = (focalY - top) / scale;

      zoom = Math.min(MAX_AVATAR_ZOOM, Math.max(1, nextZoom));
      scale = baseScale * zoom;

      left = focalX - srcX * scale;
      top = focalY - srcY * scale;

      clampPan();
      render();
    }

    function onPointerDown(event) {
      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
      startLeft = left;
      startTop = top;
      el.stage.setPointerCapture?.(event.pointerId);
    }

    function onPointerMove(event) {
      if (!dragging) return;
      left = startLeft + (event.clientX - startX);
      top = startTop + (event.clientY - startY);
      clampPan();
      render();
    }

    function onPointerUp(event) {
      dragging = false;
      el.stage.releasePointerCapture?.(event.pointerId);
    }

    function onZoomInput() {
      setZoom(Number(el.zoom.value) / 100);
    }

    function onResetClick() {
      zoom = 1;
      scale = baseScale;
      left = (boxSize - nw * scale) / 2;
      top = (boxSize - nh * scale) / 2;
      clampPan();
      if (el.zoom) el.zoom.value = 100;
      render();
    }

    function onKeyDown(event) {
      if (event.key === "Escape") finish(null);
    }

    function applyCrop() {
      const side = boxSize / scale; // source px shown in the stage
      const sx = -left / scale;
      const sy = -top / scale;
      const slackX = nw - side;
      const slackY = nh - side;

      finish({
        x: slackX > 0 ? clampCrop01(sx / slackX) : 0,
        y: slackY > 0 ? clampCrop01(sy / slackY) : 0,
        zoom
      });
    }

    function teardown() {
      el.root.hidden = true;
      el.root.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");

      el.stage.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      el.zoom?.removeEventListener("input", onZoomInput);
      el.reset?.removeEventListener("click", onResetClick);
      el.apply?.removeEventListener("click", applyCrop);
      document.removeEventListener("keydown", onKeyDown);
      closeButtons.forEach((btn) => btn.removeEventListener("click", onCancel));
      el.image.onload = null;
    }

    let settled = false;
    function finish(result) {
      if (settled) return;
      settled = true;
      teardown();
      resolve(result);
    }
    function onCancel() {
      finish(null);
    }

    const closeButtons = Array.from(el.root.querySelectorAll("[data-cropper-close]"));

    function initFromImage() {
      nw = el.image.naturalWidth;
      nh = el.image.naturalHeight;
      boxSize = el.stage.clientWidth;
      if (!nw || !nh || !boxSize) return;

      const minDim = Math.min(nw, nh);
      baseScale = boxSize / minDim;

      const crop = initialCrop || { x: 0.5, y: 0.5, zoom: 1 };
      zoom = Math.min(MAX_AVATAR_ZOOM, Math.max(1, Number(crop.zoom) || 1));
      scale = baseScale * zoom;

      const { sx, sy } = computeCropRect(nw, nh, {
        x: crop.x ?? 0.5,
        y: crop.y ?? 0.5,
        zoom
      });
      left = -sx * scale;
      top = -sy * scale;
      clampPan();

      if (el.zoom) el.zoom.value = Math.round(zoom * 100);
      render();
    }

    // Show + wire up.
    el.root.hidden = false;
    el.root.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    el.image.onload = initFromImage;
    el.image.src = dataUrl;
    if (el.image.complete && el.image.naturalWidth) initFromImage();

    el.stage.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    el.zoom?.addEventListener("input", onZoomInput);
    el.reset?.addEventListener("click", onResetClick);
    el.apply?.addEventListener("click", applyCrop);
    document.addEventListener("keydown", onKeyDown);
    closeButtons.forEach((btn) => btn.addEventListener("click", onCancel));
  });
}
