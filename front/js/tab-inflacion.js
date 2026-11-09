// ---------- Pestaña: Inflación esperada ----------
function renderInflacion(o) {
  document.getElementById("tb-be").innerHTML =
    `<thead><tr><th>Letra</th><th class="n">TEA fija</th><th class="n">TIR real</th><th class="n">Breakeven</th><th class="n">Mensual</th></tr></thead><tbody>` +
    o.be.map(x => `<tr><td>${x.t}${x.ext ? '<span class="tag">extrap.</span>' : ""}<span class="sub">${fdate(x.vtoT)} · ${x.days} días</span></td><td class="n">${pct(x.tea)}</td><td class="n">${pct(x.real, 2)}</td><td class="n"><b>${pct(x.be)}</b></td><td class="n">${pct(x.beM, 2)}</td></tr>`).join("") +
    (o.be.length ? "" : `<tr><td colspan="5">Sin datos de letras.</td></tr>`) + `</tbody>`;
  document.getElementById("tb-cer").innerHTML =
    `<thead><tr><th>Bono</th><th>Vto.</th><th class="n">Días</th><th class="n">CER base</th><th class="n">Valor técnico</th><th class="n">Precio</th><th class="n">Var. día</th><th class="n">TIR real</th></tr></thead><tbody>` +
    o.cer.map(b => `<tr><td>${b.t}</td><td>${fdate(b.vtoT)}</td><td class="n">${b.days}</td><td class="n">${fmt(b.base, 4)}</td><td class="n">${fmt(b.vt, 2)}</td><td class="n">${fmt(b.precio, 2)}</td><td class="n ${cls(b.chg)}">${signed(b.chg, 2, "%")}</td><td class="n"><b>${pct(b.tir, 2)}</b></td></tr>`).join("") + `</tbody>`;
}

function drawInflacion(o) {
  const { s1, s2, s3, s4 } = palette(), id = "inflacion";
  const dot = { pointRadius: 4, pointBorderColor: css("--surface"), pointBorderWidth: 2 };

  const be = o.be.filter(x => x.be != null);
  if (be.length) {
    const x0 = be[0].vtoT, x1 = last(be).vtoT;
    const ds = [line("Implícita de mercado", be.map(x => ({ x: x.vtoT, y: x.be })), s1, { ...dot, pointHoverRadius: 6 })];
    if (o.rem) ds.push(ref("REM 12 meses", o.rem.v, x0, x1, s2));
    if (o.infAnualizada != null) ds.push(ref("Actual anualizada", o.infAnualizada, x0, x1, s4));
    addChart(id, "ch-be", { type: "line", data: { datasets: ds },
      options: baseOpts({ yt: v => fmt(v, 0) + "%", tip: { title: items => items.length ? "Vto. " + fdate(items[0].parsed.x) : "", label: c => ` ${c.dataset.label}: ${pct(c.parsed.y)}` } }) });
  }

  addChart(id, "ch-curvas", { type: "line", data: { datasets: [
    line("Tasa fija · TEA nominal", o.fija.map(x => ({ x: x.vtoT, y: x.tea, t: x.t })), s1, dot),
    line("CER · TIR real", o.cer.filter(b => b.tir != null).map(b => ({ x: b.vtoT, y: b.tir, t: b.t })), s3, dot),
  ] }, options: baseOpts({ yt: v => fmt(v, 0) + "%", tip: { title: dateTitle, label: c => ` ${c.raw.t}: ${pct(c.parsed.y, 2)}` } }) });

  const from = Date.UTC(2021, 0, 1);
  const remSh = o.S.rem.map(p => { const d = new Date(p.t); return { x: Date.UTC(d.getUTCFullYear() + 1, d.getUTCMonth() + 1, 0), y: p.v }; }).filter(p => p.x >= from);
  addChart(id, "ch-rem", { type: "line", data: { datasets: [
    line("Inflación interanual efectiva", o.S.infA.filter(p => p.t >= from).map(p => ({ x: p.t, y: p.v })), s1),
    line("Esperada por el REM 12 meses antes", remSh, s2, { borderDash: [5, 3] }),
  ] }, options: baseOpts({ yt: v => fmt(v, 0) + "%", y: { type: "logarithmic", ticks: { color: css("--ink-2"), callback: v => [10, 20, 30, 50, 100, 200, 300].includes(v) ? v + "%" : "" } },
    tip: { title: items => items.length ? fmon(items[0].parsed.x) : "", label: c => ` ${c.dataset.label}: ${pct(c.parsed.y)}` } }) });
}

TABS.push({
  id: "inflacion", label: "Inflación esperada",
  html: `<div class="head"><h2>Inflación esperada</h2>
    <p>Tres lecturas: la encuesta REM del BCRA, la inflación que descuentan los bonos (tasa fija contra CER) y la inflación actual anualizada.</p></div>
  <div class="grid">
    <div class="card c7">
      <h3>Inflación implícita por plazo</h3>
      <p class="cap">Breakeven anual = (1 + TEA LECAP/BONCAP) / (1 + TIR real CER interpolada) − 1, para cada vencimiento de tasa fija.</p>
      <div class="chart"><canvas id="ch-be" aria-label="Inflación implícita por vencimiento"></canvas></div>
      <p class="src">Fuentes: ArgentinaDatos (LECAP/BONCAP), data912 (Boncer), BCRA serie 30 (CER), 29 (REM), 27 (inflación mensual)</p>
    </div>
    <div class="card c5">
      <h3>Detalle por vencimiento</h3>
      <div class="tbl"><table id="tb-be" class="tight"></table></div>
      <p class="src">TIR real con CER de 10 días hábiles antes de la liquidación (T+1).</p>
    </div>
    <div class="card c6">
      <h3>Curvas: tasa fija y CER</h3>
      <p class="cap">Rendimiento efectivo anual de LECAP/BONCAP (nominal) y TIR real de los Boncer cero cupón.</p>
      <div class="chart"><canvas id="ch-curvas" aria-label="Curvas de tasa fija y CER"></canvas></div>
      <p class="src">Fuentes: ArgentinaDatos, data912, BCRA serie 30</p>
    </div>
    <div class="card c6">
      <h3>¿Acierta la encuesta REM?</h3>
      <p class="cap">Inflación interanual efectiva contra lo que esperaba el REM 12 meses antes (la expectativa se corre un año hacia adelante).</p>
      <div class="chart"><canvas id="ch-rem" aria-label="REM contra inflación efectiva"></canvas></div>
      <p class="src">Fuente: BCRA series 28 y 29</p>
    </div>
    <div class="card c12">
      <h3>Boncer cero cupón</h3>
      <div class="tbl"><table id="tb-cer"></table></div>
      <p class="src">Pago al vencimiento = 100 × CER(vto − 10 hábiles) / CER base. Valor técnico = 100 × CER(liq. − 10 hábiles) / CER base.</p>
    </div>
  </div>`,
  render: renderInflacion, draw: drawInflacion,
});
