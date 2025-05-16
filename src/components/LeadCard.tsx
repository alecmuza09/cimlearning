import React from 'react';
import { Lead } from '../types/lead';
import clsx from 'clsx';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Mail, Phone, User, Calendar, DollarSign } from 'lucide-react';
import { LeadStatusBadge, InactivityAlert } from './LeadBadges.tsx';

interface LeadCardProps {
  lead: Lead;
  // onClick?: (lead: Lead) => void; // Para abrir detalles en el futuro
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead }) => {

  const formatDate = (dateString?: string) => {
    return dateString ? format(parseISO(dateString), 'dd MMM', { locale: es }) : '-';
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('leadId', lead.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div 
      draggable="true"
      onDragStart={handleDragStart}
      id={`lead-card-${lead.id}`}
      className={clsx(
        'p-3 mb-3 rounded-lg shadow-sm border transition-colors cursor-grab',
        'bg-white hover:bg-gray-50 border-gray-200',
        'dark:bg-gray-800 dark:hover:bg-gray-700/50 dark:border-gray-700'
      )}
      // onClick={() => onClick?.(lead)} // Habilitar cuando se implemente el modal de detalles
    >
      {/* Nombre y Estado */}
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-white truncate" title={lead.fullName}>
          {lead.fullName}
        </h4>
        {/* Alerta de inactividad si aplica */} 
        {(lead.status !== 'converted' && lead.status !== 'lost') && 
          <InactivityAlert lastContactDate={lead.lastContactDate} />
        }
      </div>

      {/* Badge de estado */}
      <div className="mb-3">
        <LeadStatusBadge status={lead.status} />
      </div>

      {/* Información clave */}
      <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
        {lead.assignedAdvisor && (
          <div className="flex items-center gap-1.5">
            <User className="w-3 h-3 flex-shrink-0" />
            <span>{lead.assignedAdvisor}</span>
          </div>
        )}
        {(lead.email || lead.phone) && (
          <div className="flex items-center gap-1.5">
             {lead.email ? <Mail className="w-3 h-3 flex-shrink-0" /> : <Phone className="w-3 h-3 flex-shrink-0" />}
             <span className="truncate">{lead.email || lead.phone}</span>
          </div>
        )}
         {lead.potentialValue && (
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3 h-3 flex-shrink-0" />
            <span>Valor: ${lead.potentialValue.toLocaleString()}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 pt-1">
           <Calendar className="w-3 h-3 flex-shrink-0" />
           <span>Creado: {formatDate(lead.createdAt)}</span>
           {lead.lastContactDate && <span className="ml-auto">Últ. Cont: {formatDate(lead.lastContactDate)}</span>}
        </div>
      </div>
      
      {/* Aquí podrían ir acciones rápidas en el futuro */}
    </div>
  );
}; 