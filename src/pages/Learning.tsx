import React, { useState, useMemo } from 'react';
import {
    BookOpen, Clock, BarChart2, CheckCircle, PlayCircle, Star, Heart, Download, Notebook, Search, Filter, ChevronDown, ChevronUp
} from 'lucide-react';
import clsx from 'clsx';
import { format, parseISO } from 'date-fns';
import { es as esLocale } from 'date-fns/locale/es';

// --- Tipos y Datos de Ejemplo Actualizados --- 
type CourseCategory = 'sales' | 'products' | 'compliance' | 'tools';
type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
type CourseStatus = 'not_started' | 'in_progress' | 'completed';

interface Course {
  id: string;
  title: string;
  description: string;
  category: CourseCategory;
  level: CourseLevel;
  duration: string; 
  modules: number;
  imageUrl?: string; 
  progressPercentage: number; // 0 a 100
  isMandatory?: boolean;
  isFavorite?: boolean;
  lastAccessed?: string; // ISO 8601
  materialsUrl?: string;
  notesUrl?: string;
}

// Datos de ejemplo más ricos
const exampleCourses: Course[] = [
  {
    id: 'c1', title: 'Introducción a Seguros de Vida', description: 'Conceptos básicos, tipos de pólizas y beneficios clave para nuevos asesores.', category: 'products', level: 'beginner', duration: '1h 15m', modules: 5, progressPercentage: 100, isMandatory: true, isFavorite: false, lastAccessed: '2024-04-10T10:00:00Z',
    imageUrl: 'https://via.placeholder.com/400x200/EBF4FF/84A9FF?text=Seguros+Vida', materialsUrl: '/docs/vida_intro.pdf'
  },
  {
    id: 'c2', title: 'Técnicas Avanzadas de Venta Consultiva', description: 'Mejora tus habilidades para entender y satisfacer las necesidades del cliente en el ciclo de ventas complejo.', category: 'sales', level: 'advanced', duration: '3h 45m', modules: 8, progressPercentage: 60, isFavorite: true, lastAccessed: '2024-05-20T14:30:00Z',
    imageUrl: 'https://via.placeholder.com/400x200/FEF3C7/FDBA74?text=Ventas', notesUrl: '/notes/ventas_avanzadas'
  },
   {
    id: 'c3', title: 'Cumplimiento Normativo CNSF 2024', description: 'Actualizaciones importantes sobre regulaciones, PLD y buenas prácticas para el sector asegurador.', category: 'compliance', level: 'intermediate', duration: '2h 00m', modules: 4, progressPercentage: 0, isMandatory: true,
    imageUrl: 'https://via.placeholder.com/400x200/D1FAE5/6EE7B7?text=Cumplimiento'
  },
  {
    id: 'c4', title: 'Uso Eficiente del CRM Consolida', description: 'Saca el máximo provecho a las herramientas de gestión de clientes, pólizas y documentos.', category: 'tools', level: 'intermediate', duration: '1h 30m', modules: 6, progressPercentage: 25, isFavorite: false, lastAccessed: '2024-05-28T09:15:00Z',
    imageUrl: 'https://via.placeholder.com/400x200/E0E7FF/A5B4FC?text=CRM+Tools', materialsUrl: '/docs/crm_manual.pdf', notesUrl: '/notes/crm_tips'
  },
    {
    id: 'c5', title: 'Seguros de Gastos Médicos Mayores', description: 'Coberturas, exclusiones, deducibles y coaseguros explicados a detalle.', category: 'products', level: 'intermediate', duration: '2h 45m', modules: 7, progressPercentage: 0, isFavorite: true,
    imageUrl: 'https://via.placeholder.com/400x200/FBCFE8/F472B6?text=GMM'
  },
];

// --- Tipos para Filtros --- 
interface LearningFilters {
    level: CourseLevel | 'all';
    category: CourseCategory | 'all';
    status: CourseStatus | 'all';
}

// --- Componentes Auxiliares Mejorados --- 

