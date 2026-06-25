# Space Audit — Pockets FE

Auditoría de **layout, densidad y legibilidad**: cómo se usa el espacio en pantalla, dónde viven las acciones (botones), y si la información se presenta de forma escaneable.

Complementa:

- [UI Readiness](../ui-readiness/README.md) — estética y design system (4.1/5)
- [UX Readiness](../ux-readiness/README.md) — feedback, errores, accesibilidad (3.9/5)
- [Product Readiness](../product-readiness/README.md) — funcionalidad y producción

**Ruta en vivo:** `/space-audit`

## Score global: **2.7 / 5**

La app se ve pulida (glass, tokens, HIG) pero **no se lee ni se navega con la misma facilidad**. Hay demasiadas capas visuales, acciones primarias escondidas, y patrones de fila/resumen duplicados con reglas distintas.

| Dimensión | Score | Resumen |
|-----------|:-----:|---------|
| Uso vertical del espacio | 2.5 | StatusBar + padding + Footer + márgenes duplicados restan área útil |
| Jerarquía visual | 2.8 | Títulos OK; subtítulos y stats compiten; resúmenes inconsistentes |
| Botones y acciones | 2.5 | Primarias en menú ⋮; 6+ variantes de botón sin sistema claro |
| Densidad / escaneo | 2.6 | Filas altas, hubs largos, formularios modales densos |
| Consistencia de layout | 2.8 | 3 familias de filas; `summary-*` copiado en 10 CSS |
| Legibilidad tipográfica | 3.0 | Labels en ALL CAPS + letter-spacing; números no tabulares |

## Qué revisamos (criterios)

| Dimensión | Preguntas clave |
|-----------|-----------------|
| **Espacio** | ¿Cuánto viewport queda para contenido? ¿Hay padding/margin redundante? |
| **Jerarquía** | ¿Se distingue título → dato → metadata → acción secundaria? |
| **Botones** | ¿La acción principal es visible sin abrir menús? ¿Hay una sola jerarquía primary/secondary? |
| **Información** | ¿Los listados se escanean en Z/F? ¿Los números alinean? ¿Los grupos tienen sentido? |
| **Consistencia** | ¿Hub, CRUD y detalle usan los mismos patrones de fila y resumen? |

Escala **1–5** (igual que UX/UI readiness): 5 = referencia; 3 = usable pero inconsistente; 1 = bloqueante para lectura o tarea.

## Métricas rápidas

| Señal | Valor | Impacto |
|-------|-------|---------|
| Familias de fila distintas | 3 (`crud-hub-row`, `crud-inset-row`, `crud-card-row`) | Media |
| Archivos con `.summary-*` duplicado | 10+ en `src/pages/*.css` | Alta |
| CRUD con acción crear solo en ⋮ | ~0 | Baja |
| `back-button-container` en TSX | 0 usos (CSS muerto) | Baja |
| Max-width hub → wide al entrar CRUD | 800px → 1200px | Media |
| Altura mínima fila hub vs CRUD | 56px vs 72px | Media |

## Hallazgos prioritarios

### P0 — Acciones primarias ocultas ✅ (2026-06-25)

CTA visible en Procesos de contratación, Metas y Valores. Los CRUD de sub-hubs Finanzas ya tenían botón primario; ⋮ reservado para secundarias/debug.

### P0 — Resúmenes numéricos inconsistentes ✅

`CrudSummaryStrip` + `crud-summary-strip` en capa compartida (`src/styles/domains/crud.css`). Pendiente: limpiar `.summary-*` legacy en CSS de página.

### P1 — Overhead vertical fijo ✅ (parcial)

Tokens `--layout-chrome-offset-top-mobile`, `--layout-chrome-offset-top-mobile-compact` y `--layout-chrome-min-height-mobile` en `index.css`. `AppPage.css` y Cuadernos móvil usan los tokens (sin compensar StatusBar oculto con padding de escritorio).

### P1 — Tres lenguajes visuales para listas ✅ (parcial)

`crud-hub-row` unificado en `crud-hub-rows.css` (64px). Filas inset y card siguen como familias distintas cuando aportan densidad/progreso.

### P1 — Hub Finanzas demasiado largo ✅

Hub principal reducido a ~10 entradas con sub-hubs `/finanzas/credito`, `/finanzas/cripto`, `/finanzas/ahorro`.

### P2 — Labels de resumen en ALL CAPS ✅ (parcial)

`crud-summary-strip-label` en sentence case. Títulos de aside/módulos en hubs (`hub-dashboard.css`) sin uppercase.

### P2 — `settings-row-*` no está en capa compartida ✅

Migrado a `crud-hub-row` en `crud-hub-rows.css`. Layout de dashboard hub en `hub-dashboard.css` (Finanzas, Trabajo, Tiempo, Registros).

### P2 — Modales de formulario densos

