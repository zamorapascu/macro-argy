// ---------- Pestaña: Actividad y comercio exterior (INDEC vía datos.gob.ar) ----------
// datos.gob.ar publica con uno o dos meses de rezago respecto del INDEC: cada dato muestra su período.
function ytd(s) {   // acumulado del año del último dato vs. mismos meses del año anterior
  const p = last(s); if (!p) return null;
  const d = new Date(p.t), y = d.getUTCFullYear(), m = d.getUTCMonth();
  const sum = yr => (s || []).filter(q => { const e = new Date(q.t); return e.getUTCFullYear() === yr && e.getUTCMonth() <= m; }).reduce((a, q) => a + q.v, 0);
  return { t: p.t, now: sum(y), prev: sum(y - 1) };
}

function renderActividad(o) {
  const S = o.S;
  const act = [["EMAE (actividad económica)", S.emae, S.emaeSe], ["Industria (IPI manufacturero)", S.ipi, S.ipiSe], ["Construcción (ISAC)", S.isac, S.isacSe]].map(([n, orig, se]) => {
    const p = last(orig), ia = last(yoy(orig)), sp = last(se), sp1 = se && se.length > 1 ? se[se.length - 2] : null;
    const acc = ytd(orig), accV = acc && acc.prev ? (acc.now / acc.prev - 1) * 100 : null;
    return `<tr><td>${n}<span class="sub">${p ? fmon(p.t) : "sin datos"}</span></td><td class="n ${cls(ia && ia.v)}">${signed(ia && ia.v, 1, "%")}</td>` +
      `<td class="n ${cls(sp && sp1 ? sp.v - sp1.v : null)}">${sp && sp1 ? signed((sp.v / sp1.v - 1) * 100, 1, "%") : "—"}</td><td class="n ${cls(accV)}">${signed(accV, 1, "%")}</td></tr>`;
  });
  document.getElementById("tb-act").innerHTML = `<thead><tr><th>Indicador</th><th class="n">Interanual</th><th class="n">Vs. mes ant.</th><th class="n">Acum. año</th></tr></thead><tbody>${act.join("")}</tbody>`;

  const com = [["Exportaciones", S.expo], ["Importaciones", S.impo], ["Saldo comercial", S.saldo]].map(([n, s]) => {
    const p = last(s), a = ytd(s);
    return `<tr><td>${n}<span class="sub">${p ? fmon(p.t) : "sin datos"}</span></td><td class="n">${p ? fmt(p.v, 0) : "—"}</td><td class="n">${a ? fmt(a.now, 0) : "—"}</td><td class="n">${a ? fmt(a.prev, 0) : "—"}</td></tr>`;
  });
  const a = ytd(S.expo);
  document.getElementById("tb-com").innerHTML = `<thead><tr><th>US$ millones</th><th class="n">Mes</th><th class="n">Acum. ${a ? new Date(a.t).getUTCFullYear() : ""}</th><th class="n">Mismo período ${a ? new Date(a.t).getUTCFullYear() - 1 : ""}</th></tr></thead><tbody>${com.join("")}</tbody>`;
}

function drawActividad(o) {
  const { s1, s2, s3, s4 } = palette(), S = o.S, d0 = Date.UTC(2023, 0, 1);
  const idx = (id, a, b, la, lb) => addChart("actividad", id, { type: "line", data: { datasets: [
    line(la, xy(since(a, d0)), s1),
    line(lb, xy(since(b, d0)), s2, { borderDash: [5, 3] }),
  ] }, options: (() => { const op = baseOpts({ yt: v => axisNum(v), tip: monTip(v => fmt(v, 1)) }); op.scales.y.beginAtZero = false; return op; })() });
  idx("ch-emae", S.emaeSe, S.emaeTc, "Desestacionalizado", "Tendencia-ciclo");
  idx("ch-ipi", S.ipiSe, S.ipiTc, "Desestacionalizado", "Tendencia-ciclo");
  idx("ch-isac", S.isacSe, S.isac, "Desestacionalizado", "Serie original");

  const d2 = today - 760 * DAY;
  addChart("actividad", "ch-com", { type: "bar", data: { datasets: [
    bar("Exportaciones", xy(since(S.expo, d2)), s1),
    bar("Importaciones", xy(since(S.impo, d2)), s4),
    line("Saldo", xy(since(S.saldo, d2)), s3, { type: "line", pointRadius: 2 }),
  ] }, options: baseOpts({ yt: v => axisNum(v), tip: monTip(v => `US$ ${fmt(v, 0)} M`) }) });

  const opT = baseOpts({ yt: v => axisNum(v), xt: v => fquarter(v), tip: { title: items => items.length ? fquarter(items[0].parsed.x) : "", label: c => ` Índice: ${fmt(c.parsed.y, 1)}` } });
  opT.plugins.legend.display = false; opT.scales.y.beginAtZero = false;
  addChart("actividad", "ch-tdi", { type: "line", data: { datasets: [line("Términos del intercambio", xy(S.tdi), s2, { pointRadius: 2 })] }, options: opT });
}

TABS.push({
  id: "actividad", label: "Actividad",
  html: `<div class="head"><h2>Actividad y comercio exterior</h2>
    <p>Cómo viene la economía real según el INDEC: actividad general, industria, construcción y comercio con el mundo. La tendencia-ciclo saca los saltos de un mes puntual.</p></div>
  <div class="grid">
    <div class="card c6">
      <h3>Último dato</h3>
      <div class="tbl"><table id="tb-act" class="tight"></table></div>
      <p class="src">Interanual y acumulado sobre la serie original; vs. mes anterior sobre la desestacionalizada.</p>
    </div>
    <div class="card c6">
      <h3>Comercio exterior</h3>
      <div class="tbl"><table id="tb-com" class="tight"></table></div>
      <p class="src">Fuente: INDEC, intercambio comercial argentino, vía datos.gob.ar</p>
    </div>
    <div class="card c4">
      <h3>Actividad (EMAE)</h3>
      <div class="chart short"><canvas id="ch-emae" aria-label="EMAE"></canvas></div>
      <p class="src">INDEC · índice base 2004</p>
    </div>
    <div class="card c4">
      <h3>Industria (IPI)</h3>
      <div class="chart short"><canvas id="ch-ipi" aria-label="Índice de producción industrial"></canvas></div>
      <p class="src">INDEC · índice base 2016</p>
    </div>
    <div class="card c4">
      <h3>Construcción (ISAC)</h3>
      <div class="chart short"><canvas id="ch-isac" aria-label="Indicador de la construcción"></canvas></div>
      <p class="src">INDEC · índice base 2004</p>
    </div>
    <div class="card c8">
      <h3>Exportaciones, importaciones y saldo</h3>
      <div class="chart"><canvas id="ch-com" aria-label="Exportaciones, importaciones y saldo comercial"></canvas></div>
      <p class="src">Fuente: INDEC vía datos.gob.ar · millones de USD por mes</p>
    </div>
    <div class="card c4">
      <h3>Términos del intercambio</h3>
      <p class="cap">Precios de lo que vendemos contra lo que compramos. Si sube, con lo exportado se compra más.</p>
      <div class="chart short"><canvas id="ch-tdi" aria-label="Términos del intercambio"></canvas></div>
      <p class="src">INDEC · trimestral, base 2004</p>
    </div>
  </div>`,
  render: renderActividad, draw: drawActividad,
});
