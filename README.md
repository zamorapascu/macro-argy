# Macro Argentina

Dashboard de macro argentina para seguir inversiones: dólar y bandas cambiarias, reservas, tasas e inflación esperada (encuesta REM del BCRA vs. inflación implícita de LECAP/BONCAP contra Boncer).

## Cómo funciona

- `index.html` es todo el dashboard. Al abrirlo, el navegador descarga los datos en vivo de:
  - [API del BCRA](https://api.bcra.gob.ar) (estadísticas monetarias v4.0)
  - [ArgentinaDatos](https://argentinadatos.com) (LECAP/BONCAP, dólar MEP, riesgo país)
  - [data912](https://data912.com) (precios de bonos)
- Si alguna fuente no responde, usa una foto de respaldo embebida en el HTML.

## Archivos

| Archivo | Para qué |
|---|---|
| `template.html` | Fuente del dashboard (HTML, CSS y JS). Se edita acá. |
| `build.py` | Descarga la foto de respaldo y genera `index.html` a partir de `template.html`. |
| `index.html` | Archivo que se publica en GitHub Pages. |

## Actualizar

```bash
python3 build.py
git add -A && git commit -m "Actualiza dashboard" && git push
```

GitHub Pages publica el cambio en uno o dos minutos.

## Agregar un Boncer

En `template.html`, sumar una línea a `BONCER` con el ticker, el vencimiento y el CER base (CER de 10 días hábiles antes de la emisión, se puede verificar contra la serie 30 del BCRA).

No es recomendación de inversión.
