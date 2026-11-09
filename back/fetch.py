"""Descarga una foto de los datos y la guarda en data/snapshot.json.

La foto sirve de respaldo cuando el navegador no puede consultar las APIs, y es la única vía para las
fuentes sin CORS (live: false en config/sources.json), como FRED y el Bank of England.

- Fuentes live: se guarda la respuesta cruda (recortada a la ventana), así el front la parsea igual
  que si viniera en vivo.
- Fuentes no live: se guardan normalizadas como [["AAAA-MM-DD", valor], ...].
Si una fuente falla, se conserva el dato anterior en vez de perderlo.
"""
import csv, datetime as dt, io, json, pathlib, sys, urllib.parse, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
CFG = json.loads((ROOT / "config" / "sources.json").read_text())
SNAP = ROOT / "data" / "snapshot.json"
TODAY = dt.date.today()


def desde(s):
    """Inicio de la ventana: 'desde' fijo o 'days' hacia atrás."""
    return dt.date.fromisoformat(s["desde"]) if len(s.get("desde", "")) == 10 else TODAY - dt.timedelta(days=s.get("days", 365))


# ---------- URL por tipo de fuente (espejo de front/js/config.js) ----------
def url(s):
    k = s["kind"]
    if k == "bcra":
        hasta = TODAY + dt.timedelta(days=30)
        return f"https://api.bcra.gob.ar/estadisticas/v4.0/monetarias/{s['id']}?desde={desde(s)}&hasta={hasta}&limit=3000"
    if k == "argdatos":
        return f"https://api.argentinadatos.com/v1/{s['path']}"
    if k == "json":
        return s["url"]
    if k == "d912_hist":
        return f"https://data912.com/historical/bonds/{s['ticker']}"
    if k == "datosgob":
        q = {"ids": ",".join(s["series"].values()), "start_date": s["desde"], "limit": 1000, "format": "json"}
        return "https://apis.datos.gob.ar/series/api/series/?" + urllib.parse.urlencode(q)
    if k == "bcb_sgs":
        f = lambda d: d.strftime("%d/%m/%Y")
        return (f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.{s['id']}/dados?formato=json"
                f"&dataInicial={f(desde(s))}&dataFinal={f(TODAY + dt.timedelta(days=90))}")
    if k == "eurostat":
        q = dict(s["params"], sinceTimePeriod=s["desde"])
        return f"https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/{s['dataset']}?" + urllib.parse.urlencode(q)
    if k == "fred":
        return f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={s['id']}&cosd={desde(s)}"
    if k == "boe":
        return ("https://www.bankofengland.co.uk/boeapps/database/_iadb-fromshowcolumns.asp?csv.x=yes"
                f"&Datefrom={desde(s).strftime('%d/%b/%Y')}&Dateto=now&SeriesCodes={s['code']}&CSVF=TN&UsingCodes=Y&VPD=Y&VFD=N")
    raise ValueError(f"kind desconocido: {k}")


def get(u):
    req = urllib.request.Request(u, headers={"User-Agent": "macro-ar-dashboard"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8-sig")


def num(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return None  # FRED marca los días sin dato con "."


# ---------- Recorte (live) y normalización (no live) ----------
def process(s, text):
    k, cut = s["kind"], desde(s).isoformat()
    if k == "fred":
        rows = list(csv.reader(io.StringIO(text)))[1:]
        return [[d, num(v)] for d, v in rows if num(v) is not None]
    if k == "boe":
        rows = list(csv.reader(io.StringIO(text)))[1:]
        return [[dt.datetime.strptime(d, "%d %b %Y").date().isoformat(), num(v)] for d, v in rows if num(v) is not None]
    data = json.loads(text)
    if k == "argdatos":  # solo los campos que usa el front, para achicar la foto
        return [{"fecha": x["fecha"], s["field"]: x[s["field"]]} for x in data if x["fecha"] >= cut]
    if k == "d912_hist":
        return [{"date": x["date"], "c": x["c"]} for x in data if x["date"] >= cut]
    if k == "json" and "keep_prefixes" in s:
        return [x for x in data if x["symbol"].startswith(tuple(s["keep_prefixes"]))]
    if k == "datosgob" and data.get("count", 0) > len(data.get("data", [])):
        print(f"  aviso: {s['key']} trae {len(data['data'])} de {data['count']} filas (subir limit)")
    return data


def main():
    old = json.loads(SNAP.read_text()) if SNAP.exists() else {"data": {}}
    data, failed = {}, []
    only = set(sys.argv[1:])  # opcional: python3 back/fetch.py fred_sp500 ... para probar una fuente
    for s in CFG["sources"]:
        k = s["key"]
        if only and k not in only:
            data[k] = old.get("data", {}).get(k)
            continue
        try:
            data[k] = process(s, get(url(s)))
            print(f"{k:10s} ok")
        except Exception as e:
            failed.append(k)
            data[k] = old.get("data", {}).get(k)
            print(f"{k:10s} FALLÓ: {e}", "(se conserva el dato anterior)" if data[k] is not None else "(sin dato previo)")

    data = {k: v for k, v in data.items() if v is not None}
    fecha = TODAY.strftime("%d/%m/%Y") if len(failed) < len(CFG["sources"]) else old.get("fecha", "—")
    SNAP.write_text(json.dumps({"fecha": fecha, "data": data}, ensure_ascii=False, separators=(",", ":")))
    print(f"snapshot {fecha} · {SNAP.stat().st_size // 1024} KB", f"· fallaron: {', '.join(failed)}" if failed else "")


if __name__ == "__main__":
    main()
