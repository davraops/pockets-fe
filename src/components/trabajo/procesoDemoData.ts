function isoDateDaysFromToday(daysFromToday: number): string {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + daysFromToday)
  return date.toISOString().split('T')[0]
}

export interface DemoHiringProcessPayload {
  name: string
  data: Record<string, unknown>
}

/** Demo hiring processes with dates anchored to today for agenda/hub testing. */
export function buildDemoHiringProcesses(): DemoHiringProcessPayload[] {
  return [
    {
      name: 'Desarrollador Senior Full Stack - TechCorp',
      data: {
        contact: 'María González',
        contactVia: 'LinkedIn',
        company: 'TechCorp Inc.',
        status: 'Abierto',
        applicationDate: isoDateDaysFromToday(-18),
        roleDescription:
          'Desarrollador Senior Full Stack para proyectos de alta escala. React, Node.js y arquitecturas cloud.',
        salaryRange: { min: 8000, max: 12000, currency: 'USD' },
        negotiatedSalary: { amount: 10000, currency: 'USD' },
        benefits: ['Seguro médico', '401k', 'PTO ilimitado', 'Work from home'],
        hiringSteps: [
          { step: 'Aplicación enviada', completed: true },
          { step: 'Screening inicial', completed: true },
          { step: 'Entrevista técnica', completed: true },
          { step: 'Entrevista cultural', completed: false },
          { step: 'Oferta recibida', completed: false },
        ],
        interviewDates: [
          { date: isoDateDaysFromToday(1), time: '14:00' },
          { date: isoDateDaysFromToday(5), time: '15:30' },
        ],
        interactions: [
          { date: isoDateDaysFromToday(-12), description: 'Contacto inicial por LinkedIn' },
          { date: isoDateDaysFromToday(-8), description: 'Seguimiento por email' },
          { date: isoDateDaysFromToday(-3), description: 'Envié portafolio y CV actualizado' },
        ],
        hasAgency: false,
        payToLeadingZen: true,
      },
    },
    {
      name: 'Frontend Developer - StartupXYZ',
      data: {
        contact: 'Carlos Ramírez',
        contactVia: 'Email',
        company: 'StartupXYZ',
        status: 'Abierto',
        applicationDate: isoDateDaysFromToday(-25),
        roleDescription: 'Frontend con React y TypeScript para startup en crecimiento.',
        salaryRange: { min: 5000, max: 7000, currency: 'USD' },
        negotiatedSalary: { amount: 6000, currency: 'USD' },
        benefits: ['Seguro médico', 'Bonos por proyecto', 'Equidad'],
        hiringSteps: [
          { step: 'Aplicación enviada', completed: true },
          { step: 'Prueba técnica', completed: true },
          { step: 'Entrevista con el equipo', completed: false },
        ],
        interviewDates: [{ date: isoDateDaysFromToday(3), time: '10:00' }],
        interactions: [
          { date: isoDateDaysFromToday(-20), description: 'Contacto vía agencia Talent Recruiters' },
          { date: isoDateDaysFromToday(-14), description: 'Llamada con reclutador' },
          { date: isoDateDaysFromToday(-2), description: 'Confirmaron entrevista' },
        ],
        hasAgency: true,
        agencyName: 'Talent Recruiters',
        payToLeadingZen: false,
      },
    },
    {
      name: 'Backend Engineer - CloudSolutions',
      data: {
        contact: 'Ana Martínez',
        contactVia: 'WhatsApp',
        company: 'CloudSolutions',
        status: 'Abierto',
        applicationDate: isoDateDaysFromToday(-10),
        roleDescription: 'Backend con microservicios, AWS, Docker y Kubernetes.',
        salaryRange: { min: 9000, max: 13000, currency: 'USD' },
        benefits: ['Seguro médico premium', 'Learning budget', '25 días de vacaciones'],
        hiringSteps: [
          { step: 'Aplicación enviada', completed: true },
          { step: 'Screening inicial', completed: true },
          { step: 'Entrevista técnica', completed: false },
        ],
        interviewDates: [{ date: isoDateDaysFromToday(7), time: '16:00' }],
        interactions: [
          { date: isoDateDaysFromToday(-9), description: 'Contacto inicial por WhatsApp' },
          { date: isoDateDaysFromToday(-4), description: 'Reunión virtual con el equipo' },
        ],
        hasAgency: false,
        payToLeadingZen: true,
      },
    },
    {
      name: 'DevOps Engineer - DataTech',
      data: {
        contact: 'Roberto Silva',
        contactVia: 'LinkedIn',
        company: 'DataTech',
        status: 'Abierto',
        applicationDate: isoDateDaysFromToday(-40),
        roleDescription: 'DevOps: Terraform, Ansible, CI/CD y monitoreo.',
        salaryRange: { min: 7000, max: 10000, currency: 'USD' },
        negotiatedSalary: { amount: 8500, currency: 'USD' },
        benefits: ['Seguro médico', 'Stock options', 'Home office'],
        hiringSteps: [
          { step: 'Aplicación enviada', completed: true },
          { step: 'Screening inicial', completed: true },
          { step: 'Entrevista técnica', completed: true },
          { step: 'Entrevista con CTO', completed: true },
          { step: 'Oferta recibida', completed: true },
          { step: 'Negociación', completed: false },
        ],
        interviewDates: [
          { date: isoDateDaysFromToday(-2), time: '11:00' },
          { date: isoDateDaysFromToday(10), time: '14:00' },
        ],
        interactions: [
          { date: isoDateDaysFromToday(-35), description: 'Contacto por agencia Tech Headhunters' },
          { date: isoDateDaysFromToday(-16), description: 'Primera llamada con reclutador' },
          { date: isoDateDaysFromToday(-1), description: 'Recibí oferta preliminar' },
        ],
        hasAgency: true,
        agencyName: 'Tech Headhunters',
        payToLeadingZen: true,
      },
    },
    {
      name: 'Mobile Developer - AppStudio',
      data: {
        contact: 'Laura Fernández',
        contactVia: 'Email',
        company: 'AppStudio',
        status: 'Cerrado',
        applicationDate: isoDateDaysFromToday(-60),
        roleDescription: 'Mobile iOS/Android con React Native.',
        salaryRange: { min: 6000, max: 9000, currency: 'USD' },
        benefits: ['Seguro médico', 'PTO flexible', 'Conference budget'],
        hiringSteps: [
          { step: 'Aplicación enviada', completed: true },
          { step: 'Portfolio review', completed: true },
          { step: 'Entrevista técnica', completed: false },
        ],
        interviewDates: [{ date: isoDateDaysFromToday(-30), time: '13:00' }],
        interactions: [
          { date: isoDateDaysFromToday(-45), description: 'Contacto inicial por email' },
          { date: isoDateDaysFromToday(-32), description: 'Llamada sobre el rol' },
        ],
        hasAgency: false,
        payToLeadingZen: false,
      },
    },
  ]
}
