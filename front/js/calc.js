// ---------- Cálculos ----------
function compute(res) {
  const raw = res.raw, S = parseAll(raw);
  const out = { S, res };

  // Fecha de liquidación T+1 sobre el último día hábil, y CER con rezago de 10 hábiles
  let trade = today; while (!isBiz(trade)) trade -= DAY;
  const settle = addBiz(trade, 1);
  const cerDate = addBiz(settle, -10);
  const cerP = at(S.cer, cerDate);
  out.settle = settle; out.cerDate = cerDate; out.cerLag = cerP ? cerP.v : null;

  // Boncer
  const bonos = Array.isArray(raw.bonos) ? raw.bonos : [];
  const px = Object.fromEntries(bonos.map(b => [b.symbol, b]));
  out.cer = BONCER.map(b => {
    const q = px[b.t]; const vto = ts(b.vto); const days = Math.round((vto - settle) / DAY);
    const p = q ? (q.c || (q.px_bid && q.px_ask ? (q.px_bid + q.px_ask) / 2 : q.px_bid || q.px_ask)) : null;
    const vt = out.cerLag ? 100 * out.cerLag / b.base : null;
    const tir = p && vt && days > 0 ? (Math.pow(vt / p, 365 / days) - 1) * 100 : null;
    return { ...b, vtoT: vto, days, precio: p, vt, tir, chg: q ? q.pct_change : null };
  }).filter(b => b.days > 0);
  const cerPts = out.cer.filter(b => b.tir != null).sort((a, b) => a.days - b.days);

  // Tasa fija
  const L = raw.letras && Array.isArray(raw.letras.letras) ? raw.letras.letras : [];
  out.fija = L.filter(x => /^[ST]\d{2}[A-Z]\d$/.test(x.ticker) && x.teaPorcentaje > 0 && x.teaPorcentaje < 200)
    .map(x => ({ t: x.ticker, vtoT: ts(x.fechaVencimiento), days: Math.round((ts(x.fechaVencimiento) - settle) / DAY), tea: x.teaPorcentaje, tem: x.temPorcentaje, precio: x.precioArs }))
    .filter(x => x.days >= 14).sort((a, b) => a.days - b.days);
  out.fechaLetras = raw.letras && raw.letras.fechaActualizacion;

  // Interpolación lineal de la TIR real por días; plano fuera del rango
  const interp = d => {
    if (!cerPts.length) return null;
    if (d <= cerPts[0].days) return { r: cerPts[0].tir, ext: d < cerPts[0].days };
    for (let i = 1; i < cerPts.length; i++) if (d <= cerPts[i].days) {
      const a = cerPts[i - 1], b = cerPts[i], w = (d - a.days) / (b.days - a.days);
      return { r: a.tir + w * (b.tir - a.tir), ext: false };
    }
    return { r: last(cerPts).tir, ext: true };
  };
  out.be = out.fija.map(x => {
    const i = interp(x.days); if (!i) return { ...x, real: null, be: null };
    const be = ((1 + x.tea / 100) / (1 + i.r / 100) - 1) * 100;
    return { ...x, real: i.r, ext: i.ext, be, beM: (Math.pow(1 + be / 100, 1 / 12) - 1) * 100 };
  });

  // Inflación
  const im = last(S.infM), ia = last(S.infA), rem = last(S.rem);
  out.infM = im; out.infA = ia; out.rem = rem;
  out.infAnualizada = im ? (Math.pow(1 + im.v / 100, 12) - 1) * 100 : null;
  const l3 = S.infM.slice(-3);
  out.inf3m = l3.length === 3 ? (Math.pow(l3.reduce((a, p) => a * (1 + p.v / 100), 1), 4) - 1) * 100 : null;

  // Tasas
  const tea30 = tna => (Math.pow(1 + tna / 100 * 30 / 365, 365 / 30) - 1) * 100;
  out.tasas = [["Plazo fijo 30 días", S.pf30], ["TAMAR bancos privados", S.tamar], ["BADLAR bancos privados", S.badlar]].map(([n, s]) => {
    const p = last(s); if (!p) return { n };
    const tea = tea30(p.v); return { n, t: p.t, tna: p.v, tea, real: rem ? ((1 + tea / 100) / (1 + rem.v / 100) - 1) * 100 : null };
  });

  // Dólar: brechas contra el mayorista del mismo día (o el último anterior)
  out.mep = S.mep; out.riesgo = S.riesgo;
  const brecha = s => s.map(p => { const m = at(S.mayorista, p.t); return m && p.t - m.t < 5 * DAY ? { t: p.t, v: (p.v / m.v - 1) * 100 } : null; }).filter(Boolean);
  out.brechaMep = brecha(S.mep); out.brechaCcl = brecha(S.ccl);

  // Compras de divisas del BCRA: suma de la semana (lunes a viernes) del último dato y del mes
  const c = last(S.compras);
  if (c) {
    const d = new Date(c.t), mes = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
    const sum = t0 => since(S.compras, t0).reduce((a, p) => a + p.v, 0);
    // Semana del último dato; si tiene menos de 2 días informados, la última semana completa
    let lunes = c.t - ((d.getUTCDay() + 6) % 7) * DAY;
    const week = l => S.compras.filter(p => p.t >= l && p.t < l + 7 * DAY);
    if (week(lunes).length < 2) lunes -= 7 * DAY;
    const w = week(lunes);
    out.compras = { t: c.t, semana: w.reduce((a, p) => a + p.v, 0), dias: w.length, lunes, mes: sum(mes), anio: sum(Date.UTC(d.getUTCFullYear(), 0, 1)) };
  }
  // Compras por mes (para el gráfico de barras)
  const porMes = {};
  for (const p of S.compras) { const d = new Date(p.t), k = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1); porMes[k] = (porMes[k] || 0) + p.v; }
  out.comprasMes = Object.entries(porMes).map(([t, v]) => ({ t: +t, v })).sort((a, b) => a.t - b.t);

  // Selic: el BCB publica la tasa vigente hasta la próxima reunión del Copom (fechas futuras)
  out.selic = at(S.selic, today);

  // Mundo
  out.payrollsChg = diff(S.payems);          // miles de puestos por mes
  out.usCpiYoy = yoy(S.uscpi);
  return out;
}

