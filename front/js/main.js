// ---------- Arranque ----------
let STATE = null;
function renderStatus(res) {
  const el = document.getElementById("status"), tx = document.getElementById("status-txt");
  const total = Object.keys(URLS).length;
  if (res.live.length === total) { el.dataset.mode = "live"; tx.textContent = "En vivo · " + new Date().toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }); }
  else if (!res.live.length && res.snap.length) { el.dataset.mode = "snap"; tx.textContent = "Foto del " + (SNAP.fecha || "—"); }
  else if (res.live.length) { el.dataset.mode = "mix"; tx.textContent = `En vivo ${res.live.length}/${total} fuentes · resto de la foto del ${SNAP ? SNAP.fecha : "—"}`; }
  else { el.dataset.mode = "err"; tx.textContent = "No se pudieron cargar los datos"; }
}
(async function main() {
  mountTabs();
  const res = await loadAll();
  STATE = compute(res.raw);
  renderStatus(res);
  TABS.forEach(t => t.render && t.render(STATE, res));
  showTab();
  try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", redrawDrawn); } catch {}
  new MutationObserver(redrawDrawn).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
})();
