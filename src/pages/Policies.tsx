import React, { useState, useMemo } from 'react';
import {
    Plus, Search, Filter, MoreHorizontal, ChevronDown, ChevronUp,
    FileText, User, Calendar, DollarSign, Clock, Bell, FileCheck, FileWarning, Paperclip, XCircle,
    AlertTriangle, AlertCircle, // NUEVOS iconos para pagos
    Eye, Repeat, CreditCard, Upload, CalendarPlus, Trash // Iconos acciones
} from 'lucide-react';
import { format, differenceInDays, parseISO, isPast, isToday, isValid } from 'date-fns';
import { es as esLocale } from 'date-fns/locale/es';
import clsx from 'clsx';
// Importar el nuevo modal (asumiendo que se creará en src/components)
import { DocumentUploadModal } from '../components/DocumentUploadModal';
import { Modal } from '../components/Modal'; // Importar Modal
import NewPolicyForm from '../components/NewPolicyForm'; // Importar NewPolicyForm
// Importar tipos y datos desde archivos separados
import { PolicyStatus, PaymentForm, PaymentMethod, Policy } from '../types/policy';
import { examplePolicies } from '../data/policies';

// --- Tipos para Filtros y Ordenamiento ---
// Definición añadida para SortDirection
type SortDirection = 'asc' | 'desc';

// Usar Policy importado
type PolicySortField = keyof Pick<Policy, 'policyNumber' | 'clientName' | 'policyType' | 'endDate' | 'paymentDueDate' | 'premiumAmount' | 'status' | 'insuranceCompany' | 'lastPaymentDate'>;

interface PolicyFilters {
    status: PolicyStatus | 'all'; // Usar PolicyStatus importado
    policyType: string;
    insuranceCompany: string;
    // Añadir más filtros si es necesario (ej: rango de fechas)
}

// --- Componentes Auxiliares Adaptados ---

// StatusBadge para Pólizas - Lógica de Pagos Integrada
interface PolicyStatusBadgeProps {
    policy: Policy; // Usar Policy importado
    daysUntilExpiration?: number;
}

const PolicyStatusBadge: React.FC<PolicyStatusBadgeProps> = ({ policy, daysUntilExpiration }) => {
    let config = {
        text: 'Desconocido', color: 'gray', icon: FileWarning
    };
    const { status, hasPendingPayment, paymentDueDate } = policy;

    let paymentDate: Date | null = null;
    let isPaymentDateValid = false;
    if (paymentDueDate) {
        try {
            paymentDate = parseISO(paymentDueDate);
            isPaymentDateValid = isValid(paymentDate);
        } catch { /* Ignorar error si parseISO falla */ }
    }

    const isPaymentOverdue = hasPendingPayment && isPaymentDateValid && isPast(paymentDate!) && !isToday(paymentDate!); // Pago vencido si es pasado y no hoy
    const isPaymentDueSoon = hasPendingPayment && isPaymentDateValid && !isPast(paymentDate!); // Pago pendiente si no está vencido

    // 1. Prioridad Máxima: Pago Vencido
    if (isPaymentOverdue) {
        config = { text: 'Pago Vencido', color: 'red', icon: AlertCircle };
    }
    // 2. Siguiente Prioridad: Pago Pendiente (no vencido)
    else if (isPaymentDueSoon) {
         config = { text: 'Pago Pendiente', color: 'orange', icon: AlertTriangle }; // Usar naranja
     }
    // 3. Estados Generales de la Póliza (si no hay problemas de pago)
    else {
        switch (status) {
            case 'active':
                if (daysUntilExpiration !== undefined && daysUntilExpiration <= 30 && daysUntilExpiration >= 0) {
                    config = { text: 'Por Vencer', color: 'yellow', icon: Bell };
                } else {
                    config = { text: 'Activa', color: 'green', icon: FileCheck };
                }
                break;
            case 'expired':
            case 'cancelled':
                config = { text: status === 'expired' ? 'Expirada' : 'Cancelada', color: 'red', icon: XCircle };
                break;
            case 'pending_renewal':
                // Si está pendiente de renovación pero activa, aún podría tener pago pendiente/vencido (manejado arriba)
                // Mostramos 'Pend. Renovación' si no hay problema de pago.
                config = { text: 'Pend. Renovación', color: 'blue', icon: Clock };
                break;
        }
    }

    return (
        <span className={clsx(
            `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium`,
            // Ajustar clases de color para incluir orange y los específicos de dark mode
            {
                'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300': config.color === 'green',
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300': config.color === 'yellow',
                'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300': config.color === 'red',
                'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300': config.color === 'blue',
                'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300': config.color === 'orange',
                'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300': config.color === 'gray',
            }
        )}>
            <config.icon className="w-3.5 h-3.5" />
            {config.text}
        </span>
    );
};

