// ---------- Arranque ----------
let STATE = null;
function renderStatus(res) {
  const el = document.getElementById("status"), tx = document.getElementById("status-txt");
  const total = LIVE.length, n = res.live.length;
  if (res.partial) { el.dataset.mode = "load"; tx.textContent = `Actualizando… (mostrando foto del ${SNAP ? SNAP.fecha : "—"})`; }
  else if (n === total) { el.dataset.mode = "live"; tx.textContent = "En vivo · " + new Date().toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }); }
  else if (!n && res.snap.length) { el.dataset.mode = "snap"; tx.textContent = "Foto del " + (SNAP.fecha || "—"); }
  else if (n) { el.dataset.mode = "mix"; tx.textContent = `En vivo ${n}/${total} fuentes · resto de la foto del ${SNAP ? SNAP.fecha : "—"}`; }
  else { el.dataset.mode = "err"; tx.textContent = "No se pudieron cargar los datos"; }
}
function update(res) { STATE = compute(res); renderStatus(res); renderAll(); }

(async function main() {
  mountTabs();
  showTab();
  if (SNAP) update(loadSnapshot());          // pinta la foto al instante
  update(await loadAll());                    // y la reemplaza con lo que llegue en vivo
  try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", redrawDrawn); } catch {}
  new MutationObserver(redrawDrawn).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
})();