Transacciones: toggles condicionales (deuda, tarjeta, deudor, ahorro) en un solo scroll. Sin agrupación visual “Origen del pago” / “Clasificación”.

**Fix sugerido:** secciones con `glass-group` + headers; progressive disclosure.

### P3 — Ancho hub vs CRUD

Desktop: hubs a 800px, CRUD a 1200px. Salto brusco al navegar; listas wide desperdician espacio en hubs.

### P3 — Botones ad hoc

Coexisten: `btn-base`, `finanzas-add-transaction-button`, `empty-state-cta`, `finanzas-stats-retry-button`, items de dropdown. `ajustes-primary-button` migrado; `ajustes-danger-button` es extensión soft sobre `btn-base`.

## Pantallas de referencia (space)

| Pantalla | Ruta | Por qué |
|----------|------|---------|
| Home | `/` | Grid equilibrado, poca chrome, escaneo rápido |
| Login | `/login` | Un foco, un formulario, espacio generoso |
| Ajustes | `/ajustes` | Acciones destructivas con copy + botón debajo (claro) |

## Pantallas con mayor deuda de espacio

| Pantalla | Ruta | Issue principal |
|----------|------|-----------------|
| Finanzas hub | `/finanzas` | CTA enorme + lista larga + resumen compite |
| Transacciones | `/finanzas/transacciones` | Strip + CTA visible; filas inset en glass-group |
| Deudas / Me Deben | `/finanzas/deudas`, `/me-deben` | Strip + CTA; filas card con progreso |
| Actividades | `/trabajo/actividades` | CSS masivo; layout único |
| Contratos | `/trabajo/contratos` | Idem |

## Relación con otras auditorías

| Auditoría | Score | Gap que Space Audit cubre |
|-----------|:-----:|---------------------------|
| UI Readiness | 4.1 | “Se ve bien” ≠ “se entiende rápido” |
| UX Readiness | 3.9 | Errores/toasts OK; layout de tareas no |
| **Space Audit** | **2.7** | Espacio, botones visibles, lectura de datos |

## Roadmap sugerido

1. ~~**P0** — CTA visible en CRUD~~ ✅
2. ~~**P0** — `crud-summary-strip` compartido~~ ✅
3. ~~**P1** — Unificar filas hub + CRUD (altura, padding)~~ ✅ parcial
4. ~~**P1** — Recortar chrome vertical (tokens layout)~~ ✅ parcial
5. ~~**P2** — Hub rows + dashboard layout compartidos; hub Finanzas acortado~~ ✅
6. **P2** — Secciones en modales largos (Transacciones)
7. **P3** — Ancho hub vs CRUD; limpiar `.summary-*` legacy en page CSS

## Secciones auditadas

