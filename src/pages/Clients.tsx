import React, { useState, useMemo } from 'react';
import {
    Plus, Search, Filter, MoreHorizontal, Grid, List, ChevronDown, ChevronUp,
    User, FileText, CalendarClock, Clock, AlertTriangle,
    Eye, Edit, PlusSquare, Upload, Send, Trash,
    Award
} from 'lucide-react';
import { Modal } from '../components/Modal';
import clsx from 'clsx';
import NewClientForm from '../components/NewClientForm';
import { format } from 'date-fns';
import { es as esLocale } from 'date-fns/locale/es';

type ClientStatus = 'active' | 'inactive' | 'prospect';

export interface Client {
  id: string;
  internal_id: string;
  name: string;
  rfc: string;
  email: string;
  phone: string;
  status: ClientStatus;
  policyCount: number;
  assignedAdvisor: string;
  insuranceCompany: string;
  alerts: {
    pendingPayments: boolean;
    expiredDocs: boolean;
    homonym: boolean;
  };
  policyStartDate?: string | Date;
  policyEndDate?: string | Date;
  paymentEndDate?: string | Date;
  paymentFrequency?: 'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'single';
  preferredPaymentMethod?: 'transfer' | 'cash' | 'card' | 'direct_debit';
  ineDocumentUrl?: string;
  lastInteraction?: Date;
  nextRenewal?: Date;
  isIntegral?: boolean;
}

export const exampleClients: Client[] = [
  { id: '1', internal_id: 'CLI001', name: 'Juan Pérez García', rfc: 'PEJG800101ABC', email: 'juan.perez@email.com', phone: '55 1234 5678', status: 'active', policyCount: 3, lastInteraction: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), nextRenewal: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), assignedAdvisor: 'Ana López', insuranceCompany: 'GNP Seguros', alerts: { pendingPayments: true, expiredDocs: false, homonym: false }, preferredPaymentMethod: 'card', paymentFrequency: 'monthly' },
  { id: '2', internal_id: 'CLI002', name: 'María Rodríguez Luna', rfc: 'ROLM920315XYZ', email: 'maria.r@email.com', phone: '55 9876 5432', status: 'active', policyCount: 1, lastInteraction: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), nextRenewal: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000), assignedAdvisor: 'Carlos Marín', insuranceCompany: 'AXA Seguros', alerts: { pendingPayments: false, expiredDocs: true, homonym: false }, preferredPaymentMethod: 'transfer', paymentFrequency: 'annual' },
  { id: '3', internal_id: 'CLI003', name: 'Pedro Martínez Solís', rfc: 'MASP751120DEF', email: 'pedro.m@email.com', phone: '55 1122 3344', status: 'inactive', policyCount: 0, lastInteraction: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), assignedAdvisor: 'Ana López', insuranceCompany: 'MetLife', alerts: { pendingPayments: false, expiredDocs: false, homonym: false } },
  { id: '4', internal_id: 'CLI004', name: 'Laura Gómez Morales', rfc: 'GOML880505JKL', email: 'laura.gm@email.com', phone: '55 4455 6677', status: 'prospect', policyCount: 0, assignedAdvisor: 'Carlos Marín', insuranceCompany: '-', alerts: { pendingPayments: false, expiredDocs: false, homonym: true } },
];

type SortField = keyof Pick<Client, 'name' | 'policyCount' | 'lastInteraction' | 'nextRenewal' | 'assignedAdvisor' | 'status'> | 'internal_id';
type SortDirection = 'asc' | 'desc';

interface Filters {
    status: ClientStatus | 'all';
    insuranceCompany: string;
    hasPendingPayments: boolean | null;
    hasExpiredDocs: boolean | null;
    renewalSoon: boolean | null;
}

