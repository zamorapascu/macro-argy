// ---------- Series: helpers ----------
const ts = f => Date.parse(String(f).slice(0, 10) + "T00:00:00Z");
const bySort = s => s.filter(p => isFinite(p.t) && p.v != null && isFinite(p.v)).sort((a, b) => a.t - b.t);
const last = s => s && s.length ? s[s.length - 1] : null;
function at(s, t) { let r = null; for (const p of s || []) { if (p.t <= t) r = p; else break; } return r; }
const since = (s, t0) => (s || []).filter(p => p.t >= t0);
const xy = s => (s || []).map(p => ({ x: p.t, y: p.v }));
// Variación contra el mismo mes/punto de hace un año (series mensuales)
function yoy(s) { return (s || []).map(p => { const d = new Date(p.t), q = at(s, Date.UTC(d.getUTCFullYear() - 1, d.getUTCMonth(), d.getUTCDate())); return q && new Date(q.t).getUTCMonth() === d.getUTCMonth() ? { t: p.t, v: (p.v / q.v - 1) * 100 } : null; }).filter(Boolean); }
// Diferencia contra el punto anterior
const diff = s => (s || []).slice(1).map((p, i) => ({ t: p.t, v: p.v - s[i].v }));
function isBiz(t) { const w = new Date(t).getUTCDay(); return w !== 0 && w !== 6; }
function addBiz(t, n) { const step = n < 0 ? -1 : 1; let k = Math.abs(n); while (k > 0) { t += step * DAY; if (isBiz(t)) k--; } return t; }

// ---------- Parseo por tipo de fuente: cada uno devuelve { nombre: [{t, v}] } ----------
// Fuentes live: reciben la respuesta cruda de la API (en vivo o desde la foto, es el mismo formato).
// Fuentes no live (fred, boe): la foto ya trae pares ["AAAA-MM-DD", valor].
const pairs = (s, d) => ({ [s.key]: bySort((Array.isArray(d) ? d : []).map(([f, v]) => ({ t: ts(f), v: +v }))) });
const PARSE = {
  bcra: (s, j) => ({ [s.key]: j && j.results && j.results[0] ? bySort(j.results[0].detalle.map(p => ({ t: ts(p.fecha), v: +p.valor }))) : [] }),
  argdatos: (s, d) => ({ [s.key]: bySort((Array.isArray(d) ? d : []).map(x => ({ t: ts(x.fecha), v: +x[s.field] })).filter(p => p.v > 0)) }),
  d912_hist: (s, d) => ({ [s.key]: bySort((Array.isArray(d) ? d : []).map(x => ({ t: ts(x.date), v: +x.c }))) }),
  datosgob: (s, j) => {
    const out = {}, names = Object.keys(s.series), rows = j && Array.isArray(j.data) ? j.data : [];
    names.forEach((n, i) => { out[n] = bySort(rows.map(r => ({ t: ts(r[0]), v: r[i + 1] == null ? null : +r[i + 1] }))); });
    return out;
  },
  bcb_sgs: (s, d) => ({ [s.key]: bySort((Array.isArray(d) ? d : []).map(x => ({ t: ts(x.data.split("/").reverse().join("-")), v: +x.valor }))) }),
  eurostat: (s, j) => {
    if (!j || !j.dimension) return { [s.key]: [] };
    const idx = j.dimension.time.category.index, inv = Object.fromEntries(Object.entries(idx).map(([k, i]) => [i, k]));
    return { [s.key]: bySort(Object.entries(j.value || {}).map(([i, v]) => ({ t: ts(inv[i] + "-01"), v: +v }))) };
  },
  fred: pairs, boe: pairs,
  json: () => ({}),   // letras y bonos se leen crudos en calc.js
};
function parseAll(raw) {
  const S = {};
  for (const s of SOURCES) Object.assign(S, PARSE[s.kind](s, raw[s.key]));
  return S;
}

// ---------- Formato ----------
const nf = (d = 1) => new Intl.NumberFormat("es-AR", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmt = (v, d = 1) => v == null || !isFinite(v) ? "—" : nf(d).format(v);
const pct = (v, d = 1) => v == null || !isFinite(v) ? "—" : nf(d).format(v) + "%";
const fdate = t => new Date(t).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
const fmon = t => new Date(t).toLocaleDateString("es-AR", { month: "short", year: "2-digit", timeZone: "UTC" }).replace(".", "");
const fquarter = t => { const d = new Date(t); return `T${Math.floor(d.getUTCMonth() / 3) + 1} ${d.getUTCFullYear()}`; };
const signed = (v, d = 1, suf = "") => v == null || !isFinite(v) ? "—" : (v > 0 ? "+" : "") + nf(d).format(v) + suf;
const cls = (v, goodUp = true) => v == null || v === 0 ? "" : ((v > 0) === goodUp ? "up" : "down");
// Origen del dato para las notas de fuente: "en vivo" o "foto del dd/mm/aaaa"
const origin = key => STATE && STATE.res.live.includes(key) ? "" : (SNAP ? ` · foto del ${SNAP.fecha}` : "");
const empty = msg => `<p class="empty">${msg}</p>`;
