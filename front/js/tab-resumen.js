// ---------- Pestaña: Resumen ----------
function renderTiles(o) {
  const S = o.S, T = [];
  const may = last(S.mayorista), may30 = may && at(S.mayorista, may.t - 30 * DAY);
  T.push({ k: "Dólar mayorista", v: "$" + fmt(may && may.v, 2), d: may30 ? `<span class="${cls(may.v / may30.v - 1, false)}">${signed((may.v / may30.v - 1) * 100, 1, "%")}</span> en 30 días` : "", src: may ? `BCRA 5 · ${fdate(may.t)}` : "BCRA 5" });
  const mep = last(o.mep), mayAtMep = mep && at(S.mayorista, mep.t);
  T.push({ k: "Dólar MEP", v: "$" + fmt(mep && mep.v, 2), d: mayAtMep ? `Brecha con mayorista ${signed((mep.v / mayAtMep.v - 1) * 100, 1, "%")}` : "", src: mep ? `ArgentinaDatos · ${fdate(mep.t)}` : "ArgentinaDatos" });
  const ccl = last(o.S.ccl), mayAtCcl = ccl && at(S.mayorista, ccl.t);
  T.push({ k: "Dólar CCL", v: "$" + fmt(ccl && ccl.v, 2), d: mayAtCcl ? `Brecha con mayorista ${signed((ccl.v / mayAtCcl.v - 1) * 100, 1, "%")}` : "", src: ccl ? `ArgentinaDatos · ${fdate(ccl.t)}` : "ArgentinaDatos" });
  // Las bandas se publican por adelantado hasta fin de mes: tomar la vigente en la fecha del mayorista
  const sup = may && at(S.bandaSup, may.t), inf = may && at(S.bandaInf, may.t);
  T.push({ k: "Distancia al techo", v: sup && may ? pct((sup.v / may.v - 1) * 100) : "—", d: sup && inf ? `Banda $${fmt(inf.v, 0)} – $${fmt(sup.v, 0)}` : "", src: "BCRA 1187 / 1188" });
  const r = last(S.reservas), r30 = r && at(S.reservas, r.t - 30 * DAY);
  T.push({ k: "Reservas brutas", v: "US$ " + fmt(r && r.v / 1000, 1) + " mil M", d: r30 ? `<span class="${cls(r.v - r30.v)}">${signed(r.v - r30.v, 0)}</span> M en 30 días` : "", src: r ? `BCRA 1 · ${fdate(r.t)}` : "BCRA 1" });
  const cp = o.compras;
  T.push({ k: "Compras del BCRA", v: cp ? "US$ " + fmt(cp.semana, 0) + " M" : "—", d: cp ? `Semana del ${fdate(cp.lunes)} (${cp.dias} días informados)` : "", src: cp ? `BCRA 78 · al ${fdate(cp.t)}` : "BCRA 78" });
  T.push({ k: "Inflación mensual", v: pct(o.infM && o.infM.v), d: o.infA ? `Interanual ${pct(o.infA.v)} · ${fmon(o.infM.t)}` : "", src: "BCRA 27 / 28 · INDEC" });
  T.push({ k: "Esperada a 12 meses (REM)", v: pct(o.rem && o.rem.v), d: o.infAnualizada != null ? `Actual anualizada ${pct(o.infAnualizada)}` : "", src: o.rem ? `BCRA 29 · REM ${fmon(o.rem.t)}` : "BCRA 29" });
  const beL = [...o.be].reverse().find(x => x.be != null && !x.ext) || [...o.be].reverse().find(x => x.be != null);
  T.push({ k: "Implícita de mercado", v: beL ? pct(beL.be) : "—", d: beL ? `Anual hasta ${fdate(beL.vtoT)} (${beL.t}) · ${pct(beL.beM, 2)} mensual` : "Faltan precios de bonos", src: "LECAP vs Boncer" });
  const pf = o.tasas[0];
  T.push({ k: "Tasa real plazo fijo", v: pf && pf.real != null ? signed(pf.real, 1, "%") : "—", d: pf && pf.tna != null ? `TNA ${pct(pf.tna, 2)} → TEA ${pct(pf.tea)} vs REM` : "", src: "BCRA 12 y 29" });
  const rp = last(o.riesgo), rp30 = rp && at(o.riesgo, rp.t - 30 * DAY);
  T.push({ k: "Riesgo país", v: rp ? fmt(rp.v, 0) + " pb" : "—", d: rp30 ? `<span class="${cls(rp.v - rp30.v, false)}">${signed(rp.v - rp30.v, 0)}</span> pb en 30 días` : "", src: rp ? `ArgentinaDatos · ${fdate(rp.t)}` : "ArgentinaDatos" });
  const g = last(o.S.gd30), g30 = g && at(o.S.gd30, g.t - 30 * DAY);
  T.push({ k: "Bono GD30", v: g ? "US$ " + fmt(g.v, 2) : "—", d: g30 ? `<span class="${cls(g.v - g30.v)}">${signed((g.v / g30.v - 1) * 100, 1, "%")}</span> en 30 días` : "", src: g ? `data912 · ${fdate(g.t)}` : "data912" });
  document.getElementById("tiles").innerHTML = T.map(x => `<div class="tile"><div class="k">${x.k}</div><div class="v">${x.v}</div><div class="d">${x.d}</div><div class="src">${x.src}</div></div>`).join("");
}

function renderNote(o, res) {
  const parts = [];
  if (!res.live.length && res.snap.length) parts.push(`<b>Estás viendo una foto de los datos del ${SNAP.fecha}.</b> La página publicada no puede consultar APIs externas. Descargá el archivo HTML y abrilo en tu navegador para ver los datos en vivo.`);
  if (res.missing.length) parts.push(`<span class="err">No se pudieron cargar: ${res.missing.join(", ")}.</span>`);
  parts.push(`Liquidación supuesta ${fdate(o.settle)} · CER usado ${fmt(o.cerLag, 4)} (del ${fdate(o.cerDate)}). Boncer incluidos: ${BONCER.map(b => b.t).join(", ")}; el resto (${CFG.boncer_pendientes.join(", ")}) se suma cuando se confirme su CER base.`);
  document.getElementById("note").innerHTML = parts.join("<br>");
}

TABS.push({
  id: "resumen", label: "Resumen",
  html: `<section class="tiles" id="tiles" aria-label="Indicadores principales"></section>
  <div class="note" id="note"></div>`,
  render(o, res) { renderTiles(o); renderNote(o, res); },
});
