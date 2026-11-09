// ---------- Pestaña: El mundo (tasas, inflación, bolsas, empleo y materias primas) ----------
// FRED y el Bank of England no permiten consultas desde el navegador (sin CORS): esos datos vienen de la foto.
function renderMundo(o) {
  const S = o.S;
  const rows = [
    ["Tasa de la Fed (techo)", S.fed, v => pct(v, 2), "fed", "FRED"],
    ["Tasa del BCE (depósitos)", S.ecb, v => pct(v, 2), "ecb", "FRED"],
    ["Tasa del Bank of England", S.boe, v => pct(v, 2), "boe", "Bank of England"],
    ["Selic (Brasil)", o.selic ? [o.selic] : [], v => pct(v, 2), "selic", "Banco Central do Brasil", S.selic],
    ["Bono del Tesoro EE.UU. 10 años", S.ust10, v => pct(v, 2), "ust10", "FRED"],
    ["Desempleo EE.UU.", S.unrate, v => pct(v, 1), "unrate", "FRED · mensual"],
    ["Empleos creados EE.UU. (mes)", o.payrollsChg, v => signed(v * 1000, 0), "payems", "FRED · mensual"],
    ["Inflación EE.UU. (interanual)", o.usCpiYoy, v => pct(v, 1), "uscpi", "FRED · mensual"],
    ["Inflación zona euro (interanual)", S.hicp, v => pct(v, 1), "hicp", "Eurostat · mensual"],
    ["Inflación Brasil (IPCA 12 m)", S.ipca, v => pct(v, 2), "ipca", "Banco Central do Brasil · mensual"],
    ["Petróleo Brent", S.brent, v => "US$ " + fmt(v, 2), "brent", "FRED"],
    ["Real por dólar (PTAX)", S.ptax, v => fmt(v, 4), "ptax", "Banco Central do Brasil"],
  ];
  const monthly = src => src.includes("mensual");
  document.getElementById("tb-mundo").innerHTML = `<thead><tr><th>Indicador</th><th class="n">Último</th><th class="n">Anterior</th></tr></thead><tbody>` +
    rows.map(([n, s, f, key, src, full]) => {
      const p = last(s), ser = full || s, prev = p && (monthly(src) ? ser[ser.length - 2] : at(ser, p.t - 7 * DAY));
      const when = p ? (monthly(src) ? fmon(p.t) : fdate(p.t)) : "";
      return `<tr><td>${n}<span class="sub">${p ? when + " · " : ""}${src}${p ? origin(key) : ""}</span></td><td class="n"><b>${p ? f(p.v) : "—"}</b></td>` +
        `<td class="n">${prev ? f(prev.v) : "—"}<span class="sub">${prev ? (monthly(src) ? "mes anterior" : "hace 1 semana") : ""}</span></td></tr>`;
    }).join("") + `</tbody>`;
}

function drawMundo(o) {
  const { s1, s2, s3, s4 } = palette(), S = o.S, d2 = today - 730 * DAY, d1 = today - 365 * DAY;
  const step = { stepped: "before" };
  addChart("mundo", "ch-tasas", { type: "line", data: { datasets: [
    line("Fed (techo)", xy(since(S.fed, d2)), s1, step),
    line("BCE (depósitos)", xy(since(S.ecb, d2)), s3, step),
    line("Bank of England", xy(since(S.boe, d2)), s4, step),
    line("EE.UU. 10 años", xy(since(S.ust10, d2)), s2, { borderWidth: 1.5 }),
  ] }, options: baseOpts({ yt: v => fmt(v, 1) + "%", tip: pctTip(2) }) });

  addChart("mundo", "ch-infl", { type: "line", data: { datasets: [
    line("EE.UU.", xy(since(o.usCpiYoy, d2)), s1),
    line("Zona euro", xy(since(S.hicp, d2)), s3),
    line("Brasil", xy(since(S.ipca, d2)), s2),
  ] }, options: baseOpts({ yt: v => axisNum(v) + "%", tip: monTip(v => pct(v, 1)) }) });

  // Bolsas: base 100 al inicio de la ventana para comparar S&P 500 y Nasdaq
  const rebase = s => { const w = since(s, d1); return w.length ? w.map(p => ({ x: p.t, y: p.v / w[0].v * 100 })) : []; };
  addChart("mundo", "ch-bolsas", { type: "line", data: { datasets: [
    line("S&P 500", rebase(S.sp500), s1),
    line("Nasdaq", rebase(S.nasdaq), s2),
  ] }, options: baseOpts({ yt: v => axisNum(v), tip: { title: dateTitle, label: c => ` ${c.dataset.label}: ${fmt(c.parsed.y, 1)}` } }) });

  const pay = xy(since(o.payrollsChg, d2));
  const opP = baseOpts({ yt: v => fmt(v, 0) + " mil", tip: monTip(v => signed(v * 1000, 0) + " empleos") });
  opP.plugins.legend.display = false;
  addChart("mundo", "ch-empleo", { type: "bar", data: { datasets: [bar("Empleos creados", pay, signColors(pay))] }, options: opP });

  const opB = baseOpts({ yt: v => "US$ " + fmt(v, 0), tip: { title: dateTitle, label: c => ` Brent: US$ ${fmt(c.parsed.y, 2)}` } });
  opB.plugins.legend.display = false; opB.scales.y.beginAtZero = false;
  addChart("mundo", "ch-brent", { type: "line", data: { datasets: [line("Brent", xy(since(S.brent, d1)), s2)] }, options: opB });

  const opR = baseOpts({ yt: v => fmt(v, 2), tip: { title: dateTitle, label: c => ` R$ ${fmt(c.parsed.y, 4)} por dólar` } });
  opR.plugins.legend.display = false; opR.scales.y.beginAtZero = false;
  addChart("mundo", "ch-ptax", { type: "line", data: { datasets: [line("PTAX", xy(since(S.ptax, d1)), s3)] }, options: opR });
}

