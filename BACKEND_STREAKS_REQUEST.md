# Solicitud al Backend: Campos de Streaks en GET /routines

## Problema Actual
El frontend está calculando los streaks (rachas) de las rutinas en el cliente, lo cual es:
- Ineficiente (requiere cargar todos los completados)
- Propenso a errores (lógica compleja en el frontend)
- Difícil de mantener (cambios en la lógica requieren actualizar el frontend)

## Solución Propuesta
Agregar campos calculados de streaks directamente en la respuesta de `GET /routines`.

## Campos a Agregar

### En cada objeto `routine` de la respuesta:

```json
{
  "id": "uuid-here",
  "title": "Ejercicio matutino",
  "frequency": "daily",
  "scheduled_time": "07:00:00",
  "is_active": true,
  // ... campos existentes ...
  
  // 🆕 NUEVOS CAMPOS DE STREAKS:
  "current_streak": 14,           // Racha actual (días consecutivos desde hoy/ayer hacia atrás)
  "longest_streak": 30,           // Racha más larga histórica
  "last_completed_date": "2024-02-15",  // Última fecha de completado (YYYY-MM-DD o null)
  "total_completions": 45,         // Total de completados de la rutina
  "completions_this_month": 14     // Completados en el mes actual
}
```

## Lógica de Cálculo de Streaks

### `current_streak` (Racha Actual)
- **Definición**: Días consecutivos desde hoy o ayer hacia atrás
- **Reglas**:
  - Si hay completado **hoy** → contar desde hoy hacia atrás
  - Si no hay completado hoy pero hay completado **ayer** → contar desde ayer hacia atrás
  - Si no hay completado hoy ni ayer → `current_streak = 0`
  
- **Por frecuencia**:
  - **Diarias (`daily`)**: Cuenta todos los días consecutivos. Cualquier día sin completado rompe el streak.
  - **Semanales (`weekly`)**: Solo cuenta días válidos según `days_of_week`. Si hoy no es un día válido, busca el último día válido completado.
  - **Mensuales (`monthly`)**: Solo cuenta el día del mes según `day_of_month`. Si hoy no es el día del mes, busca el último mes con completado.

### `longest_streak` (Racha Más Larga)
- **Definición**: El mayor número de días consecutivos completados en toda la historia de la rutina
- **Reglas**:
  - Recorre todos los completados ordenados cronológicamente
  - Para **diarias**: cuenta solo si la diferencia es exactamente 1 día
  - Para **semanales**: cuenta si están en días válidos consecutivos (sin saltar días válidos intermedios)
  - Para **mensuales**: cuenta si son meses consecutivos

## Ejemplo de Respuesta Completa

```json
{
  "count": 2,
  "routines": [
    {
      "id": "uuid-here",
      "title": "Ejercicio matutino",
      "description": "30 minutos de ejercicio cada mañana",
      "frequency": "daily",
      "days_of_week": null,
      "day_of_month": null,
      "scheduled_time": "07:00:00",
      "duration_minutes": 30,
      "start_date": "2024-02-01",
      "end_date": null,
      "is_active": true,
      "color": "#FF5733",
      "target_count": 1,
      "created_at": "2024-01-15T00:00:00.000Z",
      "updated_at": "2024-01-15T00:00:00.000Z",
      
      // 🆕 Campos de streaks
      "current_streak": 14,
      "longest_streak": 30,
      "last_completed_date": "2024-02-15",
      "total_completions": 45,
      "completions_this_month": 14
    },
    {
      "id": "uuid-here-2",
      "title": "Gimnasio",
      "frequency": "weekly",
      "days_of_week": [1, 3, 5],  // Lunes, Miércoles, Viernes
      "scheduled_time": "18:00:00",
      "is_active": true,
      
      // 🆕 Campos de streaks
      "current_streak": 6,        // 6 sesiones consecutivas (últimas 2 semanas)
      "longest_streak": 12,       // 12 sesiones consecutivas (4 semanas)
      "last_completed_date": "2024-02-14",  // Último miércoles
      "total_completions": 24,
      "completions_this_month": 6
    },
    {
      "id": "uuid-here-3",
      "title": "Revisión de gastos",
      "frequency": "monthly",
      "day_of_month": 1,
      "scheduled_time": "09:00:00",
      "is_active": true,
      
      // 🆕 Campos de streaks
      "current_streak": 2,        // 2 meses consecutivos
      "longest_streak": 5,        // 5 meses consecutivos
      "last_completed_date": "2024-02-01",
      "total_completions": 8,
      "completions_this_month": 1
    }
  ]
}
```

## Beneficios

1. **Rendimiento**: El backend puede calcular esto de forma eficiente con queries optimizadas
2. **Consistencia**: La lógica está centralizada en un solo lugar
3. **Simplicidad**: El frontend solo necesita mostrar los valores, no calcularlos
4. **Mantenibilidad**: Cambios en la lógica solo requieren actualizar el backend
5. **Precisión**: El backend tiene acceso completo a todos los datos y puede hacer cálculos más precisos

## Notas de Implementación

- Los campos deben ser calculados en tiempo real (no cacheados) para reflejar el estado actual
- Si una rutina no tiene completados, todos los campos de streaks deberían ser `0` o `null` según corresponda
- `last_completed_date` puede ser `null` si nunca se ha completado la rutina
- Los cálculos deben considerar la zona horaria del usuario o usar UTC consistente

## Prioridad

**Alta** - Esto simplificará significativamente el código del frontend y mejorará la experiencia del usuario al tener cálculos más precisos y rápidos.

