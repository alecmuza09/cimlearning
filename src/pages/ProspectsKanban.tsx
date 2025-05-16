import React, { useState } from 'react';
import { Plus, MoreHorizontal, Phone, Mail, Building, User, Filter as FilterIcon, Eye, Pencil } from 'lucide-react';
import clsx from 'clsx';
import { 
    DragDropContext, 
    Droppable, 
    Draggable, 
    DropResult, 
    DroppableProvided, 
    DroppableStateSnapshot, 
    DraggableProvided, 
    DraggableStateSnapshot 
} from 'react-beautiful-dnd';
import { ProspectDetailModal } from '../components/ProspectDetailModal';
import { NewProspectForm } from '../components/NewProspectForm';

// --- Tipos y Datos (Exportar Prospect) --- 

type ProspectStage = 'no_contacted' | 'contacted' | 'appointment_set' | 'client' | 'lost';

export interface Prospect {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  lastInteraction?: string; // Fecha ISO o descripción
  value?: number; // Valor potencial
  source?: string; // Origen (Web, Referido, etc.)
}

// Configuración de las Etapas del Kanban
interface KanbanStage {
  id: ProspectStage;
  title: string;
  color: string; // Color para la cabecera de la columna
}

const kanbanStages: KanbanStage[] = [
  { id: 'no_contacted', title: 'No Contactado', color: 'gray' },
  { id: 'contacted', title: 'Contactado', color: 'blue' },
  { id: 'appointment_set', title: 'Hubo Cita / Propuesta', color: 'purple' },
  { id: 'client', title: 'Cliente Convertido', color: 'green' },
  { id: 'lost', title: 'Perdido / Descartado', color: 'red' },
];

// Datos de Ejemplo Actualizados
const initialProspects: Record<ProspectStage, Prospect[]> = {
  no_contacted: [
    { id: 'p1', name: 'Ana García López', company: 'Tech Solutions S.A. de C.V.', email: 'ana.g@tech.com', source: 'Web', value: 25000 },
    { id: 'p2', name: 'Transportes Rápidos del Norte', phone: '81-XXXX-XXXX', source: 'Referido', value: 150000 },
    { id: 'p7', name: 'Dr. Luis Fernández', source: 'Evento', phone: '55-YYYY-YYYY'},
  ],
  contacted: [
    { id: 'p3', name: 'Sofía Martínez', company: 'Innovate Corp Labs', phone: '55-1234-5678', lastInteraction: 'Llamada 25/May', value: 8000 },
    { id: 'p8', name: 'Constructora Monte Albán S.C.', email: 'contacto@montealban.com', source: 'Web', value: 95000 },
  ],
  appointment_set: [
    { id: 'p4', name: 'Carlos Rodríguez', company: 'Global Enterprises MX', email: 'carlos.r@global.com', lastInteraction: 'Propuesta enviada 01/Jun', value: 18000 },
    { id: 'p9', name: 'Logística Veloz (Flotilla)', lastInteraction: 'Revisión propuesta 03/Jun', value: 120000 },
  ],
  client: [
    { id: 'p5', name: 'Elena Gómez', company: 'Consultores ABC (GMM Grupo)', lastInteraction: 'Contrato Firmado 15/May' },
  ],
  lost: [
    { id: 'p6', name: 'Jorge Torres Peña', lastInteraction: 'No interesado - Precio' },
    { id: 'p10', name: 'Manufacturas del Centro', lastInteraction: 'Decidió ir con competidor' },
  ],
};

// --- Componentes Auxiliares --- 

