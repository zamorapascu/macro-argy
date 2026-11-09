"""Arma el index.html publicable: inyecta CSS, JS, configuración y snapshot en front/index.html.

Uso:
  python3 back/build.py           # arma index.html con el snapshot actual
  python3 back/build.py --fetch   # antes descarga datos nuevos (back/fetch.py)

El resultado es un único archivo que funciona abriéndolo con doble clic (file://) o en GitHub Pages.
"""
import json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
FRONT = ROOT / "front"
# Orden de carga: todo comparte un solo scope, así que los nombres de nivel superior no pueden repetirse.
JS_ORDER = ["config", "util", "load", "calc", "charts", "tabs",
            "tab-resumen", "tab-inflacion", "tab-dolar", "tab-reservas", "main"]


def safe(s):  # evita cerrar el <script> por accidente
    return s.replace("</", "<\\/")


def main():
    if "--fetch" in sys.argv:
        subprocess.run([sys.executable, str(ROOT / "back" / "fetch.py")], check=True)

    snap = (ROOT / "data" / "snapshot.json").read_text()
    cfg = json.dumps(json.loads((ROOT / "config" / "sources.json").read_text()), ensure_ascii=False, separators=(",", ":"))
    css = (FRONT / "css" / "styles.css").read_text()
    js = "\n".join((FRONT / "js" / f"{n}.js").read_text() for n in JS_ORDER)

    html = (FRONT / "index.html").read_text()
    for marker, value in (("/*CSS*/", css), ("/*JS*/", safe(js)), ("/*CONFIG*/null", safe(cfg)), ("/*SNAPSHOT*/null", safe(snap))):
        assert html.count(marker) == 1, f"marcador {marker} no está exactamente una vez en front/index.html"
        html = html.replace(marker, value)
    (ROOT / "index.html").write_text(html)
    print("index.html", len(html) // 1024, "KB")


if __name__ == "__main__":
    main()
