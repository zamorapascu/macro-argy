// ---------- Parseo ----------
const ts = f => Date.parse(String(f).slice(0, 10) + "T00:00:00Z");
function bcraSeries(j) {
  if (!j || !j.results || !j.results[0]) return [];
  return j.results[0].detalle.map(p => ({ t: ts(p.fecha), v: +p.valor })).sort((a, b) => a.t - b.t);
}
const last = s => s.length ? s[s.length - 1] : null;
function at(s, t) { let r = null; for (const p of s) { if (p.t <= t) r = p; else break; } return r; }
function isBiz(t) { const w = new Date(t).getUTCDay(); return w !== 0 && w !== 6; }
function addBiz(t, n) { const step = n < 0 ? -1 : 1; let k = Math.abs(n); while (k > 0) { t += step * DAY; if (isBiz(t)) k--; } return t; }

// ---------- Formato ----------
const nf = (d = 1) => new Intl.NumberFormat("es-AR", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmt = (v, d = 1) => v == null || !isFinite(v) ? "—" : nf(d).format(v);
const pct = (v, d = 1) => v == null || !isFinite(v) ? "—" : nf(d).format(v) + "%";
const fdate = t => new Date(t).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
const fmon = t => new Date(t).toLocaleDateString("es-AR", { month: "short", year: "2-digit", timeZone: "UTC" }).replace(".", "");
const signed = (v, d = 1, suf = "") => v == null || !isFinite(v) ? "—" : (v > 0 ? "+" : "") + nf(d).format(v) + suf;
const cls = (v, goodUp = true) => v == null || v === 0 ? "" : ((v > 0) === goodUp ? "up" : "down");

