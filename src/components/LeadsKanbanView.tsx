import React from 'react';
import { Lead, LeadStatus } from '../types/lead';
import { LeadCard } from './LeadCard.tsx';
import { leadStatusConfig } from './LeadBadges.tsx'; // Importar config para los títulos
import clsx from 'clsx';

// Definir el orden deseado de las columnas
const KANBAN_COLUMN_ORDER: LeadStatus[] = [
  'not_contacted',
  'contacted',
  'appointment_set',
  'proposal_sent',
  'converted',
  'lost'
];

interface LeadsKanbanViewProps {
  leads: Lead[]; // Recibe los prospectos ya filtrados
  onLeadDrop: (leadId: string, newStatus: LeadStatus) => void; // Función para manejar el drop
}

export const LeadsKanbanView: React.FC<LeadsKanbanViewProps> = ({ leads, onLeadDrop }) => {

  // Agrupar prospectos por estado
  const leadsByStatus = React.useMemo(() => {
    const grouped: { [key in LeadStatus]?: Lead[] } = {};
    for (const status of KANBAN_COLUMN_ORDER) {
        grouped[status] = []; // Inicializar todas las columnas
    }
    leads.forEach(lead => {
      if (grouped[lead.status]) {
        grouped[lead.status]!.push(lead);
      } else {
        // Si por alguna razón un lead tiene un status no esperado, 
        // podríamos ponerlo en una columna "Otros" o ignorarlo.
        // Por ahora, lo ignoramos si no está en KANBAN_COLUMN_ORDER.
      }
    });
    return grouped;
  }, [leads]);

  return (
    <div className="flex space-x-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
      {KANBAN_COLUMN_ORDER.map(status => {
        const columnLeads = leadsByStatus[status] || [];
        const config = leadStatusConfig[status]; // Usar config importado

        const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
          e.preventDefault(); // Necesario para permitir el drop
          e.dataTransfer.dropEffect = "move";
        };

        const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          const leadId = e.dataTransfer.getData('leadId');
          if (leadId) {
            onLeadDrop(leadId, status);
          }
        };

        return (
          <div 
            key={status} 
            className="flex-shrink-0 w-72 bg-gray-100 dark:bg-gray-800/50 rounded-lg shadow"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {/* Cabecera de la columna */}
            <div className={clsx(
              "p-3 border-b flex justify-between items-center sticky top-0 z-10 rounded-t-lg",
              "border-gray-200 dark:border-gray-700",
              "bg-gray-100 dark:bg-gray-800/50"
            )}>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                 {/* Icono opcional: <config.icon className="w-4 h-4" /> */} 
                {config.label}
              </h3>
              <span className="text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                {columnLeads.length}
              </span>
            </div>
            {/* Contenedor de tarjetas (scrollable si es necesario) */}
            <div className="p-2 space-y-0 overflow-y-auto max-h-[calc(100vh-250px)]"> {/* Ajustar max-h según necesidad */} 
              {columnLeads.length > 0 ? (
                 columnLeads.map(lead => (
                  <LeadCard key={lead.id} lead={lead} />
                ))
              ) : (
                <p className="text-center text-xs text-gray-400 dark:text-gray-500 py-4 px-2">
                    No hay prospectos en este estado.
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}; 