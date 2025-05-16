import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import clsx from 'clsx';
import {
  UsersRound, // Icono para leads
  Search, Filter, PlusCircle, Eye, Edit, Trash, AlertCircle, Clock, Phone, Mail,
  ChevronUp, ChevronDown, CalendarClock, UserCheck, CircleSlash, Handshake, TrendingUp,
  List, LayoutGrid // Iconos para selector de vista
} from 'lucide-react';

// Importar tipos y datos
import { Lead, LeadStatus } from '../types/lead';
import { exampleLeads } from '../data/leads';
// Importar los componentes de badges desde el nuevo archivo
import { LeadStatusBadge, InactivityAlert } from '../components/LeadBadges.tsx';
// Importar la nueva vista Kanban
import { LeadsKanbanView } from '../components/LeadsKanbanView.tsx';

// Mapeo de estados a etiquetas y colores/iconos -> MOVIDO a LeadBadges.tsx
// const leadStatusConfig: Record<LeadStatus, { label: string; icon: React.ElementType; colorClasses: string }> = { ... };

// Componente para el badge de estado -> MOVIDO a LeadBadges.tsx
// const LeadStatusBadge: React.FC<{ status: LeadStatus }> = ({ status }) => { ... };

// Componente para la alerta de inactividad -> MOVIDO a LeadBadges.tsx
// const InactivityAlert: React.FC<{ lastContactDate?: string }> = ({ lastContactDate }) => { ... };


// Tipos para ordenamiento y vista
type LeadSortField = 'fullName' | 'status' | 'lastContactDate' | 'createdAt' | 'assignedAdvisor';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'list' | 'kanban'; // Nuevo tipo para la vista

