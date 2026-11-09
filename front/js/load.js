// ---------- Carga: foto embebida al instante, después lo que llegue en vivo ----------
const SNAP = (() => { try { return JSON.parse(document.getElementById("snapshot").textContent); } catch { return null; } })();
const snapData = k => SNAP && SNAP.data ? SNAP.data[k] : undefined;

async function getJSON(url) {
  const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 20000);
  try { const r = await fetch(url, { signal: ctl.signal }); if (!r.ok) throw new Error(r.status); return await r.json(); }
  finally { clearTimeout(tm); }
}

// Solo la foto: para pintar algo apenas abre la página.
function loadSnapshot() {
  const raw = {}, snap = [], missing = [];
  for (const s of SOURCES) { const d = snapData(s.key); if (d != null) { raw[s.key] = d; snap.push(s.key); } else missing.push(s.key); }
  return { raw, live: [], snap, missing, partial: true };
}

// En vivo para las fuentes con CORS; el resto (y las que fallen) desde la foto.
async function loadAll() {
  const res = loadSnapshot(); res.partial = false;
  const snapSet = new Set(res.snap);
  await Promise.all(LIVE.map(async s => {
    try {
      res.raw[s.key] = await getJSON(URL_BY_KIND[s.kind](s));
      res.live.push(s.key); snapSet.delete(s.key);
      res.missing = res.missing.filter(k => k !== s.key);
    } catch { /* queda lo de la foto, si había */ }
  }));
  res.snap = [...snapSet];
  return res;
}
