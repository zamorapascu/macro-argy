// ---------- Pestaña: Reservas y tasas ----------
function renderReservas(o) {
  document.getElementById("tb-tasas").innerHTML =
    `<thead><tr><th>Tasa</th><th class="n">TNA</th><th class="n">TEA</th><th class="n">Real</th></tr></thead><tbody>` +
    o.tasas.map(x => `<tr><td>${x.n}${x.t ? `<span class="sub">${fdate(x.t)}</span>` : ""}</td><td class="n">${pct(x.tna, 2)}</td><td class="n">${pct(x.tea)}</td><td class="n ${cls(x.real)}">${signed(x.real, 1, "%")}</td></tr>`).join("") + `</tbody>`;
}

function drawReservas(o) {
  const op = baseOpts({ yt: v => fmt(v / 1000, 0) + " mil M", tip: { title: dateTitle, label: c => ` US$ ${fmt(c.parsed.y, 0)} M` } });
  op.plugins.legend.display = false;
  addChart("reservas", "ch-res", { type: "line", data: { datasets: [
    line("Reservas", o.S.reservas.map(p => ({ x: p.t, y: p.v })), palette().s1, { fill: "origin", backgroundColor: css("--band") }),
  ] }, options: op });
}

TABS.push({
  id: "reservas", label: "Reservas y tasas",
  html: `<div class="head"><h2>Reservas y tasas</h2></div>
  <div class="grid">
    <div class="card c7">
      <h3>Reservas internacionales brutas</h3>
      <div class="chart"><canvas id="ch-res" aria-label="Reservas internacionales"></canvas></div>
      <p class="src">Fuente: BCRA serie 1 · millones de USD</p>
    </div>
    <div class="card c5">
      <h3>Tasas en pesos</h3>
      <div class="tbl"><table id="tb-tasas" class="tight"></table></div>
      <p class="src">Fuente: BCRA series 7, 12, 44. TEA calculada con capitalización a 30 días.</p>
    </div>
  </div>`,
  render: renderReservas, draw: drawReservas,
});
