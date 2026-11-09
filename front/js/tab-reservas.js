// ---------- Pestaña: Reservas, compras y tasas ----------
function renderReservas(o) {
  document.getElementById("tb-tasas").innerHTML =
    `<thead><tr><th>Tasa</th><th class="n">TNA</th><th class="n">TEA</th><th class="n">Real</th></tr></thead><tbody>` +
    o.tasas.map(x => `<tr><td>${x.n}${x.t ? `<span class="sub">${fdate(x.t)}</span>` : ""}</td><td class="n">${pct(x.tna, 2)}</td><td class="n">${pct(x.tea)}</td><td class="n ${cls(x.real)}">${signed(x.real, 1, "%")}</td></tr>`).join("") + `</tbody>`;
  const cp = o.compras;
  document.getElementById("tb-compras").innerHTML = cp ?
    `<tbody><tr><td>Semana del ${fdate(cp.lunes)}<span class="sub">${cp.dias} días informados</span></td><td class="n">US$ ${fmt(cp.semana, 0)} M</td></tr>` +
    `<tr><td>En el mes</td><td class="n">US$ ${fmt(cp.mes, 0)} M</td></tr>` +
    `<tr><td>En el año</td><td class="n">US$ ${fmt(cp.anio, 0)} M</td></tr></tbody>` : `<tbody><tr><td>Sin datos.</td></tr></tbody>`;
  document.getElementById("src-compras").textContent = `Fuente: BCRA serie 78 · último dato ${cp ? fdate(cp.t) : "—"}${origin("compras")}`;
}

function drawReservas(o) {
  const { s1, s2 } = palette();
  const op = baseOpts({ yt: v => fmt(v / 1000, 0) + " mil M", tip: { title: dateTitle, label: c => ` US$ ${fmt(c.parsed.y, 0)} M` } });
  op.plugins.legend.display = false;
  addChart("reservas", "ch-res", { type: "line", data: { datasets: [
    line("Reservas", xy(o.S.reservas), s1, { fill: "origin", backgroundColor: css("--band") }),
  ] }, options: op });

  const cm = xy(since(o.comprasMes, today - 400 * DAY));
  const opC = baseOpts({ yt: v => axisNum(v), tip: monTip(v => `US$ ${fmt(v, 0)} M`) });
  opC.plugins.legend.display = false;
  addChart("reservas", "ch-compras", { type: "bar", data: { datasets: [bar("Compras netas", cm, signColors(cm))] }, options: opC });

  const opB = baseOpts({ yt: v => fmt(v / 1e6, 0) + " bill.", tip: { title: dateTitle, label: c => ` $ ${fmt(c.parsed.y / 1e6, 2)} billones` } });
  opB.plugins.legend.display = false; opB.scales.y.beginAtZero = false;
  addChart("reservas", "ch-base", { type: "line", data: { datasets: [line("Base monetaria", xy(o.S.base), s2)] }, options: opB });
}

TABS.push({
  id: "reservas", label: "Reservas y tasas",
  html: `<div class="head"><h2>Reservas, compras y tasas</h2>
    <p>Cuántos dólares tiene el BCRA, cuántos compra en el mercado, cuántos pesos hay en la economía y qué rinden.</p></div>
  <div class="grid">
    <div class="card c7">
      <h3>Reservas internacionales brutas</h3>
      <div class="chart"><canvas id="ch-res" aria-label="Reservas internacionales"></canvas></div>
      <p class="src">Fuente: BCRA serie 1 · millones de USD. Los fines de mes suelen bajar por movimientos transitorios de los bancos.</p>
    </div>
    <div class="card c5">
      <h3>Tasas en pesos</h3>
      <div class="tbl"><table id="tb-tasas" class="tight"></table></div>
      <p class="src">Fuente: BCRA series 7, 12, 44. TEA calculada con capitalización a 30 días. Real: contra la inflación esperada del REM.</p>
    </div>
    <div class="card c8">
      <h3>Compras de divisas del BCRA, por mes</h3>
      <div class="chart"><canvas id="ch-compras" aria-label="Compras de divisas del BCRA por mes"></canvas></div>
      <p class="src">Fuente: BCRA serie 78 · millones de USD</p>
    </div>
    <div class="card c4">
      <h3>Compras acumuladas</h3>
      <div class="tbl"><table id="tb-compras" class="tight"></table></div>
      <p class="src" id="src-compras">Fuente: BCRA serie 78</p>
    </div>
    <div class="card c12">
      <h3>Base monetaria</h3>
      <div class="chart short"><canvas id="ch-base" aria-label="Base monetaria"></canvas></div>
      <p class="src">Fuente: BCRA serie 15 · billones de pesos</p>
    </div>
  </div>`,
  render: renderReservas, draw: drawReservas,
});
