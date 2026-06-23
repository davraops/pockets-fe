# Space Audit — Inflación

**Última auditoría:** 2026-06-22  
**Ruta:** `/finanzas/inflacion`  
**Archivos:** `Inflacion.tsx`, `Inflacion.css`, `crud.css`  
**Score Space:** **3.8 / 5**

---

## Resumen ejecutivo

Pantalla **herramienta + contenido editorial** (no CRUD). Calculadora, predictor, gráficos y material educativo largo.

| Veredicto | Detalle |
|-----------|---------|
| **CTA primario** | N/A — sin acción crear |
| **Hallazgos abiertos** | 2 (P2) |

---

## Mapa de layout

```
[← Finanzas]
Inflación (h1) + subtítulo
┌ Calculador de devaluación ─ inputs ─┐
│ crud-summary-strip --danger (resultado) │
└───────────────────────────────────────┘
┌ Predictor ─ crud-summary-strip 4 cols ─┐
[ Gráfico histórico ]
[ Warning editorial — largo ]
[ Grid 8 tips ]
[ Salario mínimo + más gráficos ]
```

---

## Tabla por dimensión (Space)

| Dimensión | Score | Evidencia |
|-----------|:-----:|-----------|
| **Uso vertical del espacio** | 3.5 | Herramientas arriba; editorial sigue siendo largo |
| **Jerarquía visual** | 4.0 | Calculadora y predictor antes del contenido |
| **Botones y acciones** | 4.0 | Solo back; coherente con tipo de pantalla |
| **Densidad / escaneo** | 3.5 | 8 tip cards + warning ocupan mucho scroll |
| **Consistencia de layout** | 3.8 | Resultados usan `crud-summary-strip` |
| **Legibilidad tipográfica** | 3.8 | Sentence case en secciones y strip |

**Promedio:** **3.8 / 5**

---

## Resueltos

| Hallazgo | Fix |
|----------|-----|
| P1 Calculadora bajo el fold | Reorden: calculadora → predictor → gráfico → editorial |
| P2 Resultado custom | `crud-summary-strip--danger` para devaluación |
| P2 Predictor en cards sueltas | `crud-summary-strip` 4 columnas |

---

## Abierto

| Prioridad | Hallazgo |
|-----------|----------|
| P2 | `inflacion-warning` ocupa ~200px antes de scroll útil en móvil |
| P2 | Grid de 8 tips — considerar acordeón o enlace “ver más” |

---

## Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-06-22 | Reorden + strips — **3.8/5** |
| 2026-06-22 | Estimación inicial — ~3.5/5 |
