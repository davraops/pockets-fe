import type { EmployeeData } from './employeeTypes'

export const DEMO_EMPLOYEES: Array<{ name: string; data: EmployeeData }> = [
  {
    name: 'Juan Pérez',
    data: {
      identification: '1234567890',
      position: 'Desarrollador Senior',
      salary: 5000000,
      contractType: 'Tiempo Completo',
      startDate: '2023-01-15',
      department: 'Tecnología',
      email: 'juan.perez@empresa.com',
      phone: '+57 300 123 4567',
      address: 'Calle 123 #45-67, Bogotá',
      emergencyContact: {
        name: 'María Pérez',
        phone: '+57 300 987 6543',
        relationship: 'Esposa',
      },
      vacationDaysAvailable: 8,
      vacations: [
        {
          startDate: '2024-01-15',
          endDate: '2024-01-19',
          days: 5,
          notes: 'Vacaciones de inicio de año',
        },
        {
          startDate: '2024-06-10',
          endDate: '2024-06-12',
          days: 3,
          notes: 'Puente festivo',
        },
      ],
      permissions: [
        { date: '2024-02-14', reason: 'Cita médica', hours: 2, notes: 'Control de rutina' },
        { date: '2024-03-20', reason: 'Trámite personal', hours: 4 },
      ],
    },
  },
  {
    name: 'Ana García',
    data: {
      identification: '0987654321',
      position: 'Diseñadora UX',
      salary: 4500000,
      contractType: 'Tiempo Completo',
      startDate: '2023-03-20',
      department: 'Diseño',
      email: 'ana.garcia@empresa.com',
      phone: '+57 300 555 1234',
      address: 'Carrera 78 #12-34, Medellín',
      emergencyContact: {
        name: 'Carlos García',
        phone: '+57 300 555 5678',
        relationship: 'Hermano',
      },
      vacationDaysAvailable: 12,
      vacations: [
        {
          startDate: '2024-07-01',
          endDate: '2024-07-10',
          days: 10,
          notes: 'Vacaciones de verano',
        },
      ],
      permissions: [
        { date: '2024-04-15', reason: 'Cita odontológica', hours: 3 },
        { date: '2024-05-20', reason: 'Asunto familiar', hours: 1.5, notes: 'Reunión escolar' },
        { date: '2024-08-10', reason: 'Trámite bancario', hours: 2 },
      ],
    },
  },
  {
    name: 'Luis Rodríguez',
    data: {
      identification: '1122334455',
      position: 'Gerente de Proyectos',
      salary: 6000000,
      contractType: 'Tiempo Completo',
      startDate: '2022-11-10',
      department: 'Operaciones',
      email: 'luis.rodriguez@empresa.com',
      phone: '+57 300 777 8888',
      address: 'Avenida 56 #78-90, Cali',
      emergencyContact: {
        name: 'Laura Rodríguez',
        phone: '+57 300 777 9999',
        relationship: 'Madre',
      },
      vacationDaysAvailable: 15,
      vacations: [
        {
          startDate: '2024-12-20',
          endDate: '2024-12-31',
          days: 12,
          notes: 'Vacaciones de fin de año',
        },
      ],
      permissions: [
        { date: '2024-01-10', reason: 'Reunión médica', hours: 4, notes: 'Especialista' },
      ],
    },
  },
]