const StatusBadge: React.FC<{ status: ClientStatus }> = ({ status }) => {
    const config = {
        active: { text: 'Activo', color: 'green' },
        inactive: { text: 'Inactivo', color: 'gray' },
        prospect: { text: 'Prospecto', color: 'blue' },
    }[status];

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800`}>
             {config.text}
         </span>
    );
};

const SortableHeader: React.FC<{ label: string; field: SortField; currentSort: SortField; direction: SortDirection; onSort: (field: SortField) => void; className?: string }> = 
({ label, field, currentSort, direction, onSort, className }) => (
    <th className={clsx("px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors", className)}
        onClick={() => onSort(field)}>
        <div className="flex items-center">
            {label}
            {currentSort === field && (
                 <span className="ml-1">
                    {direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                 </span>
             )}
         </div>
     </th>
);

const ActionsMenu: React.FC<{ client: Client }> = ({ client }) => {
    const [isOpen, setIsOpen] = useState(false);
    const handleAction = (action: string) => {
        console.log(`Action: ${action} for client ${client.id}`);
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block text-left">
            <button onClick={() => setIsOpen(!isOpen)} className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                 <MoreHorizontal className="w-5 h-5" />
            </button>
            {isOpen && (
                 <div
                     className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                     onMouseLeave={() => setIsOpen(false)}
                 >
                     <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        <button onClick={() => handleAction('view')} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" role="menuitem">
                            <Eye className="mr-3 h-4 w-4" /> Ver Perfil Completo
                        </button>
                        <button onClick={() => handleAction('edit')} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" role="menuitem">
                             <Edit className="mr-3 h-4 w-4" /> Editar Información
                        </button>
                        <button onClick={() => handleAction('add_policy')} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" role="menuitem">
                            <PlusSquare className="mr-3 h-4 w-4" /> Agregar Póliza
                        </button>
                        <button onClick={() => handleAction('upload_doc')} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" role="menuitem">
                            <Upload className="mr-3 h-4 w-4" /> Subir Documento
                        </button>
                         <button onClick={() => handleAction('send_reminder')} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" role="menuitem">
                            <Send className="mr-3 h-4 w-4" /> Enviar Recordatorio
                         </button>
                     </div>
                 </div>
             )}
         </div>
     );
};

export const Clients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filters, setFilters] = useState<Filters>({
      status: 'all',
      insuranceCompany: '',
      hasPendingPayments: null,
      hasExpiredDocs: null,
      renewalSoon: null,
  });
  const [showFilters, setShowFilters] = useState(false);

  const handleSort = (field: SortField) => {
      const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
      setSortField(field);
      setSortDirection(newDirection);
  };

  const processedClients = useMemo(() => {
    let filtered = [...exampleClients].map(client => ({
      ...client,
      isIntegral: client.policyCount > 1
    }));

    if (filters.status !== 'all') {
        filtered = filtered.filter(c => c.status === filters.status);
    }
    if (filters.insuranceCompany) {
        filtered = filtered.filter(c => c.insuranceCompany.toLowerCase().includes(filters.insuranceCompany.toLowerCase()));
    }
    if (filters.hasPendingPayments !== null) {
        filtered = filtered.filter(c => c.alerts.pendingPayments === filters.hasPendingPayments);
    }
    if (filters.hasExpiredDocs !== null) {
        filtered = filtered.filter(c => c.alerts.expiredDocs === filters.hasExpiredDocs);
    }

    if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        filtered = filtered.filter(c =>
             c.name.toLowerCase().includes(lowerSearch) ||
             c.rfc.toLowerCase().includes(lowerSearch) ||
             c.internal_id.toLowerCase().includes(lowerSearch) ||
             c.email.toLowerCase().includes(lowerSearch) ||
             c.phone.includes(lowerSearch) ||
             c.assignedAdvisor.toLowerCase().includes(lowerSearch)
        );
    }

    filtered.sort((a, b) => {
        const fieldA = a[sortField];
        const fieldB = b[sortField];

        let comparison = 0;
        if (fieldA instanceof Date && fieldB instanceof Date) {
            comparison = fieldA.getTime() - fieldB.getTime();
        } else if (typeof fieldA === 'string' && typeof fieldB === 'string') {
            comparison = fieldA.localeCompare(fieldB);
        } else if (typeof fieldA === 'number' && typeof fieldB === 'number') {
             comparison = fieldA - fieldB;
        } else {
             if (fieldA === undefined || fieldA === null) comparison = -1;
             else if (fieldB === undefined || fieldB === null) comparison = 1;
             else if (fieldA < fieldB) comparison = -1;
             else if (fieldA > fieldB) comparison = 1;
         }

        return sortDirection === 'asc' ? comparison : comparison * -1;
     });

    return filtered;
  }, [exampleClients, searchTerm, sortField, sortDirection, filters]);

  const formatDate = (date?: Date): string => {
      return date ? format(date, 'dd MMM yyyy', { locale: esLocale }) : '-';
  };

  const handleNewClientSubmit = (data: any) => {
    console.log('Client data received:', data);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Gestión de Clientes</h1>
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
            <button onClick={() => setViewMode('list')} className={clsx('p-1.5 rounded', viewMode === 'list' ? 'bg-gray-100 text-primary' : 'text-gray-500 hover:text-gray-700')} title="Vista de Lista">
              <List className="w-5 h-5" />
            </button>
            <button onClick={() => setViewMode('grid')} className={clsx('p-1.5 rounded', viewMode === 'grid' ? 'bg-gray-100 text-primary' : 'text-gray-500 hover:text-gray-700')} title="Vista de Tarjeta">
              <Grid className="w-5 h-5" />
            </button>
          </div>
           <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium">
            <Filter className="w-4 h-4" />
            Filtros {showFilters ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
          </button>
           <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors shadow-sm text-sm font-medium">
            <Plus className="w-5 h-5" />
            Nuevo Cliente
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
         <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre, RFC, ID, email, teléfono, asesor..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
         {showFilters && (
            <div className="border-t border-gray-200 pt-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                 <div>
                     <label htmlFor="filter-status" className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
                    <select id="filter-status" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value as Filters['status']})} className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary bg-white p-2">
                         <option value="all">Todos</option>
                         <option value="active">Activo</option>
                         <option value="inactive">Inactivo</option>
                         <option value="prospect">Prospecto</option>
                     </select>
                 </div>
                 <div>
                    <label htmlFor="filter-insurance" className="block text-xs font-medium text-gray-500 mb-1">Aseguradora</label>
                    <input id="filter-insurance" type="text" value={filters.insuranceCompany} onChange={e => setFilters({...filters, insuranceCompany: e.target.value})} placeholder="Ej: GNP, AXA..." className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary p-2" />
                 </div>
                 <div className="flex flex-col space-y-2 pt-4 md:pt-0">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Alertas</label>
                     <label className="flex items-center text-sm cursor-pointer">
                         <input type="checkbox" checked={filters.hasPendingPayments === true} onChange={e => setFilters({...filters, hasPendingPayments: e.target.checked ? true : filters.hasPendingPayments === false ? null : false })} className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary mr-2"/>
                         Pagos Pendientes
                     </label>
                     <label className="flex items-center text-sm cursor-pointer">
                         <input type="checkbox" checked={filters.hasExpiredDocs === true} onChange={e => setFilters({...filters, hasExpiredDocs: e.target.checked ? true : filters.hasExpiredDocs === false ? null : false })} className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary mr-2"/>
                         Documentos Vencidos
                     </label>
                 </div>
             </div>
         )}
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-5">
              <tr>
                 <th className="px-4 py-3 w-12"><input type="checkbox" className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"/></th>
                 <SortableHeader label="Cliente" field="name" currentSort={sortField} direction={sortDirection} onSort={handleSort} />
                 <SortableHeader label="ID" field="internal_id" currentSort={sortField} direction={sortDirection} onSort={handleSort} className="w-24"/>
                 <SortableHeader label="Nº Pólizas" field="policyCount" currentSort={sortField} direction={sortDirection} onSort={handleSort} className="w-24 text-center"/>
                 <SortableHeader label="Estado" field="status" currentSort={sortField} direction={sortDirection} onSort={handleSort} className="w-32"/>
                 <SortableHeader label="Últ. Contacto" field="lastInteraction" currentSort={sortField} direction={sortDirection} onSort={handleSort} className="w-36"/>
                 <SortableHeader label="Próx. Renov." field="nextRenewal" currentSort={sortField} direction={sortDirection} onSort={handleSort} className="w-36"/>
                 <SortableHeader label="Asesor" field="assignedAdvisor" currentSort={sortField} direction={sortDirection} onSort={handleSort} className="w-40"/>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processedClients.length > 0 ? processedClients.map((client: Client & { isIntegral: boolean }) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                   <td className="px-4 py-3"><input type="checkbox" className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"/></td>
                  <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{client.name}</span>
                        {client.isIntegral && (
                          <span title="Cliente Integral">
                            <Award className="w-4 h-4 text-yellow-500 ml-2" />
                          </span>
                        )}
                        {(client.alerts.pendingPayments || client.alerts.expiredDocs || client.alerts.homonym) && (
                            <AlertTriangle className={clsx(
                                "w-4 h-4 ml-2 flex-shrink-0",
                                client.alerts.pendingPayments && "text-red-500",
                                client.alerts.expiredDocs && "text-yellow-600",
                                client.alerts.homonym && "text-blue-500"
                             )} />
                         )}
                       </div>
                       <div className="text-sm text-gray-500">{client.email}</div>
                   </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{client.internal_id}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">{client.policyCount}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusBadge status={client.status} />
                  </td>
                   <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(client.lastInteraction)}</td>
                   <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(client.nextRenewal)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{client.assignedAdvisor}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                     <ActionsMenu client={client} />
                  </td>
                </tr>
              )) : (
                <tr>
                    <td colSpan={9} className="text-center py-10 text-gray-500">No se encontraron clientes que coincidan con la búsqueda o filtros.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {processedClients.length > 0 ? processedClients.map((client: Client) => (
             <div key={client.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-5 flex flex-col justify-between hover:shadow-lg transition-shadow">
               <div>
                 <div className="flex justify-between items-start mb-3">
                     <div>
                       <h3 className="text-base font-semibold text-gray-900 truncate" title={client.name}>{client.name}</h3>
                       <p className="text-xs text-gray-500">{client.internal_id} &bull; {client.assignedAdvisor}</p>
                     </div>
                     <ActionsMenu client={client} />
                 </div>
                 <div className="mt-2 space-y-1.5 text-sm">
                    <p className="text-gray-600 flex items-center"><FileText className="w-4 h-4 mr-2 text-gray-400"/> Pólizas: <span className="font-medium ml-1">{client.policyCount}</span></p>
                    <p className="text-gray-600 flex items-center"><Clock className="w-4 h-4 mr-2 text-gray-400"/> Últ. Contacto: <span className="font-medium ml-1">{formatDate(client.lastInteraction)}</span></p>
                    <p className="text-gray-600 flex items-center"><CalendarClock className="w-4 h-4 mr-2 text-gray-400"/> Próx. Renov: <span className="font-medium ml-1">{formatDate(client.nextRenewal)}</span></p>
                 </div>
               </div>
               <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                 <StatusBadge status={client.status} />
                 <div className="flex items-center gap-1.5">
                     {(client.alerts.pendingPayments || client.alerts.expiredDocs || client.alerts.homonym) && (
                        <AlertTriangle className={clsx(
                            "w-5 h-5",
                            client.alerts.pendingPayments && "text-red-500",
                            client.alerts.expiredDocs && "text-yellow-600",
                            client.alerts.homonym && "text-blue-500"
                        )} />
                    )}
                 </div>
               </div>
             </div>
           )) : (
             <p className="col-span-full text-center py-10 text-gray-500">No se encontraron clientes que coincidan con la búsqueda o filtros.</p>
           )}
         </div>
       )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Nuevo Cliente" size="xl">
        <NewClientForm onSubmit={handleNewClientSubmit} onClose={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};