TABS.push({
  id: "mundo", label: "El mundo",
  html: `<div class="head"><h2>El mundo</h2>
    <p>Lo de afuera que mueve a la Argentina: tasas de los bancos centrales (si suben, cuesta más conseguir financiamiento), inflación, bolsas, empleo en EE.UU., petróleo y Brasil.</p></div>
  <div class="grid">
    <div class="card c5">
      <h3>Tablero internacional</h3>
      <div class="tbl"><table id="tb-mundo" class="tight"></table></div>
      <p class="src">FRED y Bank of England solo se actualizan con la foto (no permiten consultas desde el navegador).</p>
    </div>
    <div class="card c7">
      <h3>Tasas de referencia</h3>
      <p class="cap">Tasas de política monetaria de EE.UU., la zona euro e Inglaterra, y el rendimiento del bono a 10 años de EE.UU.</p>
      <div class="chart"><canvas id="ch-tasas" aria-label="Tasas de referencia"></canvas></div>
      <p class="src">Fuentes: FRED (DFEDTARU, ECBDFR, DGS10), Bank of England (IUDBEDR)</p>
    </div>
    <div class="card c6">
      <h3>Inflación interanual</h3>
      <div class="chart"><canvas id="ch-infl" aria-label="Inflación de EE.UU., zona euro y Brasil"></canvas></div>
      <p class="src">Fuentes: FRED (CPIAUCSL), Eurostat (HICP), Banco Central do Brasil (IPCA, SGS 13522)</p>
    </div>
    <div class="card c6">
      <h3>Bolsas de EE.UU.</h3>
      <p class="cap">Base 100 hace un año.</p>
      <div class="chart"><canvas id="ch-bolsas" aria-label="S&P 500 y Nasdaq"></canvas></div>
      <p class="src">Fuente: FRED (SP500, NASDAQCOM)</p>
    </div>
    <div class="card c6">
      <h3>Empleos creados por mes en EE.UU.</h3>
      <div class="chart short"><canvas id="ch-empleo" aria-label="Empleos creados en EE.UU."></canvas></div>
      <p class="src">Fuente: FRED (PAYEMS, BLS) · variación mensual de puestos no agrícolas</p>
    </div>
    <div class="card c6">
      <h3>Petróleo Brent</h3>
      <div class="chart short"><canvas id="ch-brent" aria-label="Petróleo Brent"></canvas></div>
      <p class="src">Fuente: FRED (DCOILBRENTEU) · US$ por barril, publica con algunos días de rezago</p>
    </div>
    <div class="card c12">
      <h3>Real brasileño por dólar</h3>
      <div class="chart short"><canvas id="ch-ptax" aria-label="Real por dólar"></canvas></div>
      <p class="src">Fuente: Banco Central do Brasil (PTAX, SGS 1)</p>
    </div>
  </div>`,
  render: renderMundo, draw: drawMundo,
});