// SortableHeader (reutilizado de Clients.tsx, asumiendo que está disponible o se importa)
const SortableHeader: React.FC<{ label: string; field: PolicySortField; currentSort: PolicySortField; direction: SortDirection; onSort: (field: PolicySortField) => void; className?: string }> = 
({ label, field, currentSort, direction, onSort, className }) => (
     <th className={clsx(
         "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors",
         "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50", // Estilos base y hover
         currentSort === field && "text-primary dark:text-primary-dark", // Resaltar si está activo
         className
     )}
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

// ActionsMenu para Pólizas
const PolicyActionsMenu: React.FC<{ 
    policy: Policy; 
    onOpenUploadModal: (policy: Policy) => void; // Callback para abrir modal
}> = ({ policy, onOpenUploadModal }) => {
    const [isOpen, setIsOpen] = useState(false);
    const isLifePolicy = policy.policyType.toLowerCase() === 'vida';

    const handleAction = (action: string) => {
        console.log(`Action: ${action} for policy ${policy.policyNumber}`);
        // Si la acción es subir documentos, llamar al callback
        if (action === 'upload_docs') {
             onOpenUploadModal(policy);
        }
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block text-left">
            <button onClick={() => setIsOpen(!isOpen)} 
                    className="p-1 rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                 <MoreHorizontal className="w-5 h-5" />
            </button>
            {isOpen && (
                 <div
                     className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black dark:ring-gray-700 ring-opacity-5 focus:outline-none z-10"
                     onMouseLeave={() => setIsOpen(false)}
                 >
                     <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        <button onClick={() => handleAction('view_details')} className="menu-item" role="menuitem">
                            <Eye className="menu-item-icon" /> Ver Detalles
                        </button>
                        {/* Botón Renovar condicional */} 
                        {!isLifePolicy && (
                             <button onClick={() => handleAction('renew')} className="menu-item" role="menuitem">
                                <Repeat className="menu-item-icon" /> Renovar Póliza
                            </button>
                        )}
                        <button onClick={() => handleAction('add_payment')} className="menu-item" role="menuitem">
                            <CreditCard className="menu-item-icon" /> Agregar Pago
                        </button>
                        {/* Botón Subir Documentos llama al callback */} 
                        <button onClick={() => handleAction('upload_docs')} className="menu-item" role="menuitem">
                            <Upload className="menu-item-icon" /> Subir Documentos
                        </button>
                        <button onClick={() => handleAction('schedule_reminder')} className="menu-item" role="menuitem">
                            <CalendarPlus className="menu-item-icon" /> Programar Recordatorio
                        </button>
                     </div>
                 </div>
             )}
         </div>
     );
};

// --- Componente Principal Pólizas Mejorado ---
export const Policies = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<PolicySortField>('endDate'); // Ordenar por fecha fin por defecto
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filters, setFilters] = useState<PolicyFilters>({ // Estado para filtros
      status: 'all',
      policyType: '',
      insuranceCompany: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Estado para el modal de carga
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedPolicyForUpload, setSelectedPolicyForUpload] = useState<Policy | null>(null);

  // Estado para el modal de nueva póliza
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);

  const handleOpenUploadModal = (policy: Policy) => { // Usar Policy importado
      setSelectedPolicyForUpload(policy);
      setIsUploadModalOpen(true);
  };

  const handleCloseUploadModal = () => {
      setIsUploadModalOpen(false);
      setSelectedPolicyForUpload(null); // Limpiar la póliza seleccionada
  };

  // Handler para submit del formulario de nueva póliza
  const handleNewPolicySubmit = (data: any) => {
      console.log("Nueva Póliza a Guardar:", data);
      // Aquí iría la lógica para añadir la nueva póliza a la lista o enviarla a la API
      // Por ahora, solo cerramos el modal
      setIsPolicyModalOpen(false);
  };

  // Lógica de Ordenamiento
  const handleSort = (field: PolicySortField) => {
      const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
      setSortField(field);
      setSortDirection(newDirection);
  };

  // Lógica de Filtrado y Ordenamiento
  const processedPolicies = useMemo(() => {
    let filtered = [...examplePolicies];

    // Aplicar filtros
    if (filters.status !== 'all') {
        filtered = filtered.filter(p => p.status === filters.status);
    }
    if (filters.policyType) {
        filtered = filtered.filter(p => p.policyType.toLowerCase().includes(filters.policyType.toLowerCase()));
    }
    if (filters.insuranceCompany) {
        filtered = filtered.filter(p => p.insuranceCompany.toLowerCase().includes(filters.insuranceCompany.toLowerCase()));
    }

    // Aplicar búsqueda
    if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        filtered = filtered.filter(p =>
             p.policyNumber.toLowerCase().includes(lowerSearch) ||
             p.clientName.toLowerCase().includes(lowerSearch) ||
             p.policyType.toLowerCase().includes(lowerSearch) ||
             p.insuranceCompany.toLowerCase().includes(lowerSearch)
        );
    }

    // Aplicar ordenamiento
     filtered.sort((a, b) => {
         // Reutilizar la lógica de ordenamiento de Clients (adaptada para PolicySortField)
         const fieldA = a[sortField];
         const fieldB = b[sortField];
         let comparison = 0;

         const aExists = fieldA !== null && fieldA !== undefined;
         const bExists = fieldB !== null && fieldB !== undefined;
         if (aExists && !bExists) return sortDirection === 'asc' ? -1 : 1;
         if (!aExists && bExists) return sortDirection === 'asc' ? 1 : -1;
         if (!aExists && !bExists) return 0;

         if (typeof fieldA === 'string' && typeof fieldB === 'string') {
             // Fechas como string ISO se comparan alfabéticamente bien
             comparison = fieldA.localeCompare(fieldB);
         } else if (typeof fieldA === 'number' && typeof fieldB === 'number') {
             comparison = fieldA - fieldB;
         } else {
             if (fieldA! < fieldB!) comparison = -1;
             else if (fieldA! > fieldB!) comparison = 1;
         }

         return sortDirection === 'asc' ? comparison : comparison * -1;
     });

    return filtered;
  }, [searchTerm, sortField, sortDirection, filters]);

  // Formateador de Fechas
  const formatDate = (dateString?: string): string => {
      return dateString ? format(parseISO(dateString), 'dd MMM yyyy', { locale: esLocale }) : '-';
  };

   // Calcular días para vencimiento
   const getDaysUntilExpiration = (endDateString: string): number => {
       try {
           return differenceInDays(parseISO(endDateString), new Date());
       } catch {
           return NaN; // Manejar fechas inválidas
       }
   };

  return (
    <div className="space-y-6">
      {/* Cabecera */} 
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Gestión de Pólizas</h1>
        <div className="flex items-center gap-3">
            {/* Botón Filtros */} 
           <button 
             onClick={() => setShowFilters(!showFilters)} 
             className={clsx(
                 "flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors shadow-sm text-sm font-medium",
                 "bg-white border-gray-300 text-gray-700 hover:bg-gray-50", // Claro
                 "dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600" // Oscuro
              )}>
            <Filter className="w-4 h-4" />
            Filtros {showFilters ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
          </button>
           {/* Botón Nueva Póliza */} 
          <button
             onClick={() => setIsPolicyModalOpen(true)} // <-- Actualizar onClick
             className={clsx(
                 "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900",
                 "bg-primary text-white hover:bg-primary-hover focus:ring-primary",
                 "dark:bg-primary-dark dark:hover:bg-primary-hover-dark dark:focus:ring-primary-dark"
             )}
            >
            <Plus className="w-5 h-5" />
            Nueva Póliza
          </button>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */} 
      <div className={clsx(
           "p-4 rounded-lg shadow-sm border space-y-4 transition-colors",
           "bg-white border-gray-200", // Claro
           "dark:bg-gray-800 dark:border-gray-700" // Oscuro
       )}>
         <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por No. Póliza, Cliente, Tipo, Aseguradora..."
            className={clsx(
                 "w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-1 sm:text-sm placeholder-gray-400 dark:placeholder-gray-500",
                 "border-gray-300 focus:ring-primary focus:border-primary bg-white text-gray-900", // Claro
                 "dark:border-gray-600 dark:focus:ring-primary-dark dark:focus:border-primary-dark dark:bg-gray-700 dark:text-gray-200" // Oscuro
             )}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
         {/* Panel de Filtros */} 
         {showFilters && (
            <div className="border-t border-gray-200 dark:border-gray-600 pt-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                 {/* Filtro Estado */} 
                 <div>
                     <label htmlFor="filter-policy-status" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Estado</label>
                    <select 
                        id="filter-policy-status" 
                        value={filters.status} 
                        onChange={e => setFilters({...filters, status: e.target.value as PolicyFilters['status']})} 
                        className={clsx("select-input", /* Añadir clases base y dark: */ "w-full text-sm rounded-md shadow-sm focus:ring-1 p-2 bg-white border-gray-300 focus:ring-primary focus:border-primary dark:border-gray-600 dark:focus:ring-primary-dark dark:focus:border-primary-dark dark:bg-gray-700 dark:text-gray-200")}>
                         <option value="all">Todos</option>
                         <option value="active">Activa</option>
                         <option value="pending_renewal">Pend. Renovación</option>
                         <option value="expired">Expirada</option>
                         <option value="cancelled">Cancelada</option>
                     </select>
                 </div>
                 {/* Filtro Tipo Póliza */} 
                 <div>
                    <label htmlFor="filter-policy-type" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tipo Póliza</label>
                    <input id="filter-policy-type" type="text" value={filters.policyType} onChange={e => setFilters({...filters, policyType: e.target.value})} placeholder="Ej: Vida, Auto..." className={clsx("input-text", /* Añadir clases base y dark: */ "w-full text-sm rounded-md shadow-sm focus:ring-1 p-2 border-gray-300 focus:ring-primary focus:border-primary bg-white text-gray-900 placeholder-gray-400 dark:border-gray-600 dark:focus:ring-primary-dark dark:focus:border-primary-dark dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500")} />
                 </div>
                  {/* Filtro Aseguradora */} 
                  <div>
                    <label htmlFor="filter-policy-company" className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Aseguradora</label>
                    <input id="filter-policy-company" type="text" value={filters.insuranceCompany} onChange={e => setFilters({...filters, insuranceCompany: e.target.value})} placeholder="Ej: GNP, AXA..." className={clsx("input-text", /* Añadir clases base y dark: */ "w-full text-sm rounded-md shadow-sm focus:ring-1 p-2 border-gray-300 focus:ring-primary focus:border-primary bg-white text-gray-900 placeholder-gray-400 dark:border-gray-600 dark:focus:ring-primary-dark dark:focus:border-primary-dark dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500")} />
                 </div>
             </div>
         )}
      </div>

      {/* Tabla de Pólizas */} 
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0 z-5">
              <tr>
                 <th className="px-4 py-3 w-12"><input type="checkbox" className="checkbox-input"/></th>
                 <SortableHeader label="No. Póliza" field="policyNumber" currentSort={sortField} direction={sortDirection} onSort={handleSort} />
                 <SortableHeader label="Cliente" field="clientName" currentSort={sortField} direction={sortDirection} onSort={handleSort} />
                 <SortableHeader label="Tipo" field="policyType" currentSort={sortField} direction={sortDirection} onSort={handleSort} />
                 <SortableHeader label="Aseguradora" field="insuranceCompany" currentSort={sortField} direction={sortDirection} onSort={handleSort} />
                 <SortableHeader label="Estado" field="status" currentSort={sortField} direction={sortDirection} onSort={handleSort} className="w-40" />
                 <SortableHeader label="Vencimiento" field="endDate" currentSort={sortField} direction={sortDirection} onSort={handleSort} className="w-36" />
                 <SortableHeader label="Próximo Pago" field="paymentDueDate" currentSort={sortField} direction={sortDirection} onSort={handleSort} className="w-36" />
                 <SortableHeader label="Prima" field="premiumAmount" currentSort={sortField} direction={sortDirection} onSort={handleSort} />
                 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Forma Pago</th>
                 <SortableHeader label="Últ. Pago" field="lastPaymentDate" currentSort={sortField} direction={sortDirection} onSort={handleSort} className="w-36" />
                 <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-28">Info Adic.</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {processedPolicies.length > 0 ? processedPolicies.map((policy: Policy) => {
                  const daysUntilExpiration = getDaysUntilExpiration(policy.endDate);
                  return (
                      <tr key={policy.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-4 py-3"><input type="checkbox" className="checkbox-input"/></td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{policy.policyNumber}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{policy.clientName}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{policy.policyType}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{policy.insuranceCompany}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                            <PolicyStatusBadge policy={policy} daysUntilExpiration={daysUntilExpiration} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(policy.endDate)}
                            {daysUntilExpiration >= 0 && <span className="block text-xs text-gray-400">({daysUntilExpiration} días)</span>}
                         </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {policy.paymentDueDate ? formatDate(policy.paymentDueDate) : '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                            {policy.premiumAmount.toLocaleString('es-MX', { style: 'currency', currency: policy.premiumCurrency || 'MXN' })}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">
                             {policy.paymentForm} ({policy.paymentMethod})
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(policy.lastPaymentDate)}</td>
                         {/* Info Adicional */} 
                        <td className="px-4 py-3 whitespace-nowrap text-center text-gray-400 dark:text-gray-500 text-xs">
                            <div className="flex justify-center items-center gap-2">
                                 {policy.reminderScheduled && <Bell className="w-4 h-4" />}
                                 {policy.documentsAttached && <Paperclip className="w-4 h-4" />}
                            </div>
                         </td>
                         {/* Acciones */} 
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                           <PolicyActionsMenu policy={policy} onOpenUploadModal={handleOpenUploadModal} />
                        </td>
                      </tr>
                  );
              }) : (
                <tr>
                    <td colSpan={13} className="text-center py-10 text-gray-500 dark:text-gray-400">No se encontraron pólizas que coincidan con la búsqueda o filtros.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Renderizar el modal de carga */} 
        {isUploadModalOpen && selectedPolicyForUpload && (
             <DocumentUploadModal
                 isOpen={isUploadModalOpen}
                 onClose={handleCloseUploadModal}
                 policy={selectedPolicyForUpload}
             />
        )}

        {/* Renderizar el modal de Nueva Póliza */}
        <Modal
            isOpen={isPolicyModalOpen}
            onClose={() => setIsPolicyModalOpen(false)}
            title="Registrar Nueva Póliza"
            size="lg" // Ajustar tamaño si es necesario
        >
            <NewPolicyForm
                onSubmit={handleNewPolicySubmit}
                onClose={() => setIsPolicyModalOpen(false)}
                // clients={/* Pasar lista de clientes reales aquí */} 
            />
        </Modal>
    </div>
  );
};