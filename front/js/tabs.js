// ---------- Registro y navegación de pestañas ----------
// Cada pestaña (tab-*.js) hace TABS.push({ id, label, html, render(o, res), draw(o) }).
//  - render: tablas/indicadores (se ejecuta al cargar los datos)
//  - draw:   gráficos; se ejecuta la primera vez que se muestra la pestaña (Chart.js no mide bien canvas ocultos)
const TABS = [];
const drawn = new Set();

function mountTabs() {
  const nav = document.getElementById("tabs"), panels = document.getElementById("panels");
  nav.innerHTML = TABS.map(t => `<button role="tab" id="tab-${t.id}" aria-controls="panel-${t.id}" aria-selected="false" tabindex="-1" data-tab="${t.id}">${t.label}</button>`).join("");
  panels.innerHTML = TABS.map(t => `<div role="tabpanel" id="panel-${t.id}" aria-labelledby="tab-${t.id}" hidden>${t.html}</div>`).join("");
  nav.addEventListener("click", e => { const b = e.target.closest("[data-tab]"); if (b) location.hash = b.dataset.tab; });
  nav.addEventListener("keydown", e => {
    const i = TABS.findIndex(t => t.id === currentTab());
    const j = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: TABS.length - 1 }[e.key];
    if (j == null) return;
    e.preventDefault(); const t = TABS[(j + TABS.length) % TABS.length];
    location.hash = t.id; document.getElementById("tab-" + t.id).focus();
  });
  window.addEventListener("hashchange", showTab);
}
function currentTab() { const h = location.hash.slice(1); return TABS.some(t => t.id === h) ? h : TABS[0].id; }

function showTab() {
  const id = currentTab();
  for (const t of TABS) {
    const on = t.id === id, b = document.getElementById("tab-" + t.id);
    b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1;
    document.getElementById("panel-" + t.id).hidden = !on;
  }
  document.getElementById("tab-" + id).scrollIntoView({ block: "nearest", inline: "nearest" });
  drawTab(id);
}
function drawTab(id) {
  const t = TABS.find(x => x.id === id);
  if (!STATE || !t || !t.draw || !window.Chart || drawn.has(id)) return;
  drawn.add(id); destroyCharts(id); t.draw(STATE);
}
// Cambio de tema: redibuja solo las pestañas que ya tienen gráficos
function redrawDrawn() { for (const id of [...drawn]) { drawn.delete(id); } drawTab(currentTab()); }
