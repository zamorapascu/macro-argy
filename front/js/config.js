"use strict";
// ---------- Configuración (viene de config/sources.json, inyectada por el build) ----------
const CFG = JSON.parse(document.getElementById("config").textContent);
const BONCER = CFG.boncer;
const DAY = 86400000;
const iso = d => new Date(d).toISOString().slice(0, 10);
const today = Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
const back = days => iso(today - days * DAY);

const URLS = { ...CFG.urls };
for (const [k, s] of Object.entries(CFG.bcra)) {
  const desde = s.desde || back(s.days_back);
  URLS["bcra_" + k] = `${CFG.bcra_base}/${s.id}?desde=${desde}&hasta=${iso(today + 30 * DAY)}&limit=3000`;
}
