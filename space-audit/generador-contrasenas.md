# Space Audit — Generador de Contraseñas

**Última auditoría:** 2026-06-23  
**Ruta:** `/registros/generador-contrasenas`  
**Archivos:** `GeneradorContrasenas.tsx`, `GeneradorContrasenas.css`, `generadorContrasenasUtils.ts`  
**Score Space:** **4.5 / 5**

---

## Resumen ejecutivo

Herramienta split: panel único (output + opciones + CTA) + historial sidebar. Centrada en desktop como Calculadora.

| Veredicto | Detalle |
|-----------|---------|
| **CTA primario** | ✅ `Generar contraseña` full-width en panel |
| **Jerarquía** | ✅ Output mono → fortaleza → opciones compactas → historial secundario |
| **Mobile** | ✅ Stack; opciones 1 col; historial acotado |
| **Hallazgos abiertos** | 0 |

---

## Mapa de layout

```
Desktop (≥900px, centrado):
┌── generador-shell (~420px) ──┐  ┌── historial sticky ──┐
│ Contraseña + copiar           │  │ Ab12••••    hace 2m  │
│ Fortaleza + barra             │  │ …                     │
│ Longitud + grid 2×2 opciones  │  └───────────────────────┘
│ [ Generar contraseña ]        │
└───────────────────────────────┘

Mobile: panel arriba, historial abajo
```

---

## Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-06-23 | Rediseño split + utils + historial enmascarado — **4.5/5** |
| 2026-06-22 | Subtitle eliminado — **3.6/5** |