const ProspectCard: React.FC<{ 
    prospect: Prospect; 
    provided: DraggableProvided;
    snapshot: DraggableStateSnapshot;
    onViewDetails: (prospect: Prospect) => void;
    onEdit: (prospect: Prospect) => void;
}> = ({ prospect, provided, snapshot, onViewDetails, onEdit }) => {
    // Determinar si es persona moral/flotilla (heurística simple)
    const isCorporate = prospect.company?.toLowerCase().includes('s.a.') || prospect.company?.toLowerCase().includes('s.c.') || prospect.company?.toLowerCase().includes('flotilla');

    const cardClasses = clsx(
        "p-3 mb-3 rounded-md shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 cursor-grab",
        snapshot.isDragging && 'shadow-lg ring-2 ring-primary-dark', // Estilo al arrastrar
        isCorporate && 'border-l-4 border-l-orange-500 dark:border-l-orange-400' // Indicador visual para corporativos
    );

    return (
        <div 
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={cardClasses}
            style={{
                ...provided.draggableProps.style,
            }}
        >
            <div className="flex justify-between items-start mb-1.5">
                <p className="font-semibold text-sm text-gray-800 dark:text-white flex items-center">
                    {/* Icono diferente si es corporativo */}
                    {isCorporate 
                        ? <Building className="w-4 h-4 mr-2 text-orange-500 dark:text-orange-400 flex-shrink-0"/> 
                        : <User className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0"/>
                    }
                    <span className="truncate" title={prospect.name}>{prospect.name}</span>
                </p>
                 {/* Botón Ver Detalles */} 
                 <div className="flex items-center space-x-1 flex-shrink-0">
                     <button onClick={() => onEdit(prospect)} className="text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 p-0.5" title="Editar Prospecto">
                         <Pencil className="w-4 h-4" />
                     </button>
                     <button onClick={() => onViewDetails(prospect)} className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-0.5" title="Ver Detalles">
                         <Eye className="w-4 h-4" />
                     </button>
                 </div>
            </div>
            {/* Mostrar compañía de forma más prominente si es corporativo */}
            {prospect.company && !isCorporate && (
                 <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center">
                      <Building className="w-3 h-3 mr-1.5 flex-shrink-0 opacity-70"/> 
                      <span className="truncate" title={prospect.company}>{prospect.company}</span>
                  </p>
             )}
            {prospect.company && isCorporate && (
                 <p className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-1 flex items-center">
                      <Building className="w-3 h-3 mr-1.5 flex-shrink-0"/> 
                      <span className="truncate" title={prospect.company}>{prospect.company}</span>
                  </p>
             )}
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100 dark:border-gray-600">
                <div className="flex gap-2">
                    {prospect.email && <a href={`mailto:${prospect.email}`} title={prospect.email} className="text-gray-400 hover:text-primary dark:hover:text-primary-dark"><Mail className="w-4 h-4"/></a>}
                    {prospect.phone && <a href={`tel:${prospect.phone}`} title={prospect.phone} className="text-gray-400 hover:text-primary dark:hover:text-primary-dark"><Phone className="w-4 h-4"/></a>}
                 </div>
                 {prospect.value && <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-1.5 py-0.5 rounded">${prospect.value.toLocaleString()}</span>}
                 {prospect.source && <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded">{prospect.source}</span>}
             </div>
         </div>
     );
 };

// --- Componente Principal Kanban --- 

export const ProspectsKanban = () => {
    const [prospectsByStage, setProspectsByStage] = useState(initialProspects);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isNewProspectModalOpen, setIsNewProspectModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);

    const handleOnDragEnd = (result: DropResult) => {
        const { source, destination, draggableId } = result; 

        if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) {
            return;
        }

        const startStageId = source.droppableId as ProspectStage;
        const endStageId = destination.droppableId as ProspectStage;

        const startColumn = Array.from(prospectsByStage[startStageId]);
        const [movedProspect] = startColumn.splice(source.index, 1);

        const newProspectsByStage = { ...prospectsByStage };

        if (startStageId === endStageId) {
            startColumn.splice(destination.index, 0, movedProspect);
            newProspectsByStage[startStageId] = startColumn;
        } else {
            const endColumn = Array.from(prospectsByStage[endStageId]);
            endColumn.splice(destination.index, 0, movedProspect);
            newProspectsByStage[startStageId] = startColumn;
            newProspectsByStage[endStageId] = endColumn;
        }

        setProspectsByStage(newProspectsByStage);
        console.log(`Prospecto ${draggableId} movido de ${startStageId} a ${endStageId}`);
    };

    const handleOpenDetails = (prospect: Prospect) => {
        setSelectedProspect(prospect);
        setIsDetailModalOpen(true);
        console.log("Abrir detalles para:", prospect.name);
    };

    const handleCloseDetails = () => {
        setIsDetailModalOpen(false);
        setSelectedProspect(null);
    };

    const handleOpenNewProspect = () => {
         setIsNewProspectModalOpen(true);
         console.log("Abrir modal nuevo prospecto");
    };

    const handleCloseNewProspect = () => {
         setIsNewProspectModalOpen(false);
    };
     
    const handleAddNewProspect = (newProspectData: Omit<Prospect, 'id'>) => {
         const newId = `p${Date.now()}`;
         const newProspect: Prospect = { ...newProspectData, id: newId };
         
         setProspectsByStage(prev => ({
             ...prev,
             no_contacted: [newProspect, ...prev.no_contacted]
         }));
         console.log("Nuevo prospecto añadido:", newProspect);
         handleCloseNewProspect();
    };

    const handleOpenEdit = (prospect: Prospect) => {
        setSelectedProspect(prospect);
        setIsEditModalOpen(true);
        console.log("Abrir edición para:", prospect.name);
    };

    const handleCloseEdit = () => {
        setIsEditModalOpen(false);
        setSelectedProspect(null);
    };

    const handleUpdateProspect = (updatedProspect: Prospect | Omit<Prospect, 'id'>) => {
        if (!('id' in updatedProspect)) {
            console.error("Error: Se intentó actualizar sin ID.");
            handleCloseEdit();
            return;
        }

        setProspectsByStage(prev => {
            const newState = { ...prev };
            let found = false;
            for (const stageKey in newState) {
                const stage = stageKey as ProspectStage;
                const index = newState[stage].findIndex(p => p.id === updatedProspect.id);
                if (index !== -1) {
                    newState[stage][index] = updatedProspect;
                    found = true;
                    break;
                }
            }
            if (!found) {
                console.warn(`Prospecto con id ${updatedProspect.id} no encontrado para actualizar.`);
            }
            return newState;
        });
        console.log("Prospecto actualizado:", updatedProspect);
        handleCloseEdit();
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Cabecera */} 
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                     <FilterIcon className="w-7 h-7 text-primary dark:text-primary-dark" /> 
                    Seguimiento de Prospectos
                </h1>
                <div className="flex items-center gap-3">
                    <button onClick={handleOpenNewProspect} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm font-medium">
                        <Plus className="w-5 h-5" />
                         Nuevo Prospecto
                     </button>
                </div>
            </div>

            {/* Contenedor Kanban con Scroll Horizontal */}
             <DragDropContext onDragEnd={handleOnDragEnd}>
                <div className="flex-grow overflow-x-auto pb-4">
                    <div className="flex space-x-4 min-w-max h-full">
                         {kanbanStages.map(stage => (
                            <Droppable key={stage.id} droppableId={stage.id}>
                                 {(provided, snapshot) => (
                                     <div // Contenedor principal de la columna
                                         ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={clsx(
                                             "flex flex-col w-72 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg shadow",
                                             snapshot.isDraggingOver && 'bg-primary-50 dark:bg-gray-700'
                                         )}
                                     >
                                         {/* Cabecera de Columna Colorida */}
                                         <div className={clsx(
                                            `p-3 rounded-t-lg flex justify-between items-center border-b-4`,
                                            `border-${stage.color}-500 dark:border-${stage.color}-400`,
                                            stage.color === 'gray' ? 'text-gray-700 dark:text-gray-200' : `text-${stage.color}-700 dark:text-${stage.color}-200`
                                         )}>
                                             <h2 className="font-semibold text-sm uppercase tracking-wide">{stage.title}</h2>
                                             <span className="text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                                                 {prospectsByStage[stage.id]?.length || 0}
                                             </span>
                                         </div>
                                         {/* Lista de Tarjetas (Scroll Interno) */}
                                         <div className="p-3 flex-grow overflow-y-auto">
                                             {prospectsByStage[stage.id]?.map((prospect, index) => (
                                                 <Draggable key={prospect.id} draggableId={prospect.id} index={index}>
                                                     {(providedDraggable, snapshotDraggable) => (
                                                        <ProspectCard
                                                             prospect={prospect}
                                                             provided={providedDraggable}
                                                             snapshot={snapshotDraggable}
                                                             onViewDetails={handleOpenDetails}
                                                             onEdit={handleOpenEdit}
                                                         />
                                                     )}
                                                 </Draggable>
                                             ))}
                                             {provided.placeholder} {/* Placeholder aquí dentro del contenedor principal */}
                                        </div>
                                    </div>
                                )}
                            </Droppable>
                        ))}
                    </div>
                </div>
             </DragDropContext>

            {/* --- Modales --- */} 
            {/* Modal Detalles */} 
            {selectedProspect && 
                <ProspectDetailModal 
                    isOpen={isDetailModalOpen} 
                    onClose={handleCloseDetails} 
                    prospect={selectedProspect} 
                />
            }

            {/* Modal Nuevo Prospecto */} 
            <NewProspectForm 
                isOpen={isNewProspectModalOpen} 
                onClose={handleCloseNewProspect} 
                onSave={handleAddNewProspect}
            />

            {/* Modal Editar Prospecto (reusa NewProspectForm) */}
            {selectedProspect && 
                <NewProspectForm 
                    isOpen={isEditModalOpen} 
                    onClose={handleCloseEdit} 
                    onSave={handleUpdateProspect}
                    initialData={selectedProspect}
                />
            }
        </div>
    );
};

// Clases auxiliares