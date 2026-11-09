// ---------- Gráficos: helpers compartidos y registro por pestaña ----------
const charts = {};   // id de pestaña -> [Chart]
function css(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
function destroyCharts(tabId) { (charts[tabId] || []).forEach(c => c.destroy()); charts[tabId] = []; }
function addChart(tabId, canvasId, cfg) { (charts[tabId] = charts[tabId] || []).push(new Chart(document.getElementById(canvasId), cfg)); }
const palette = () => ({ s1: css("--s1"), s2: css("--s2"), s3: css("--s3"), s4: css("--s4") });
const dateTitle = items => items.length ? fdate(items[0].parsed.x) : "";
function baseOpts(o = {}) {
  const ink2 = css("--ink-2"), rule = css("--rule");
  return {
    responsive: true, maintainAspectRatio: false, animation: false, parsing: false, normalized: true,
    interaction: { mode: "nearest", axis: "x", intersect: false },
    plugins: {
      legend: { position: "top", align: "start", labels: { color: ink2, boxWidth: 12, boxHeight: 3, font: { family: css("--f-body"), size: 12 } } },
      tooltip: { backgroundColor: css("--surface"), titleColor: css("--ink"), bodyColor: css("--ink-2"), borderColor: rule, borderWidth: 1, padding: 10,
        titleFont: { family: css("--f-body"), weight: "600" }, bodyFont: { family: css("--f-mono"), size: 12 }, callbacks: o.tip || {} },
    },
    scales: {
      x: { type: "linear", grid: { display: false }, border: { color: rule }, ticks: { color: ink2, maxTicksLimit: 8, callback: o.xt || (v => fmon(v)) }, ...(o.x || {}) },
      y: { grid: { color: rule }, border: { display: false }, ticks: { color: ink2, callback: o.yt || (v => fmt(v, 0)) }, ...(o.y || {}) },
    },
  };
}
const line = (label, data, color, extra = {}) => ({ label, data, borderColor: color, backgroundColor: color, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, tension: 0, ...extra });
const ref = (label, y, x0, x1, color) => line(label, [{ x: x0, y }, { x: x1, y }], color, { borderDash: [5, 4], borderWidth: 1.5 });
