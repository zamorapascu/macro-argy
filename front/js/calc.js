// ---------- Cálculos ----------
function compute(raw) {
  const S = {}; for (const k of Object.keys(CFG.bcra)) S[k] = bcraSeries(raw["bcra_" + k]);
  const out = { S };

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

  // Dólar
  out.mep = (Array.isArray(raw.mep) ? raw.mep : []).map(x => ({ t: ts(x.fecha), v: +x.venta })).filter(p => p.v > 0).sort((a, b) => a.t - b.t);
  out.riesgo = (Array.isArray(raw.riesgo) ? raw.riesgo : []).map(x => ({ t: ts(x.fecha), v: +x.valor })).sort((a, b) => a.t - b.t);
  return out;
}

