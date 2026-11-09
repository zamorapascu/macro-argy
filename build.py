"""Descarga una foto de los datos y la embebe en macro-ar.html (respaldo para cuando no hay acceso en vivo)."""
import datetime as dt, json, pathlib, urllib.request

HERE = pathlib.Path(__file__).parent
today = dt.date.today()
back = lambda d: (today - dt.timedelta(days=d)).isoformat()
hasta = (today + dt.timedelta(days=30)).isoformat()

BCRA = {"reservas": (1, "2024-01-01"), "mayorista": (5, "2025-01-01"), "badlar": (7, back(120)), "pf30": (12, back(120)),
        "infM": (27, "2020-01-01"), "infA": (28, "2020-01-01"), "rem": (29, "2019-01-01"), "cer": (30, back(90)),
        "tamar": (44, back(120)), "bandaInf": (1187, "2025-04-01"), "bandaSup": (1188, "2025-04-01")}
URLS = {"letras": "https://api.argentinadatos.com/v1/finanzas/letras",
        "mep": "https://api.argentinadatos.com/v1/cotizaciones/dolares/bolsa",
        "riesgo": "https://api.argentinadatos.com/v1/finanzas/indices/riesgo-pais",
        "bonos": "https://data912.com/live/arg_bonds"}
for k, (i, desde) in BCRA.items():
    URLS["bcra_" + k] = f"https://api.bcra.gob.ar/estadisticas/v4.0/monetarias/{i}?desde={desde}&hasta={hasta}&limit=3000"

data = {}
for k, u in URLS.items():
    req = urllib.request.Request(u, headers={"User-Agent": "macro-ar-dashboard"})
    with urllib.request.urlopen(req, timeout=60) as r:
        data[k] = json.load(r)
    print(k, "ok")

cut = (today - dt.timedelta(days=600)).isoformat()
data["mep"] = [x for x in data["mep"] if x["fecha"] >= cut]
data["riesgo"] = [x for x in data["riesgo"] if x["fecha"] >= cut]
data["bonos"] = [x for x in data["bonos"] if x["symbol"].startswith(("TZX", "TX", "AL", "GD"))]

snap = {"fecha": today.strftime("%d/%m/%Y"), "data": data}
blob = json.dumps(snap, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
html = (HERE / "template.html").read_text().replace("/*SNAPSHOT*/null", blob)
(HERE / "index.html").write_text(html)
print("index.html", len(html) // 1024, "KB")