| Sección | Ruta | Documento | Score Space | Estado |
|---------|------|-----------|:-----------:|--------|
| **Login** | `/login` | [login.md](./login.md) | **5.0** | ✅ Auditado 2026-06-22 |
| **Home** | `/` | [home.md](./home.md) | **5.0** | ✅ Auditado 2026-06-22 |
| **Finanzas hub** | `/finanzas` | [finanzas.md](./finanzas.md) | **4.0** | ✅ Auditado 2026-06-22 |
| **Transacciones** | `/finanzas/transacciones` | [transacciones.md](./transacciones.md) | **4.2** | ✅ Auditado 2026-06-22 |
| **Cuentas** | `/finanzas/cuentas` | [cuentas.md](./cuentas.md) | **4.0** | ✅ Auditado 2026-06-22 |
| **Deudas** | `/finanzas/deudas` | [deudas.md](./deudas.md) | **3.9** | ✅ Auditado 2026-06-22 |
| **Presupuestos** | `/finanzas/presupuestos` | [presupuestos.md](./presupuestos.md) | **4.0** | ✅ Auditado 2026-06-22 |
| **Me Deben** | `/finanzas/me-deben` | [me-deben.md](./me-deben.md) | **3.9** | ✅ Auditado 2026-06-22 |
| **Tarjetas de crédito** | `/finanzas/tarjetas-credito` | [tarjetas-credito.md](./tarjetas-credito.md) | **3.9** | ✅ Auditado 2026-06-22 |
| **Tarjetas de débito** | `/finanzas/tarjetas-debito` | [tarjetas-debito.md](./tarjetas-debito.md) | **4.0** | ✅ Auditado 2026-06-22 |
| **Subscripciones** | `/finanzas/subscripciones` | [subscripciones.md](./subscripciones.md) | **4.0** | ✅ Auditado 2026-06-22 |
| **CDTs** | `/finanzas/cdts` | [cdts.md](./cdts.md) | **4.0** | ✅ Auditado 2026-06-22 |
| **Inflación** | `/finanzas/inflacion` | [inflacion.md](./inflacion.md) | **3.8** | ✅ Auditado 2026-06-22 |
| **Sub-hub ahorro** | `/finanzas/ahorro` | [ahorro.md](./ahorro.md) | **4.0** | ✅ Auditado 2026-06-22 |
| **Cripto Wallet** | `/finanzas/cripto-wallet` | [cripto-wallet.md](./cripto-wallet.md) | **4.0** | ✅ Auditado 2026-06-22 |
| **Mi Cripto** | `/finanzas/cripto-transacciones` | [cripto-transacciones.md](./cripto-transacciones.md) | **3.9** | ✅ Auditado 2026-06-22 |
| **Vendedores cripto** | `/finanzas/crypto-vendors` | [crypto-vendors.md](./crypto-vendors.md) | **3.7** | ✅ Auditado 2026-06-22 |
| **Sub-hub cripto** | `/finanzas/cripto` | [cripto.md](./cripto.md) | **4.0** | ✅ Auditado 2026-06-22 |
| **Proyectos** | `/finanzas/proyectos` | [proyectos.md](./proyectos.md) | **4.0** | ✅ Auditado 2026-06-22 |
| **Listas de mercado** | `/finanzas/listas-mercado` | [listas-mercado.md](./listas-mercado.md) | **4.0** | ✅ Auditado 2026-06-22 |
| **Diseñador presupuestos** | `/finanzas/diseñador-presupuestos` | [disenador-presupuestos.md](./disenador-presupuestos.md) | **3.8** | ✅ Auditado 2026-06-22 |
| **Utilidades hub** | `/registros` | [registros.md](./registros.md) | **3.8** | ✅ Auditado 2026-06-22 |
| **Cuadernos** | `/registros/cuadernos` | [cuadernos.md](./cuadernos.md) | **4.0** | ✅ Auditado 2026-06-22 |
| **Secretos** | `/registros/secretos` | [secretos.md](./secretos.md) | **4.0** | ✅ Auditado 2026-06-22 |
| **Archivos** | `/registros/archivos` | [archivos.md](./archivos.md) | **4.0** | ✅ Auditado 2026-06-22 |
| **Empleados** | `/registros/empleados` | [empleados.md](./empleados.md) | **3.8** | ✅ Auditado 2026-06-22 |
| **Vehículos** | `/registros/vehiculos` | [vehiculos.md](./vehiculos.md) | **3.8** | ✅ Auditado 2026-06-22 |
| **Patrimonio** | `/registros/patrimonio` | [patrimonio.md](./patrimonio.md) | **3.8** | ✅ Auditado 2026-06-22 |
| **Calculadora** | `/registros/calculadora` | [calculadora.md](./calculadora.md) | **4.0** | ✅ Auditado 2026-06-23 |
| **Generador contraseñas** | `/registros/generador-contrasenas` | [generador-contrasenas.md](./generador-contrasenas.md) | **3.6** | ✅ Auditado 2026-06-22 |
| **Lifestyle hub** | `/tiempo` | [tiempo.md](./tiempo.md) | **3.8** | ✅ Auditado 2026-06-22 |
| **Fechas** | `/tiempo/fechas` | [fechas.md](./fechas.md) | **3.9** | ✅ Auditado 2026-06-22 |
| **Rutinas** | `/tiempo/rutinas` | [rutinas.md](./rutinas.md) | **4.0** | ✅ Auditado 2026-06-22 |
| **Mi Día** | `/tiempo/mi-dia` | [mi-dia.md](./mi-dia.md) | **3.8** | ✅ Auditado 2026-06-22 |
| **Mi Diario** | `/tiempo/mi-diario` | [mi-diario.md](./mi-diario.md) | **4.0** | ✅ Auditado 2026-06-22 |

**Hub Tiempo:** todas las pantallas enlazadas auditadas (2026-06-22).

## Changelog

| Fecha | Cambio |
|-------|--------|
| 2026-06-22 | Hub Tiempo completo: Fechas, Rutinas, Mi Día, Mi Diario |
| 2026-06-22 | Hub Registros completo: 6 CRUD strip+CTA, 2 herramientas |
| 2026-06-22 | Sub-hub ahorro: CDTs 4.0, Inflación 3.8 |
| 2026-06-22 | Subscripciones 4.0 — cierra sub-hub crédito |
| 2026-06-22 | Finanzas hub 4.0/5 — sub-hubs, chrome tokens, crud-summary-strip |
| 2026-06-22 | Finanzas hub Space 3.5/5 — hub-summary, btn-submit |
| 2026-06-22 | Home Space P4/P5 — footer fijo mobile, paridad Login |
| 2026-06-22 | Home Space 5/5 — shell inmersivo sin StatusBar/Footer en / |
| 2026-06-22 | Home Space 4.9/5 — hub-*, logout en footer |
| 2026-06-22 | Login Space 5/5 — auth-*, form-alert-banner, sin Login.css |
| 2026-06-22 | Auditoría inicial + ruta `/space-audit` |