const CourseCard: React.FC<{ course: Course; onToggleFavorite: (id: string) => void }> = ({ course, onToggleFavorite }) => {
  const { title, description, category, level, duration, modules, imageUrl, progressPercentage, isMandatory, isFavorite, lastAccessed, materialsUrl, notesUrl, id } = course;
  const isCompleted = progressPercentage === 100;
  const isInProgress = progressPercentage > 0 && progressPercentage < 100;

  // Formateo de fechas auxiliar
  const formatLastAccessed = (dateString?: string) => {
      return dateString ? `Accedido: ${format(parseISO(dateString), 'dd MMM yyyy', { locale: esLocale })}` : '' ;
  };

  // Determinar texto y icono del botón principal
  let actionButtonText = 'Empezar Curso';
  let ActionButtonIcon = PlayCircle;
  if (isCompleted) {
      actionButtonText = 'Ver Curso';
      ActionButtonIcon = CheckCircle;
  } else if (isInProgress) {
      actionButtonText = 'Continuar Curso';
      ActionButtonIcon = PlayCircle;
  }

  return (
    <div className={clsx(
        "flex flex-col rounded-lg shadow-md overflow-hidden transition-shadow hover:shadow-lg h-full", // h-full para alinear botones
        "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
        isCompleted && "border-green-500 dark:border-green-600"
    )}>
        {/* Imagen y Overlays (Favorito, Obligatorio) */} 
        <div className="relative">
            {imageUrl ? (
                <img src={imageUrl} alt={`Portada ${title}`} className="w-full h-40 object-cover" />
            ) : (
                <div className="w-full h-40 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                </div>
            )}
            <button 
                onClick={() => onToggleFavorite(id)}
                className={clsx(
                    "absolute top-2 right-2 p-1.5 rounded-full transition-colors",
                    isFavorite ? "bg-red-500 text-white hover:bg-red-600" : "bg-black/30 text-white hover:bg-black/50 dark:bg-white/20 dark:hover:bg-white/40"
                )}
                title={isFavorite ? "Quitar de Favoritos" : "Añadir a Favoritos"}
                aria-pressed={isFavorite}
             >
                 <Heart className="w-4 h-4" />
            </button>
             {isMandatory && (
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-yellow-500 text-black text-xs font-bold flex items-center gap-1" title="Curso Obligatorio">
                     <Star className="w-3 h-3" /> Obligatorio
                 </span>
            )}
        </div>

        {/* Contenido Principal */} 
        <div className="p-4 flex flex-col flex-grow"> {/* flex-grow para empujar botones */} 
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1.5 truncate" title={title}>{title}</h3>
            {/* Categoría y Nivel */} 
             <div className="flex items-center gap-2 mb-2 text-xs">
                 <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 capitalize font-medium">{category}</span>
                 <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 capitalize font-medium">{level}</span>
             </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-3 flex-grow" title={description}>{description}</p> 
            
            {/* Progreso */} 
            <div className="mb-3">
                 <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Progreso: {progressPercentage}%</span>
                    <span>{Math.round((progressPercentage / 100) * modules)}/{modules} Módulos</span>
                 </div>
                 <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div className={clsx("h-1.5 rounded-full", isCompleted ? "bg-green-500" : "bg-primary dark:bg-primary-dark")} style={{ width: `${progressPercentage}%` }}></div>
                 </div>
            </div>

            {/* Duración y Último Acceso */} 
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {duration}</span>
                 {lastAccessed && <span>{formatLastAccessed(lastAccessed)}</span>}
            </div>
            
            {/* Botones de Acción */} 
             <div className="mt-auto space-y-2"> {/* mt-auto empuja esto hacia abajo */} 
                 <button className={clsx(
                     "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800",
                     isCompleted
                         ? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-gray-500"
                         : "bg-primary text-white dark:bg-primary-dark dark:hover:bg-primary-hover-dark hover:bg-primary-hover focus:ring-primary dark:focus:ring-primary-dark"
                 )}>
                    <ActionButtonIcon className="w-4 h-4" />
                    {actionButtonText}
                 </button>
                 {(materialsUrl || notesUrl) && (
                     <div className="flex gap-2">
                         {materialsUrl && <a href={materialsUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary-small flex-1"><Download className="w-4 h-4 mr-1"/>Material</a>}
                         {notesUrl && <a href={notesUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary-small flex-1"><Notebook className="w-4 h-4 mr-1"/>Notas</a>}
                     </div>
                 )}
             </div>
        </div>
    </div>
  );
};

// --- Componente Principal Learning Mejorado --- 
export const Learning = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState<LearningFilters>({
        level: 'all',
        category: 'all',
        status: 'all',
    });
    const [showFilters, setShowFilters] = useState(false);
    // Simular estado de favoritos (en una app real, usaría Zustand o context)
    const [favorites, setFavorites] = useState<Set<string>>(new Set(['c2', 'c5'])); 

    const handleToggleFavorite = (id: string) => {
        setFavorites(prev => {
            const newFavs = new Set(prev);
            if (newFavs.has(id)) {
                newFavs.delete(id);
            } else {
                newFavs.add(id);
            }
            return newFavs;
        });
    };

    // Lógica de Filtrado y Búsqueda
    const processedCourses = useMemo(() => {
        let filtered = exampleCourses.map(c => ({ ...c, isFavorite: favorites.has(c.id) }));

        // Aplicar filtros
        if (filters.level !== 'all') {
            filtered = filtered.filter(c => c.level === filters.level);
        }
        if (filters.category !== 'all') {
             filtered = filtered.filter(c => c.category === filters.category);
         }
        if (filters.status !== 'all') {
             const statusLogic = (progress: number): CourseStatus => {
                 if (progress === 100) return 'completed';
                 if (progress > 0) return 'in_progress';
                 return 'not_started';
             };
             filtered = filtered.filter(c => statusLogic(c.progressPercentage) === filters.status);
         }

        // Aplicar búsqueda
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(c =>
                 c.title.toLowerCase().includes(lowerSearch) ||
                 c.description.toLowerCase().includes(lowerSearch)
            );
        }
        
        // Opcional: Ordenar (ej: por favoritos, mandatorios, luego título)
         filtered.sort((a, b) => {
            if (a.isMandatory !== b.isMandatory) return a.isMandatory ? -1 : 1;
            if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
            return a.title.localeCompare(b.title);
         });

        return filtered;
    }, [searchTerm, filters, favorites]);

  return (
    <div className="space-y-6">
      {/* Cabecera con Filtros */} 
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-primary dark:text-primary-dark" /> 
            Centro de Aprendizaje
        </h1>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => setShowFilters(!showFilters)} 
             className={clsx("btn-secondary", /* estilos claro/oscuro */ "flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors shadow-sm text-sm font-medium bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600")}>
            <Filter className="w-4 h-4" />
            Filtros {showFilters ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
          </button>
           {/* Podría ir botón de "Añadir Curso" para admins */} 
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros Colapsable */} 
      <div className={clsx("card-base", /* estilos claro/oscuro */ "p-4 rounded-lg shadow-sm border space-y-4 transition-colors bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700")}>
         {/* Búsqueda */} 
         <div className="flex-1 relative">
          <Search className="input-icon" />
          <input
            type="text"
            placeholder="Buscar cursos por título o descripción..."
            className={clsx("input-text w-full pl-10")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
         {/* Panel de Filtros */} 
         {showFilters && (
            <div className="border-t border-gray-200 dark:border-gray-600 pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                 {/* Filtro Nivel */} 
                 <div>
                     <label htmlFor="filter-level" className="filter-label">Nivel</label>
                    <select id="filter-level" value={filters.level} onChange={e => setFilters({...filters, level: e.target.value as LearningFilters['level']})} className="select-input">
                         <option value="all">Todos</option>
                         <option value="beginner">Principiante</option>
                         <option value="intermediate">Intermedio</option>
                         <option value="advanced">Avanzado</option>
                     </select>
                 </div>
                 {/* Filtro Categoría */} 
                 <div>
                     <label htmlFor="filter-category" className="filter-label">Categoría</label>
                    <select id="filter-category" value={filters.category} onChange={e => setFilters({...filters, category: e.target.value as LearningFilters['category']})} className="select-input">
                         <option value="all">Todas</option>
                         <option value="sales">Ventas</option>
                         <option value="products">Productos</option>
                         <option value="compliance">Cumplimiento</option>
                         <option value="tools">Herramientas</option>
                     </select>
                 </div>
                  {/* Filtro Estado */} 
                  <div>
                     <label htmlFor="filter-status" className="filter-label">Estado</label>
                    <select id="filter-status" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value as LearningFilters['status']})} className="select-input">
                         <option value="all">Todos</option>
                         <option value="not_started">No Iniciado</option>
                         <option value="in_progress">En Progreso</option>
                         <option value="completed">Completado</option>
                     </select>
                 </div>
             </div>
         )}
      </div>

      {/* Grid de Cursos Mejorado */} 
      {processedCourses.length > 0 ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {processedCourses.map(course => (
                <CourseCard key={course.id} course={course} onToggleFavorite={handleToggleFavorite} />
             ))}
          </div>
      ) : (
         <p className="text-center py-10 text-gray-500 dark:text-gray-400">No se encontraron cursos que coincidan con tu búsqueda o filtros.</p>
      )}

    </div>
  );
};

// Definición de clases reutilizables (pueden ir en index.css o aquí si se usan poco)
// .btn-secondary-small { @apply flex items-center justify-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-primary-dark; }
// .input-icon { @apply absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5; }
// .input-text { @apply border rounded-lg focus:outline-none focus:ring-1 sm:text-sm placeholder-gray-400 dark:placeholder-gray-500 border-gray-300 focus:ring-primary focus:border-primary bg-white text-gray-900 dark:border-gray-600 dark:focus:ring-primary-dark dark:focus:border-primary-dark dark:bg-gray-700 dark:text-gray-200 py-2 px-3; }
// .select-input { @apply w-full text-sm rounded-md shadow-sm focus:ring-1 p-2 bg-white border-gray-300 focus:ring-primary focus:border-primary dark:border-gray-600 dark:focus:ring-primary-dark dark:focus:border-primary-dark dark:bg-gray-700 dark:text-gray-200; }
// .filter-label { @apply block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1; }