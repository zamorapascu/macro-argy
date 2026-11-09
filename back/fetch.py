"""Descarga una foto de los datos (BCRA, ArgentinaDatos, data912) y la guarda en data/snapshot.json.

Sirve de respaldo cuando el navegador no puede consultar las APIs en vivo.
Si una fuente falla, conserva el dato anterior del snapshot en vez de perderlo.
"""
import datetime as dt, json, pathlib, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
CFG = json.loads((ROOT / "config" / "sources.json").read_text())
SNAP = ROOT / "data" / "snapshot.json"


def urls(today):
    back = lambda d: (today - dt.timedelta(days=d)).isoformat()
    hasta = (today + dt.timedelta(days=30)).isoformat()
    out = dict(CFG["urls"])
    for k, s in CFG["bcra"].items():
        desde = s.get("desde") or back(s["days_back"])
        out["bcra_" + k] = f"{CFG['bcra_base']}/{s['id']}?desde={desde}&hasta={hasta}&limit=3000"
    return out


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "macro-ar-dashboard"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def main():
    today = dt.date.today()
    old = json.loads(SNAP.read_text()) if SNAP.exists() else {"data": {}}
    data = dict(old.get("data", {}))
    failed = []
    for k, u in urls(today).items():
        try:
            data[k] = get(u)
            print(k, "ok")
        except Exception as e:
            failed.append(k)
            print(k, "FALLÓ:", e, "(se conserva el dato anterior)" if k in data else "(sin dato previo)")

    cut = (today - dt.timedelta(days=CFG["snapshot_keep_days"])).isoformat()
    data["mep"] = [x for x in data.get("mep", []) if x["fecha"] >= cut]
    data["riesgo"] = [x for x in data.get("riesgo", []) if x["fecha"] >= cut]
    data["bonos"] = [x for x in data.get("bonos", []) if x["symbol"].startswith(tuple(CFG["bond_prefixes"]))]

    fecha = old.get("fecha", "—") if len(failed) == len(urls(today)) else today.strftime("%d/%m/%Y")
    SNAP.write_text(json.dumps({"fecha": fecha, "data": data}, ensure_ascii=False, separators=(",", ":")))
    print("snapshot", fecha, f"({len(failed)} fuentes fallidas)" if failed else "")


if __name__ == "__main__":
    main()
