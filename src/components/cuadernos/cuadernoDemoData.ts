import { createEmptyDocument, plainTextToDocument, serializeDocument } from './cuadernoDocument'

export const DEMO_CUADERNO_NOTES = [
  {
    title: 'Cuaderno de bienvenida',
    content: serializeDocument(
      plainTextToDocument(
        'Bienvenido a Cuadernos\n\nEscribe con bloques: títulos, listas y tareas.\n- Primer punto\n- Segundo punto\n- [ ] Tarea pendiente'
      )
    ),
  },
  {
    title: 'Ideas para el proyecto',
    content: serializeDocument(
      plainTextToDocument(
        'Ideas clave\n## Producto\n- Implementar editor por bloques\n- Mejorar la UI\n## Técnico\n- Guardar como JSON en content\n- Exportar a XML'
      )
    ),
  },
  {
    title: 'Recordatorios importantes',
    content: serializeDocument(
      plainTextToDocument('Recordar:\n1. Revisar el código\n2. Hacer commit\n3. Deploy a producción')
    ),
  },
  {
    title: 'Notas de reunión',
    content: serializeDocument(
      plainTextToDocument(
        'Reunión del día de hoy\n- Discutimos nuevas features\n- Acordamos timeline\n- Próxima reunión: viernes'
      )
    ),
  },
  {
    title: 'Lista de tareas',
    content: serializeDocument(
      plainTextToDocument('Tareas pendientes:\n- [ ] Tarea 1\n- [ ] Tarea 2\n- [x] Tarea 3 (completada)')
    ),
  },
  {
    title: 'Cuaderno vacío (plantilla)',
    content: serializeDocument(createEmptyDocument()),
  },
]
