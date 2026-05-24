let confirmRoot = null;
let confirmTitle = null;
let confirmMessage = null;
let confirmCancel = null;
let confirmApply = null;

export function setupConfirmDialog() {
  if (confirmRoot) return;

  confirmRoot = document.createElement("div");
  confirmRoot.className = "confirm-dialog";
  confirmRoot.hidden = true;
  confirmRoot.setAttribute("aria-hidden", "true");
  confirmRoot.innerHTML = `
    <div class="confirm-dialog-backdrop" data-confirm-cancel></div>
    <div class="confirm-dialog-panel" role="dialog" aria-modal="true" aria-labelledby="confirmDialogTitle">
      <div class="confirm-dialog-icon" aria-hidden="true">
        <span class="ui-icon ui-icon-warning"></span>
      </div>
      <div class="confirm-dialog-copy">
        <h3 id="confirmDialogTitle"></h3>
        <p id="confirmDialogMessage"></p>
      </div>
      <div class="confirm-dialog-actions">
        <button class="secondary-button" type="button" data-confirm-cancel>Cancel</button>
        <button class="primary-button danger-button" type="button" id="confirmDialogApply">Continue</button>
      </div>
    </div>
  `;

  document.body.appendChild(confirmRoot);
  confirmTitle = confirmRoot.querySelector("#confirmDialogTitle");
  confirmMessage = confirmRoot.querySelector("#confirmDialogMessage");
  confirmCancel = confirmRoot.querySelectorAll("[data-confirm-cancel]");
  confirmApply = confirmRoot.querySelector("#confirmDialogApply");
}

export function confirmAction({
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmLabel = "Continue"
} = {}) {
  setupConfirmDialog();

  confirmTitle.textContent = title;
  confirmMessage.textContent = message;
  confirmApply.textContent = confirmLabel;

  confirmRoot.hidden = false;
  confirmRoot.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  confirmApply.focus();

  return new Promise((resolve) => {
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;

      confirmRoot.hidden = true;
      confirmRoot.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");

      confirmApply.removeEventListener("click", onApply);
      confirmCancel.forEach((button) => button.removeEventListener("click", onCancel));
      document.removeEventListener("keydown", onKeyDown);

      resolve(result);
    };

    const onApply = () => finish(true);
    const onCancel = () => finish(false);
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        finish(false);
      }
    };

    confirmApply.addEventListener("click", onApply);
    confirmCancel.forEach((button) => button.addEventListener("click", onCancel));
    document.addEventListener("keydown", onKeyDown);
  });
}
