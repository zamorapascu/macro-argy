// ---------- Pestaña: Riesgo país y bonos en dólares ----------
function renderMercados(o) {
  const rows = [["Riesgo país", o.S.riesgo, v => fmt(v, 0) + " pb", "riesgo", false], ["GD30", o.S.gd30, v => "US$ " + fmt(v, 2), "gd30", true], ["GD35", o.S.gd35, v => "US$ " + fmt(v, 2), "gd35", true]];
  document.getElementById("tb-merc").innerHTML = `<thead><tr><th>Indicador</th><th class="n">Cierre</th><th class="n">7 días</th><th class="n">30 días</th><th class="n">Mín. 12 m</th><th class="n">Máx. 12 m</th></tr></thead><tbody>` +
    rows.map(([n, s, f, key, goodUp]) => {
      const p = last(s); if (!p) return `<tr><td>${n}</td><td colspan="5">Sin datos</td></tr>`;
      const w = at(s, p.t - 7 * DAY), m = at(s, p.t - 30 * DAY), y = since(s, p.t - 365 * DAY).map(q => q.v);
      const ch = q => q ? (goodUp ? signed((p.v / q.v - 1) * 100, 1, "%") : signed(p.v - q.v, 0, " pb")) : "—";
      const c = q => q ? cls(p.v - q.v, goodUp) : "";
      return `<tr><td>${n}<span class="sub">${fdate(p.t)}${origin(key)}</span></td><td class="n"><b>${f(p.v)}</b></td><td class="n ${c(w)}">${ch(w)}</td><td class="n ${c(m)}">${ch(m)}</td><td class="n">${f(Math.min(...y))}</td><td class="n">${f(Math.max(...y))}</td></tr>`;
    }).join("") + `</tbody>`;
}

function drawMercados(o) {
  const { s1, s2, s3 } = palette(), d0 = today - 540 * DAY;
  const op = baseOpts({ yt: v => axisNum(v), tip: { title: dateTitle, label: c => ` Riesgo país: ${fmt(c.parsed.y, 0)} pb` } });
  op.plugins.legend.display = false; op.scales.y.beginAtZero = false;
  addChart("mercados", "ch-riesgo", { type: "line", data: { datasets: [line("Riesgo país", xy(since(o.S.riesgo, d0)), s2, { fill: "origin", backgroundColor: css("--band") })] }, options: op });

  addChart("mercados", "ch-bonos", { type: "line", data: { datasets: [
    line("GD30", xy(since(o.S.gd30, d0)), s1),
    line("GD35", xy(since(o.S.gd35, d0)), s3),
  ] }, options: baseOpts({ yt: v => "US$ " + fmt(v, 0), tip: { title: dateTitle, label: c => ` ${c.dataset.label}: US$ ${fmt(c.parsed.y, 2)}` } }) });
}

TABS.push({
  id: "mercados", label: "Riesgo país y bonos",
  html: `<div class="head"><h2>Riesgo país y bonos en dólares</h2>
    <p>El riesgo país mide cuánto interés extra le piden a la Argentina frente a Estados Unidos (100 pb = 1% anual). Cuando sube, el precio de los bonos Globales baja.</p></div>
  <div class="grid">
    <div class="card c7">
      <h3>Riesgo país</h3>
      <div class="chart"><canvas id="ch-riesgo" aria-label="Riesgo país"></canvas></div>
      <p class="src">Fuente: EMBI de JP Morgan vía ArgentinaDatos · puntos básicos</p>
    </div>
    <div class="card c5">
      <h3>Resumen</h3>
      <div class="tbl"><table id="tb-merc" class="tight"></table></div>
      <p class="src">Bonos: precio en dólares cada US$100 de valor original, ley extranjera.</p>
    </div>
    <div class="card c12">
      <h3>Bonos Globales GD30 y GD35</h3>
      <div class="chart"><canvas id="ch-bonos" aria-label="Precios de GD30 y GD35"></canvas></div>
      <p class="src">Fuente: data912 (cierres diarios de GD30D y GD35D)</p>
    </div>
  </div>`,
  render: renderMercados, draw: drawMercados,
});
