import React, { useState, useMemo } from 'react';
import {
    Plus, Search, Filter, MoreHorizontal, ChevronDown, ChevronUp, Download,
    FileText, User, ShieldCheck, FileClock, Calendar, UserCog, FileSpreadsheet, HelpCircle, DollarSign, // Tipos Doc (DollarSign añadido)
    CheckCircle, AlertTriangle as AlertTriangleIcon, XCircle, // Estados Doc (alias para AlertTriangle)
    Eye, Edit, UploadCloud, Clock, History, Paperclip, MessageSquare, // Acciones e Iconos
    Upload
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { es as esLocale } from 'date-fns/locale/es';
import clsx from 'clsx';

// --- Tipos y Datos de Ejemplo Actualizados ---
type DocumentType = 'identification' | 'address_proof' | 'policy' | 'payment_proof' | 'tax' | 'other';
type DocumentStatus = 'valid' | 'expiring_soon' | 'expired' | 'needs_update';

interface DocumentItem {
  id: string;
  fileName: string;
  clientName: string;
  policyNumber?: string; // Opcional
  documentType: DocumentType;
  version: number;
  uploadedAt: string; // ISO 8601
  uploadedBy: string;
  status: DocumentStatus;
  expirationDate?: string; // ISO 8601
  lastModified?: string; // ISO 8601
  observations?: string;
  filePath?: string; // Para descarga/vista previa
}

const exampleDocuments: DocumentItem[] = [
    { id: 'doc1', fileName: 'ine_juan_perez.pdf', clientName: 'Juan Pérez García', policyNumber: 'POL-2024-001', documentType: 'identification', version: 1, uploadedAt: '2024-03-15T10:30:00Z', uploadedBy: 'admin', status: 'valid', expirationDate: '2028-12-31T00:00:00Z', lastModified: '2024-03-15T10:30:00Z', filePath: '/docs/ine_juan_perez.pdf' },
    { id: 'doc2', fileName: 'comprobante_domicilio_jp.pdf', clientName: 'Juan Pérez García', policyNumber: 'POL-2024-001', documentType: 'address_proof', version: 1, uploadedAt: '2024-03-16T11:12:00Z', uploadedBy: 'admin', status: 'expiring_soon', expirationDate: '2024-06-15T00:00:00Z', lastModified: '2024-03-16T11:12:00Z', observations: 'Vence en 3 meses', filePath: '/docs/comprobante_domicilio_jp.pdf' },
    { id: 'doc3', fileName: 'pago_marzo_cl.pdf', clientName: 'Carlos López Ruiz', policyNumber: 'POL-2024-009', documentType: 'payment_proof', version: 2, uploadedAt: '2025-04-01T08:45:00Z', uploadedBy: 'asesor_CL', status: 'valid', lastModified: '2025-04-01T08:45:00Z', filePath: '/docs/pago_marzo_cl.pdf' },
    { id: 'doc4', fileName: 'poliza_vida_anatorres.pdf', clientName: 'Ana Torres López', policyNumber: 'POL-2023-087', documentType: 'policy', version: 1, uploadedAt: '2023-01-15T11:00:00Z', uploadedBy: 'admin', status: 'expired', expirationDate: '2024-01-15T00:00:00Z', lastModified: '2023-01-15T11:00:00Z', filePath: '/docs/poliza_vida_anatorres.pdf' },
    { id: 'doc5', fileName: 'situacion_fiscal_jp.pdf', clientName: 'Juan Pérez García', documentType: 'tax', version: 1, uploadedAt: '2024-04-20T09:00:00Z', uploadedBy: 'cliente', status: 'needs_update', lastModified: '2024-04-20T09:00:00Z', observations: 'Solicitar versión actualizada', filePath: '/docs/situacion_fiscal_jp.pdf' },
];

// --- Tipos para Filtros y Ordenamiento ---
type DocSortField = keyof Pick<DocumentItem, 'fileName' | 'clientName' | 'policyNumber' | 'documentType' | 'version' | 'uploadedAt' | 'status' | 'expirationDate' | 'lastModified'>;
type SortDirection = 'asc' | 'desc'; // Asumiendo que ya existe de otro lado o se define aquí

interface DocumentFilters {
    documentType: DocumentType | 'all';
    status: DocumentStatus | 'all';
    clientName: string;
    policyNumber: string;
    uploadedBy: string;
    showOnlyCritical: boolean; // Para vencidos/por vencer
    // Añadir rango de fechas si es necesario
}

// --- Componentes Auxiliares Adaptados ---

// Mapeo de Tipo de Documento a icono y texto
const docTypeConfig: { [key in DocumentType]: { text: string; icon: React.ElementType } } = {
    identification: { text: 'Identificación', icon: User },
    address_proof: { text: 'Comp. Domicilio', icon: FileText },
    policy: { text: 'Póliza', icon: ShieldCheck },
    payment_proof: { text: 'Comp. Pago', icon: DollarSign },
    tax: { text: 'Fiscal', icon: FileSpreadsheet },
    other: { text: 'Otro', icon: HelpCircle },
};

// DocumentStatusBadge
const DocumentStatusBadge: React.FC<{ status: DocumentStatus }> = ({ status }) => {
     let config = {
        text: 'Desconocido', color: 'gray', icon: HelpCircle
     };
     switch (status) {
         case 'valid': config = { text: 'Válido', color: 'green', icon: CheckCircle }; break;
         case 'expiring_soon': config = { text: 'Por Vencer', color: 'yellow', icon: AlertTriangleIcon }; break;
         case 'needs_update': config = { text: 'Requiere Act.', color: 'blue', icon: FileClock }; break;
         case 'expired': config = { text: 'Vencido', color: 'red', icon: XCircle }; break;
     }
     return (
         <span className={clsx(
             `inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium`,
             `bg-${config.color}-100 text-${config.color}-800`, // Claro
             `dark:bg-${config.color}-900/50 dark:text-${config.color}-300` // Oscuro
         )}>
             <config.icon className="w-3 h-3" />
             {config.text}
         </span>
     );
};

// SortableHeader (Reutilizado)
// Asegúrate de que este componente esté importado o definido en este archivo
// Y que el tipo del campo sea DocSortField
const SortableHeader: React.FC<{ label: string; field: DocSortField; currentSort: DocSortField; direction: SortDirection; onSort: (field: DocSortField) => void; className?: string }> = 
({ label, field, currentSort, direction, onSort, className }) => (
     <th className={clsx(
         "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors",
         "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50",
         currentSort === field && "text-primary dark:text-primary-dark",
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

// ActionsMenu para Documentos
const DocumentActionsMenu: React.FC<{ document: DocumentItem }> = ({ document }) => {
    const [isOpen, setIsOpen] = useState(false);
    const handleAction = (action: string) => {
        console.log(`Action: ${action} for document ${document.fileName}`);
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
                     className="origin-top-right absolute right-0 mt-2 w-60 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black dark:ring-gray-700 ring-opacity-5 focus:outline-none z-10"
                     onMouseLeave={() => setIsOpen(false)}
                 >
                     <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        <button onClick={() => handleAction('preview')} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white" role="menuitem">
                            <Eye className="mr-3 h-4 w-4" /> Vista Previa
                        </button>
                        <button onClick={() => handleAction('edit_metadata')} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white" role="menuitem">
                            <Edit className="mr-3 h-4 w-4" /> Editar Metadatos
                        </button>
                        <button onClick={() => handleAction('upload_version')} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white" role="menuitem">
                             <UploadCloud className="mr-3 h-4 w-4" /> Subir Nueva Versión
                        </button>
                        <button onClick={() => handleAction('mark_status')} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white" role="menuitem">
                            <Clock className="mr-3 h-4 w-4" /> Marcar como Vencido/Act.
                        </button>
                         <button onClick={() => handleAction('view_history')} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white" role="menuitem">
                            <History className="mr-3 h-4 w-4" /> Ver Historial Versiones
                         </button>
                     </div>
                 </div>
             )}
         </div>
     );
};

// --- Componente Principal Documentos Mejorado ---
export const Documents = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<DocSortField>('uploadedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filters, setFilters] = useState<DocumentFilters>({ 
      documentType: 'all',
      status: 'all',
      clientName: '',
      policyNumber: '',
      uploadedBy: '',
      showOnlyCritical: false,
  });
  const [showFilters, setShowFilters] = useState(false);

  // Lógica de Ordenamiento
  const handleSort = (field: DocSortField) => {
      const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
      setSortField(field);
      setSortDirection(newDirection);
  };

  // Lógica de Filtrado y Ordenamiento
  const processedDocuments = useMemo(() => {
    let filtered = [...exampleDocuments];

    // Aplicar filtros
    if (filters.documentType !== 'all') {
        filtered = filtered.filter(d => d.documentType === filters.documentType);
    }
    if (filters.status !== 'all') {
        filtered = filtered.filter(d => d.status === filters.status);
    }
    if (filters.clientName) {
        filtered = filtered.filter(d => d.clientName.toLowerCase().includes(filters.clientName.toLowerCase()));
    }
    if (filters.policyNumber) {
         filtered = filtered.filter(d => d.policyNumber?.toLowerCase().includes(filters.policyNumber.toLowerCase()));
     }
    if (filters.uploadedBy) {
         filtered = filtered.filter(d => d.uploadedBy.toLowerCase().includes(filters.uploadedBy.toLowerCase()));
     }
    if (filters.showOnlyCritical) {
         filtered = filtered.filter(d => d.status === 'expired' || d.status === 'expiring_soon' || d.status === 'needs_update');
     }

    // Aplicar búsqueda
    if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        filtered = filtered.filter(d =>
             d.fileName.toLowerCase().includes(lowerSearch) ||
             d.clientName.toLowerCase().includes(lowerSearch) ||
             d.policyNumber?.toLowerCase().includes(lowerSearch)
        );
    }

    // Aplicar ordenamiento
     filtered.sort((a, b) => {
         // Reutilizar lógica de ordenamiento adaptada
         const fieldA = a[sortField];
         const fieldB = b[sortField];
         let comparison = 0;
         const aExists = fieldA !== null && fieldA !== undefined;
         const bExists = fieldB !== null && fieldB !== undefined;
         if (aExists && !bExists) return sortDirection === 'asc' ? -1 : 1;
         if (!aExists && bExists) return sortDirection === 'asc' ? 1 : -1;
         if (!aExists && !bExists) return 0;

         if (typeof fieldA === 'string' && typeof fieldB === 'string') {
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

  // Formateador de Fechas Corto
  const formatShortDate = (dateString?: string): string => {
      return dateString ? format(parseISO(dateString), 'dd/MM/yy', { locale: esLocale }) : '-';
  };
  // Formateador de Fechas con Hora
  const formatDateTime = (dateString?: string): string => {
      return dateString ? format(parseISO(dateString), 'dd/MM/yy HH:mm', { locale: esLocale }) : '-';
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */} 
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Gestión de Documentos</h1>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => setShowFilters(!showFilters)} 
             className={clsx("btn-secondary", /* estilos claro/oscuro */ "flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors shadow-sm text-sm font-medium bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600")}>
            <Filter className="w-4 h-4" />
            Filtros {showFilters ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
          </button>
          <button 
             // onClick={() => openUploadModal()} // TODO: Modal de carga
             className={clsx("btn-primary", /* estilos claro/oscuro */ "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 bg-primary text-white hover:bg-primary-hover focus:ring-primary dark:bg-primary-dark dark:hover:bg-primary-hover-dark dark:focus:ring-primary-dark")}>
            <Upload className="w-5 h-5" />
            Subir Documento
          </button>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */} 
      <div className={clsx("card-base", /* estilos claro/oscuro */ "p-4 rounded-lg shadow-sm border space-y-4 transition-colors bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700")}>
         <div className="flex-1 relative">
          <Search className="input-icon" />
          <input
            type="text"
            placeholder="Buscar por Nombre Archivo, Cliente, Póliza..."
            className={clsx("input-text w-full pl-10")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
         {/* Panel de Filtros */} 
         {showFilters && (
            <div className="border-t border-gray-200 dark:border-gray-600 pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                 {/* Filtro Tipo Doc */} 
                 <div>
                     <label htmlFor="filter-doc-type" className="filter-label">Tipo Documento</label>
                    <select id="filter-doc-type" value={filters.documentType} onChange={e => setFilters({...filters, documentType: e.target.value as DocumentFilters['documentType']})} className="select-input">
                         <option value="all">Todos</option>
                         {Object.entries(docTypeConfig).map(([key, { text }]) => <option key={key} value={key}>{text}</option>)}
                     </select>
                 </div>
                 {/* Filtro Estado */} 
                 <div>
                     <label htmlFor="filter-doc-status" className="filter-label">Estado</label>
                    <select id="filter-doc-status" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value as DocumentFilters['status']})} className="select-input">
                         <option value="all">Todos</option>
                         <option value="valid">Válido</option>
                         <option value="expiring_soon">Por Vencer</option>
                         <option value="needs_update">Requiere Act.</option>
                         <option value="expired">Vencido</option>
                     </select>
                 </div>
                 {/* Filtro Cliente */} 
                 <div>
                     <label htmlFor="filter-doc-client" className="filter-label">Cliente</label>
                    <input id="filter-doc-client" type="text" value={filters.clientName} onChange={e => setFilters({...filters, clientName: e.target.value})} placeholder="Nombre cliente..." className="input-text" />
                 </div>
                 {/* Filtro Póliza */} 
                 <div>
                    <label htmlFor="filter-doc-policy" className="filter-label">Nº Póliza</label>
                    <input id="filter-doc-policy" type="text" value={filters.policyNumber} onChange={e => setFilters({...filters, policyNumber: e.target.value})} placeholder="POL-XXXX..." className="input-text" />
                 </div>
                  {/* Filtro Usuario Subida */} 
                  <div>
                    <label htmlFor="filter-doc-uploader" className="filter-label">Subido por</label>
                    <input id="filter-doc-uploader" type="text" value={filters.uploadedBy} onChange={e => setFilters({...filters, uploadedBy: e.target.value})} placeholder="admin, asesor..." className="input-text" />
                 </div>
                 {/* Toggle Críticos */} 
                 <div className="flex items-end pb-1">
                    <label className="flex items-center text-sm cursor-pointer text-gray-700 dark:text-gray-300 whitespace-nowrap">
                         <input type="checkbox" checked={filters.showOnlyCritical} onChange={e => setFilters({...filters, showOnlyCritical: e.target.checked})} className="h-4 w-4 text-primary dark:text-primary-dark border-gray-300 dark:border-gray-600 rounded focus:ring-primary dark:focus:ring-primary-dark mr-2 bg-transparent dark:bg-gray-700"/>
                         Mostrar Vencidos/Por Vencer
                     </label>
                 </div>
             </div>
         )}
      </div>

      {/* Tabla de Documentos */} 
        <div className="card-base overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0 z-5">
              <tr>
                 <th className="table-header w-12"><input type="checkbox" className="checkbox-input"/></th>
                 <SortableHeader label="Documento" field="fileName" currentSort={sortField} direction={sortDirection} onSort={handleSort} />
                 <SortableHeader label="Cliente" field="clientName" currentSort={sortField} direction={sortDirection} onSort={handleSort} />
                 <SortableHeader label="Póliza" field="policyNumber" currentSort={sortField} direction={sortDirection} onSort={handleSort} />
                 <SortableHeader label="Tipo" field="documentType" currentSort={sortField} direction={sortDirection} onSort={handleSort} />
                 <SortableHeader label="Estado" field="status" currentSort={sortField} direction={sortDirection} onSort={handleSort} className="w-36" />
                 <SortableHeader label="Vencimiento" field="expirationDate" currentSort={sortField} direction={sortDirection} onSort={handleSort} className="w-32" />
                 <SortableHeader label="Subido" field="uploadedAt" currentSort={sortField} direction={sortDirection} onSort={handleSort} className="w-40" />
                 <th className="table-header w-24 text-center">Info</th>
                 <th className="table-header w-20 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {processedDocuments.length > 0 ? processedDocuments.map((doc: DocumentItem) => {
                  const DocIcon = docTypeConfig[doc.documentType]?.icon || HelpCircle;
                  return (
                      <tr key={doc.id} className="table-row">
                        <td className="table-cell px-4 py-3"><input type="checkbox" className="checkbox-input"/></td>
                        <td className="table-cell px-4 py-3">
                            <div className="flex items-center gap-2">
                                <DocIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0"/>
                                <span className="font-medium text-gray-900 dark:text-white truncate" title={doc.fileName}>{doc.fileName}</span>
                            </div>
                            <span className="text-xs text-gray-400 dark:text-gray-500 ml-7">v{doc.version}</span>
                         </td>
                        <td className="table-cell px-4 py-3">{doc.clientName}</td>
                        <td className="table-cell px-4 py-3">{doc.policyNumber || '-'}</td>
                        <td className="table-cell px-4 py-3">{docTypeConfig[doc.documentType]?.text || 'Otro'}</td>
                        <td className="table-cell px-4 py-3">
                            <DocumentStatusBadge status={doc.status} />
                        </td>
                        <td className="table-cell px-4 py-3">{formatShortDate(doc.expirationDate)}</td>
                        <td className="table-cell px-4 py-3">
                             {formatDateTime(doc.uploadedAt)}
                             <span className="block text-xs text-gray-400 dark:text-gray-500">por {doc.uploadedBy}</span>
                         </td>
                         {/* Info Adicional */} 
                        <td className="table-cell px-4 py-3 text-center">
                            {doc.observations && 
                                <span title={doc.observations}>
                                    <MessageSquare className="w-4 h-4 text-blue-500 dark:text-blue-400 inline-block cursor-help" />
                                </span>
                             }
                         </td>
                         {/* Acciones */} 
                        <td className="table-cell px-4 py-3 text-center">
                           <div className="flex justify-center items-center gap-1">
                                <button className="action-icon" title="Descargar" onClick={() => console.log(`Download ${doc.fileName}`)}>
                                     <Download className="w-4 h-4" />
                                 </button>
                                <DocumentActionsMenu document={doc} />
                           </div>
                        </td>
                      </tr>
                  );
              }) : (
                <tr>
                    <td colSpan={10} className="text-center py-10 text-gray-500 dark:text-gray-400">No se encontraron documentos que coincidan con la búsqueda o filtros.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
    </div>
  );
};