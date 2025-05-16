// Estados posibles para un prospecto
export type LeadStatus = 
  | 'not_contacted'   // Nuevo, sin interacción
  | 'contacted'       // Se estableció un primer contacto (llamada, email, etc.)
  | 'appointment_set' // Se agendó una cita o reunión
  | 'proposal_sent'   // Se envió una cotización o propuesta formal
  | 'converted'       // Se convirtió en cliente (se contrató una póliza)
  | 'lost';           // Se perdió el interés o eligió otra opción

// Tipo para una entrada en el historial/timeline del prospecto
export interface LeadTimelineEntry {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'status_change'; // Tipo de interacción
  date: string; // Fecha ISO 8601
  notes: string; // Descripción o resumen
  actor?: string; // Quién realizó la acción (Asesor, Sistema)
  newStatus?: LeadStatus; // Si fue un cambio de estado
}

// Interfaz principal para un Prospecto (Lead)
export interface Lead {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  status: LeadStatus;
  source?: string; // Origen (Referido, Web, Evento, etc.)
  assignedAdvisor?: string; // Asesor asignado
  lastContactDate?: string; // Fecha ISO 8601 del último contacto
  nextActionDate?: string; // Fecha ISO 8601 para la próxima acción planeada (seguimiento, cita)
  createdAt: string; // Fecha ISO 8601 de creación
  potentialValue?: number; // Valor estimado (opcional)
  interestLevel?: 'low' | 'medium' | 'high'; // Nivel de interés (opcional)
  timeline?: LeadTimelineEntry[]; // Historial de interacciones
} 