export async function loadPartials() {
  const partialTargets = document.querySelectorAll("[data-partial]");

  const jobs = Array.from(partialTargets).map(async (target) => {
    const filePath = target.dataset.partial;

    try {
      const response = await fetch(filePath);

      if (!response.ok) {
        throw new Error(`Could not load ${filePath}`);
      }

      target.innerHTML = await response.text();
    } catch (error) {
      console.error(error);
      target.innerHTML = `
        <div class="partial-error">
          Could not load partial: ${filePath}
        </div>
      `;
    }
  });

  await Promise.all(jobs);
}