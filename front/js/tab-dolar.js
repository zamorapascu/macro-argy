// ---------- Pestaña: Dólar ----------
function drawDolar(o) {
  const { s1, s2, s3, s4 } = palette(), d0 = Date.UTC(2025, 3, 14), w = s => xy(since(s, d0));
  addChart("dolar", "ch-dolar", { type: "line", data: { datasets: [
    line("Techo de la banda", w(o.S.bandaSup), s4, { borderWidth: 1, borderDash: [4, 3] }),
    line("Piso de la banda", w(o.S.bandaInf), s4, { borderWidth: 1, borderDash: [4, 3], fill: "-1", backgroundColor: css("--band") }),
    line("Mayorista", w(o.S.mayorista), s1),
    line("MEP", w(o.mep), s2),
    line("CCL", w(o.S.ccl), s3),
  ] }, options: baseOpts({ yt: v => "$" + fmt(v, 0), tip: { title: dateTitle, label: c => ` ${c.dataset.label}: $${fmt(c.parsed.y, 2)}` } }) });

  addChart("dolar", "ch-brecha", { type: "line", data: { datasets: [
    line("Brecha MEP", w(o.brechaMep), s2),
    line("Brecha CCL", w(o.brechaCcl), s3),
  ] }, options: baseOpts({ yt: v => axisNum(v) + "%", tip: pctTip(1) }) });
}

function renderDolar(o) {
  const rows = [["Mayorista", o.S.mayorista, "BCRA 5"], ["MEP", o.S.mep, "ArgentinaDatos"], ["CCL", o.S.ccl, "ArgentinaDatos"]].map(([n, s, src]) => {
    const p = last(s), w = p && at(s, p.t - 7 * DAY), m = p && at(s, p.t - 30 * DAY), may = p && at(o.S.mayorista, p.t);
    return `<tr><td>${n}<span class="sub">${p ? fdate(p.t) : ""} · ${src}</span></td><td class="n">${p ? "$" + fmt(p.v, 2) : "—"}</td>` +
      `<td class="n">${w ? signed((p.v / w.v - 1) * 100, 1, "%") : "—"}</td><td class="n">${m ? signed((p.v / m.v - 1) * 100, 1, "%") : "—"}</td>` +
      `<td class="n">${n !== "Mayorista" && may ? signed((p.v / may.v - 1) * 100, 1, "%") : "—"}</td></tr>`;
  });
  document.getElementById("tb-dolar").innerHTML = `<thead><tr><th>Tipo</th><th class="n">Cierre</th><th class="n">7 días</th><th class="n">30 días</th><th class="n">Brecha</th></tr></thead><tbody>${rows.join("")}</tbody>`;
}

TABS.push({
  id: "dolar", label: "Dólar",
  html: `<div class="head"><h2>Dólar</h2>
    <p>Tipo de cambio mayorista dentro del régimen de bandas, junto con los dólares financieros: MEP (bonos en el país) y CCL (dólares que terminan afuera).</p></div>
  <div class="grid">
    <div class="card c12">
      <h3>Mayorista, MEP, CCL y bandas cambiarias</h3>
      <div class="chart tall"><canvas id="ch-dolar" aria-label="Dólar mayorista, MEP, CCL y bandas"></canvas></div>
      <p class="src">Fuentes: BCRA series 5, 1187 y 1188; ArgentinaDatos (dólar bolsa y contado con liquidación)</p>
    </div>
    <div class="card c7">
      <h3>Brecha con el mayorista</h3>
      <p class="cap">Cuánto más caro está cada dólar financiero que el oficial mayorista del mismo día.</p>
      <div class="chart"><canvas id="ch-brecha" aria-label="Brecha MEP y CCL"></canvas></div>
      <p class="src">Fuentes: BCRA serie 5; ArgentinaDatos</p>
    </div>
    <div class="card c5">
      <h3>Cotizaciones</h3>
      <div class="tbl"><table id="tb-dolar" class="tight"></table></div>
      <p class="src">Variaciones contra el último dato disponible 7 y 30 días antes.</p>
    </div>
  </div>`,
  render: renderDolar, draw: drawDolar,
});
