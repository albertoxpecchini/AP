// Blocco/sblocco dello scroll del body (overlay, drawer, modali) preservando
// la posizione di scroll. Condiviso tra home, pagina Bio e i componenti chrome.

export function lockBodyScroll() {
  const scrollY = window.scrollY;
  document.body.dataset.scrollLockY = String(scrollY);
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = "100%";
  document.body.style.overflowY = "scroll";
}

export function unlockBodyScroll() {
  const scrollY = parseInt(document.body.dataset.scrollLockY || "0", 10);
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.width = "";
  document.body.style.overflowY = "";
  delete document.body.dataset.scrollLockY;
  // 'instant' bypassa lo scroll-behavior: smooth del CSS (incl. Bootstrap Italia)
  window.scrollTo({ top: scrollY, behavior: "instant" as ScrollBehavior });
}
