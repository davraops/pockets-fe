# Space Audit — Calculadora

**Última auditoría:** 2026-06-23  
**Ruta:** `/registros/calculadora`  
**Archivos:** `Calculadora.tsx`, `Calculadora.css`, `utilidades-submodule.css`  
**Score Space:** **4.0 / 5**

---

## Resumen ejecutivo

Herramienta standalone (no CRUD). `UtilidadesSubHeader` + teclado numérico + historial local en split desktop.

| Veredicto | Detalle |
|-----------|---------|
| **CTA primario** | N/A (herramienta) |
| **Jerarquía** | ✅ Display → atajos ±/% → teclado → historial secundario |
| **Mobile** | ✅ Teclado compacto ≤480px; hint oculto (meta ya describe atajos) |
| **Hallazgos abiertos** | 0 |

---

## Mapa de layout

```
[← Utilidades]
Calculadora · Rápida
meta: teclado, atajos, historial local

Desktop (≥900px):
┌─────────────── main (400px, centrado) ───┐  ┌── aside sticky ──┐
│ display + copiar                          │  │ Historial         │
│ ±  %                                      │  │ (scroll interno)  │
│ teclado 4×5                               │  └───────────────────┘
│ hint atajos (solo desktop)                │
└───────────────────────────────────────────┘

Mobile (<900px):
stack — calculadora arriba, historial abajo (max-height 240px)
```

---

## Tabla por dimensión (Space)

| Dimensión | Score | Evidencia |
|-----------|:-----:|-----------|
| **Uso vertical del espacio** | 4.0 | Herramienta visible above-the-fold; historial acotado en móvil |
| **Jerarquía visual** | 4.2 | Título Utilidades + display dominante; historial claramente secundario |
| **Botones y acciones** | 4.0 | Teclado táctil 48px mínimo; copiar en display e historial |
| **Densidad / escaneo** | 3.8 | Grid 4×5 legible; filas de historial mono + fecha |
| **Consistencia de layout** | 4.2 | Patrón `utilidades-tool-workspace--split` compartido con Generador |
| **Legibilidad tipográfica** | 4.0 | Display mono tabular; meta sentence-case |

**Promedio:** **4.0 / 5**

---

## Mobile (≤768px / ≤480px)

- Historial debajo del teclado (orden correcto)
- Hint de atajos oculto — redundante con meta del sub-header
- Teclado: gap `xs`, botones 48px, `=` 104px de alto
- Lista historial: `max-height: min(240px, 40vh)` con scroll interno

---

## Fortalezas

- `UtilidadesSubHeader` alineado con el resto de Utilidades
- Split desktop: calculadora centrada en columna izquierda, aside sticky con offset chrome
- Operadores en `--section-utilidades` (coherencia de marca)
- Atajos de teclado físico + toast en división por cero
- Historial localStorage con reutilizar/copiar/borrar

---

## Resueltos

| Hallazgo | Fix |
|----------|-----|
| P1 Teclado denso en móvil pequeño | Botones 48px, gaps reducidos, display compacto |
| P2 Calculadora desalineada del header en split | `justify-self: start` — borde izquierdo con título |
| P2 Operadores con acento global | `--section-utilidades` en operadores e igual |
| P2 Aside sticky bajo StatusBar | `top: var(--layout-chrome-offset-top)` |
| P2 Hint duplica meta en móvil | Oculto ≤768px |
| P2 Márgenes internos holgados | Padding/gaps compactos; hint alineado a la izquierda |

---

## Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-06-23 | Mobile compact + split centrado + marca Utilidades — **4.0/5** |
| 2026-06-22 | Split + historial + UtilidadesSubHeader — **3.5/5** |
| 2026-06-22 | Auditoría herramienta inicial — **3.5/5** |
