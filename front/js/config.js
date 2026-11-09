"use strict";
// ---------- Configuración (viene de config/sources.json, inyectada por el build) ----------
const CFG = JSON.parse(document.getElementById("config").textContent);
const SOURCES = CFG.sources;
const BONCER = CFG.boncer;
const DAY = 86400000;
const iso = d => new Date(d).toISOString().slice(0, 10);
const today = Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
const back = days => iso(today - days * DAY);
const desde = s => (s.desde && s.desde.length === 10) ? s.desde : back(s.days || 365);

// URL por tipo de fuente (espejo de url() en back/fetch.py). Solo se usan las fuentes live.
const ddmmyyyy = d => d.slice(8, 10) + "/" + d.slice(5, 7) + "/" + d.slice(0, 4);
const URL_BY_KIND = {
  bcra: s => `https://api.bcra.gob.ar/estadisticas/v4.0/monetarias/${s.id}?desde=${desde(s)}&hasta=${iso(today + 30 * DAY)}&limit=3000`,
  argdatos: s => `https://api.argentinadatos.com/v1/${s.path}`,
  json: s => s.url,
  d912_hist: s => `https://data912.com/historical/bonds/${s.ticker}`,
  datosgob: s => "https://apis.datos.gob.ar/series/api/series/?" + new URLSearchParams({ ids: Object.values(s.series).join(","), start_date: s.desde, limit: 1000, format: "json" }),
  bcb_sgs: s => `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${s.id}/dados?formato=json&dataInicial=${ddmmyyyy(desde(s))}&dataFinal=${ddmmyyyy(iso(today + 90 * DAY))}`,
  eurostat: s => `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/${s.dataset}?` + new URLSearchParams({ ...s.params, sinceTimePeriod: s.desde }),
};
const LIVE = SOURCES.filter(s => s.live);
