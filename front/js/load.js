// ---------- Carga: en vivo, con la foto embebida como respaldo ----------
const SNAP = (() => { try { return JSON.parse(document.getElementById("snapshot").textContent); } catch { return null; } })();

async function getJSON(url) {
  const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 20000);
  try { const r = await fetch(url, { signal: ctl.signal }); if (!r.ok) throw new Error(r.status); return await r.json(); }
  finally { clearTimeout(tm); }
}
async function loadAll() {
  const raw = {}, live = [], snap = [], missing = [];
  await Promise.all(Object.entries(URLS).map(async ([k, url]) => {
    try { raw[k] = await getJSON(url); live.push(k); }
    catch { if (SNAP && SNAP.data && SNAP.data[k] != null) { raw[k] = SNAP.data[k]; snap.push(k); } else missing.push(k); }
  }));
  return { raw, live, snap, missing };
}

