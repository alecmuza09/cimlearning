import { Lead, LeadStatus } from '../types/lead';
import { subDays, formatISO } from 'date-fns';

const now = new Date();

export const exampleLeads: Lead[] = [
  {
    id: 'lead1',
    fullName: 'Laura Martínez Vega',
    email: 'laura.martinez@email.com',
    phone: '+52 55 1234 5678',
    status: 'contacted',
    source: 'Referido',
    assignedAdvisor: 'Ana López',
    lastContactDate: formatISO(subDays(now, 3)), // Contactada hace 3 días
    nextActionDate: formatISO(new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)), // Próxima acción en 2 días
    createdAt: formatISO(subDays(now, 5)),
    timeline: [
      { id: 't1-1', type: 'note', date: formatISO(subDays(now, 5)), notes: 'Prospecto referido por Juan Pérez.', actor: 'Ana López' },
      { id: 't1-2', type: 'call', date: formatISO(subDays(now, 3)), notes: 'Llamada inicial, mostró interés en GMM.', actor: 'Ana López' },
      { id: 't1-3', type: 'status_change', date: formatISO(subDays(now, 3)), notes: 'Estado cambiado a Contactado', actor: 'Ana López', newStatus: 'contacted' },
    ],
    potentialValue: 25000,
    interestLevel: 'medium',
  },
  {
    id: 'lead2',
    fullName: 'Roberto Sánchez Díaz',
    email: 'roberto.sanchez@email.com',
    status: 'not_contacted',
    source: 'Formulario Web',
    assignedAdvisor: 'Carlos Marín',
    lastContactDate: undefined, // Aún no contactado
    nextActionDate: undefined,
    createdAt: formatISO(subDays(now, 1)), // Creado ayer
    timeline: [
        { id: 't2-1', type: 'note', date: formatISO(subDays(now, 1)), notes: 'Entró por formulario web, solicitando info de seguro de auto.', actor: 'Sistema' },
        { id: 't2-2', type: 'status_change', date: formatISO(subDays(now, 1)), notes: 'Estado inicial: No Contactado', actor: 'Sistema', newStatus: 'not_contacted' },
    ],
    interestLevel: 'high',
  },
  {
    id: 'lead3',
    fullName: 'Sofía Hernández Luna',
    phone: '+52 33 9876 5432',
    status: 'appointment_set',
    source: 'Llamada Fría',
    assignedAdvisor: 'Ana López',
    lastContactDate: formatISO(subDays(now, 7)), // Último contacto hace 7 días (cita agendada)
    nextActionDate: formatISO(new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)), // Cita mañana
    createdAt: formatISO(subDays(now, 10)),
    timeline: [
       { id: 't3-1', type: 'call', date: formatISO(subDays(now, 10)), notes: 'Primer contacto (llamada fría)', actor: 'Ana López' },
       { id: 't3-2', type: 'status_change', date: formatISO(subDays(now, 10)), notes: 'Estado cambiado a Contactado', actor: 'Ana López', newStatus: 'contacted' },
       { id: 't3-3', type: 'call', date: formatISO(subDays(now, 7)), notes: 'Llamada de seguimiento, se agendó cita.', actor: 'Ana López' },
       { id: 't3-4', type: 'status_change', date: formatISO(subDays(now, 7)), notes: 'Estado cambiado a Cita Agendada', actor: 'Ana López', newStatus: 'appointment_set' },
    ],
    potentialValue: 18000,
    interestLevel: 'medium',
  },
   {
    id: 'lead4',
    fullName: 'Miguel Ángel Torres',
    email: 'miguel.torres@email.com',
    status: 'proposal_sent',
    source: 'Evento Networking',
    assignedAdvisor: 'Carlos Marín',
    lastContactDate: formatISO(subDays(now, 15)), // Propuesta enviada hace 15 días
    nextActionDate: formatISO(subDays(now, 1)), // Debió dar seguimiento ayer
    createdAt: formatISO(subDays(now, 20)),
    timeline: [
        { id: 't4-1', type: 'meeting', date: formatISO(subDays(now, 20)), notes: 'Conocido en evento, interesado en seguro de vida.', actor: 'Carlos Marín' },
        { id: 't4-2', type: 'status_change', date: formatISO(subDays(now, 20)), notes: 'Estado cambiado a Contactado', actor: 'Carlos Marín', newStatus: 'contacted' },
        { id: 't4-3', type: 'email', date: formatISO(subDays(now, 15)), notes: 'Envío de propuesta detallada.', actor: 'Carlos Marín' },
        { id: 't4-4', type: 'status_change', date: formatISO(subDays(now, 15)), notes: 'Estado cambiado a Propuesta Enviada', actor: 'Carlos Marín', newStatus: 'proposal_sent' },
    ],
    potentialValue: 50000,
    interestLevel: 'high',
  },
  {
    id: 'lead5',
    fullName: 'Cliente Convertido Ejemplo',
    status: 'converted', // Ya es cliente
    source: 'Campaña Redes Sociales',
    assignedAdvisor: 'Ana López',
    lastContactDate: formatISO(subDays(now, 30)),
    createdAt: formatISO(subDays(now, 45)),
    timeline: [ /* ... historial ... */ ],
   },
   {
    id: 'lead6',
    fullName: 'Prospecto Perdido Ejemplo',
    status: 'lost', // Se perdió
    source: 'Referido',
    assignedAdvisor: 'Carlos Marín',
    lastContactDate: formatISO(subDays(now, 60)),
    createdAt: formatISO(subDays(now, 70)),
    timeline: [ /* ... historial ... */ ],
   }
]; 