export const Leads = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>(exampleLeads); // Usar estado para futura API
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'all'>('all');
  const [sortField, setSortField] = useState<LeadSortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('list'); // Estado para el modo de vista

  // Función para actualizar el estado del prospecto al hacer drop en Kanban
  const handleLeadStatusChange = (leadId: string, newStatus: LeadStatus) => {
    setLeads(prevLeads => 
      prevLeads.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus, lastContactDate: new Date().toISOString() } : lead
      )
    );
    // Aquí podrías añadir una llamada a la API para persistir el cambio
    console.log(`Prospecto ${leadId} movido a ${newStatus}`);
  };

  // Filtrado y Ordenamiento
  const processedLeads = useMemo(() => {
    let filtered = leads;

    // Filtrar por estado
    if (filterStatus !== 'all') {
      filtered = filtered.filter(lead => lead.status === filterStatus);
    }

    // Filtrar por término de búsqueda (nombre, email, teléfono, asesor)
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.fullName.toLowerCase().includes(lowerSearch) ||
        (lead.email && lead.email.toLowerCase().includes(lowerSearch)) ||
        (lead.phone && lead.phone.includes(lowerSearch)) || // Phone doesn't need lowercase
        (lead.assignedAdvisor && lead.assignedAdvisor.toLowerCase().includes(lowerSearch))
      );
    }

    // Ordenar
    filtered.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      // Convertir fechas a objetos Date para comparar
      if (sortField === 'lastContactDate' || sortField === 'createdAt') {
         // Manejar fechas nulas/undefined para ordenamiento consistente
        valA = valA ? parseISO(valA).getTime() : (sortDirection === 'asc' ? Infinity : -Infinity);
        valB = valB ? parseISO(valB).getTime() : (sortDirection === 'asc' ? Infinity : -Infinity);
      } else {
          // Manejar valores null/undefined para otros campos
          valA = valA ?? (sortDirection === 'asc' ? '' : 'zzzzzzz'); // Strings al final/inicio
          valB = valB ?? (sortDirection === 'asc' ? '' : 'zzzzzzz');
      }

      let comparison = 0;
      if (valA < valB) {
        comparison = -1;
      } else if (valA > valB) {
        comparison = 1;
      }

      return sortDirection === 'asc' ? comparison : comparison * -1;
    });

    return filtered;
  }, [leads, searchTerm, filterStatus, sortField, sortDirection]);

  // Handler para cambiar ordenamiento
  const handleSort = (field: LeadSortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Helper para ícono de ordenamiento
  const SortIcon: React.FC<{ field: LeadSortField }> = ({ field }) => {
    if (field !== sortField) return <ChevronDown className="w-3 h-3 text-gray-400 dark:text-gray-500 opacity-50 group-hover:opacity-100" />;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  // Formatear fechas
  const formatDate = (dateString?: string) => {
    return dateString ? format(parseISO(dateString), 'dd/MM/yyyy', { locale: es }) : '-';
  }

  const openNewLeadModal = () => {
    // TODO: Implementar modal
    console.log('Abrir modal nuevo prospecto');
  };

  // Necesitamos leadStatusConfig para el filtro de select
  const leadStatusConfigForFilter: Record<LeadStatus | 'all', { label: string }> = {
    all: { label: 'Todos los Estados' },
    not_contacted: { label: 'No Contactado' },
    contacted: { label: 'Contactado' },
    appointment_set: { label: 'Cita Agendada' },
    proposal_sent: { label: 'Propuesta Enviada' },
    converted: { label: 'Convertido' },
    lost: { label: 'Perdido' },
  };

  return (
    <div className="space-y-6">
      {/* Cabecera y Acciones */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <UsersRound className="w-7 h-7" />
          Gestión de Prospectos
        </h1>
        {/* Contenedor para botones de acción y selector de vista */}
        <div className="flex items-center gap-4">
          {/* Selector de Vista */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                "p-1.5 rounded-md transition-colors",
                viewMode === 'list' 
                  ? 'bg-white dark:bg-gray-600 shadow text-primary dark:text-primary-light' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              )}
              title="Vista de Lista"
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={clsx(
                "p-1.5 rounded-md transition-colors",
                viewMode === 'kanban' 
                  ? 'bg-white dark:bg-gray-600 shadow text-primary dark:text-primary-light' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              )}
              title="Vista de Tablero (Kanban)"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>
          {/* Botón Nuevo Prospecto */}
          <button
            onClick={openNewLeadModal}
            className="btn-primary flex items-center gap-2 px-4 py-2 text-sm font-medium">
            <PlusCircle className="w-4 h-4" />
            Nuevo Prospecto
          </button>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md border dark:border-gray-700">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por nombre, email, teléfono, asesor..."
            className="w-full pl-9 pr-3 py-1.5 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-primary dark:focus:ring-primary-dark focus:border-primary dark:focus:border-primary-dark"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as LeadStatus | 'all')}
          className="text-sm border rounded-md p-1.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-primary dark:focus:ring-primary-dark focus:border-primary dark:focus:border-primary-dark"
        >
          {/* Usar el nuevo leadStatusConfigForFilter */} 
          {Object.entries(leadStatusConfigForFilter).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
      </div>

      {/* Contenido Principal: Lista o Kanban */}
      {viewMode === 'list' ? (
          // ---- Vista de Lista (Tabla) ----
          <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {/* Columna Nombre */} 
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button onClick={() => handleSort('fullName')} className="group inline-flex items-center gap-1">
                      Nombre
                      <SortIcon field="fullName" />
                    </button>
                  </th>
                  {/* Columna Estado */} 
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <button onClick={() => handleSort('status')} className="group inline-flex items-center gap-1">
                       Estado
                       <SortIcon field="status" />
                    </button>
                  </th>
                  {/* Columna Último Contacto */}
                   <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                     <button onClick={() => handleSort('lastContactDate')} className="group inline-flex items-center gap-1">
                        Último Contacto / Alerta
                       <SortIcon field="lastContactDate" />
                     </button>
                   </th>
                   {/* Columna Fecha Creación */} 
                   <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                     <button onClick={() => handleSort('createdAt')} className="group inline-flex items-center gap-1">
                       Fecha Creación
                       <SortIcon field="createdAt" />
                     </button>
                   </th>
                   {/* Columna Asesor Asignado */} 
                   <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                     <button onClick={() => handleSort('assignedAdvisor')} className="group inline-flex items-center gap-1">
                       Asesor
                       <SortIcon field="assignedAdvisor" />
                     </button>
                   </th>
                   {/* Columna Acciones */} 
                   <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Acciones
                   </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {processedLeads.length > 0 ? (
                  processedLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{lead.fullName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{lead.email || lead.phone}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <LeadStatusBadge status={lead.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                           {formatDate(lead.lastContactDate)}
                           {(lead.status !== 'converted' && lead.status !== 'lost') && 
                             <InactivityAlert lastContactDate={lead.lastContactDate} />
                           } 
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(lead.createdAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {lead.assignedAdvisor || '-'}
                      </td>
                       <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-1">
                          {/* Aquí irían botones de acción: Ver Timeline, Editar, Cambiar Estado, Borrar, etc. */}
                          <button className="p-1 rounded text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-primary dark:hover:text-primary-dark transition-colors" title="Ver Detalles/Timeline">
                             <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1 rounded text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Editar Prospecto">
                             <Edit className="w-4 h-4" />
                          </button>
                           {/* <button className="p-1 rounded text-gray-400 dark:text-gray-500 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Eliminar Prospecto">
                             <Trash className="w-4 h-4" />
                           </button> */} 
                       </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                      No se encontraron prospectos con los filtros actuales.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      ) : (
          // ---- Vista de Tablero (Kanban) ----
          <LeadsKanbanView leads={processedLeads} onLeadDrop={handleLeadStatusChange} />
      )}
    </div>
  );
};

export default Leads; // Exportar como default si se usa lazy loading 