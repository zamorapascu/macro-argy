# Macro Argentina

Dashboard de macro argentina para seguir inversiones, organizado en pestañas:

- **Resumen**: indicadores clave.
- **Inflación esperada**: REM vs. inflación implícita de LECAP/BONCAP contra Boncer.
- **Dólar**: mayorista, MEP, CCL, bandas y brechas.
- **Riesgo país y bonos**: EMBI y Globales GD30/GD35.
- **Reservas y tasas**: reservas, compras de divisas del BCRA, base monetaria y tasas en pesos.
- **Actividad**: EMAE, industria (IPI), construcción (ISAC), comercio exterior y términos del intercambio (INDEC).
- **El mundo**: tasas de la Fed, BCE, Bank of England y Selic; inflación de EE.UU., zona euro y Brasil; bolsas, empleo, Brent y real.

## Cómo funciona

- Al abrir, la página muestra al instante la foto embebida (`data/snapshot.json`) y después la reemplaza con los datos en vivo.
- **En vivo** (el navegador las consulta directo, tienen CORS): BCRA, ArgentinaDatos, data912, INDEC vía datos.gob.ar, Banco Central do Brasil y Eurostat.
- **Solo en la foto** (`live: false`, no permiten consultas desde el navegador): FRED y Bank of England. Se actualizan al correr `back/fetch.py`.
- Si una fuente en vivo no responde, se usa la de la foto. Las notas de fuente indican "foto del dd/mm" cuando corresponde.
- El "back" es Python (solo librería estándar): descarga la foto y arma el archivo publicable. No hay servidor, así que sigue funcionando en GitHub Pages y abriendo `index.html` con doble clic.

## Estructura

```
back/
  fetch.py          descarga datos y actualiza data/snapshot.json
  build.py          arma index.html (inyecta CSS, JS, config y snapshot)
config/
  sources.json      series del BCRA, URLs, Boncer y demás parámetros (única fuente de verdad)
data/
  snapshot.json     foto de respaldo de los datos
front/
  index.html        esqueleto de la página (con marcadores que completa el build)
  css/styles.css
  js/
    config.js       lee sources.json y arma las URLs
    util.js         parseo y formato
    load.js         carga en vivo con respaldo
    calc.js         cálculos (breakeven, TIR real, tasas)
    charts.js       helpers de Chart.js
    tabs.js         registro y navegación de pestañas
    tab-*.js        una pestaña por archivo (HTML, tablas y gráficos)
    main.js         arranque
index.html          resultado del build; es lo que se publica (no editar a mano)
```

## Actualizar

```bash
python3 back/build.py --fetch
git add -A && git commit -m "Actualiza dashboard" && git push
```

Sin `--fetch`, `build.py` rearma el `index.html` con la foto que ya hay. GitHub Pages publica el cambio en uno o dos minutos.

## Agregar una pestaña

1. Crear `front/js/tab-<nombre>.js` que haga `TABS.push({ id, label, html, render(o, res), draw(o) })`. `render` arma tablas e indicadores; `draw` dibuja los gráficos y se ejecuta la primera vez que se abre la pestaña.
2. Sumar `"tab-<nombre>"` a `JS_ORDER` en `back/build.py` (el orden define el de las pestañas).

Todos los archivos JS comparten un solo scope: no repetir nombres de `const`/`function` de nivel superior.

## Agregar una fuente

1. En `config/sources.json`, sumar un objeto a `sources` con `key` única, `kind` y su ventana (`desde` o `days`). Poner `live: true` solo si la API permite CORS.
2. Si el `kind` es nuevo: sumar su URL en `URL_BY_KIND` (`front/js/config.js`) y en `url()` (`back/fetch.py`), y su parser en `PARSE` (`front/js/util.js`). Las fuentes no live se guardan normalizadas como pares `[fecha, valor]` en `process()` de `fetch.py`.
3. La serie queda disponible como `STATE.S.<key>` (para `datosgob`, una por nombre en `series`).

## Agregar un Boncer

En `config/sources.json`, sumar un objeto a `boncer` con el ticker (`t`), el vencimiento (`vto`) y el CER base (`base`: CER de 10 días hábiles antes de la emisión, se puede verificar contra la serie 30 del BCRA). Si estaba en `boncer_pendientes`, sacarlo de ahí.

No es recomendación de inversión.
