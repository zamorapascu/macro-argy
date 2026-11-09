// ---------- Pestaña: Dólar ----------
function drawDolar(o) {
  const { s1, s2, s4 } = palette();
  const d0 = Date.UTC(2025, 3, 14), xy = s => s.filter(p => p.t >= d0).map(p => ({ x: p.t, y: p.v }));
  addChart("dolar", "ch-dolar", { type: "line", data: { datasets: [
    line("Techo de la banda", xy(o.S.bandaSup), s4, { borderWidth: 1, borderDash: [4, 3] }),
    line("Piso de la banda", xy(o.S.bandaInf), s4, { borderWidth: 1, borderDash: [4, 3], fill: "-1", backgroundColor: css("--band") }),
    line("Mayorista", xy(o.S.mayorista), s1),
    line("MEP", xy(o.mep), s2),
  ] }, options: baseOpts({ yt: v => "$" + fmt(v, 0), tip: { title: dateTitle, label: c => ` ${c.dataset.label}: $${fmt(c.parsed.y, 2)}` } }) });
}

TABS.push({
  id: "dolar", label: "Dólar",
  html: `<div class="head"><h2>Dólar</h2>
    <p>Tipo de cambio mayorista dentro del régimen de bandas, junto con el dólar MEP.</p></div>
  <div class="grid">
    <div class="card c12">
      <h3>Mayorista, MEP y bandas cambiarias</h3>
      <div class="chart tall"><canvas id="ch-dolar" aria-label="Dólar mayorista, MEP y bandas"></canvas></div>
      <p class="src">Fuentes: BCRA series 5, 1187 y 1188; ArgentinaDatos (dólar bolsa)</p>
    </div>
  </div>`,
  draw: drawDolar,
});
