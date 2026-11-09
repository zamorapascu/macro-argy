# Macro Argentina

Dashboard de macro argentina para seguir inversiones, organizado en pestañas: **Resumen**, **Inflación esperada** (REM vs. inflación implícita de LECAP/BONCAP contra Boncer), **Dólar** (mayorista, MEP y bandas) y **Reservas y tasas**.

## Cómo funciona

- El navegador descarga los datos en vivo de [BCRA](https://api.bcra.gob.ar), [ArgentinaDatos](https://argentinadatos.com) y [data912](https://data912.com), y calcula todo en el front.
- Si alguna fuente no responde, usa la foto de respaldo (`data/snapshot.json`) embebida en el HTML.
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

## Agregar un Boncer

En `config/sources.json`, sumar un objeto a `boncer` con el ticker (`t`), el vencimiento (`vto`) y el CER base (`base`: CER de 10 días hábiles antes de la emisión, se puede verificar contra la serie 30 del BCRA). Si estaba en `boncer_pendientes`, sacarlo de ahí.

No es recomendación de inversión.
