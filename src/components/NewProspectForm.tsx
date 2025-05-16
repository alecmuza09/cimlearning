import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Prospect } from '../pages/ProspectsKanban';
import { User, Building, Mail, Phone, DollarSign, Info, Save, X, LucideIcon, Calendar } from 'lucide-react';
import clsx from 'clsx';

// Props del formulario modal
interface ProspectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prospectData: Prospect | Omit<Prospect, 'id'>) => void;
  initialData?: Prospect | null;
}

// Estado inicial CON 'value' (opcional)
const initialFormState: Omit<Prospect, 'id'> = {
    name: '',
    company: '',
    email: '',
    phone: '',
    source: '',
    lastInteraction: '',
    value: undefined,
};

// Tipo estado CON 'value' (number | undefined)
type FormDataState = Omit<Prospect, 'id'>;

// Helper InputFieldProps CON 'value' (number | string | undefined)
interface InputFieldProps {
    name: keyof FormDataState;
    label: string;
    icon: LucideIcon;
    type?: string;
    placeholder?: string;
    required?: boolean;
    value: string | number | undefined;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
const InputField: React.FC<InputFieldProps> = 
    ({ name, label, icon: Icon, type = 'text', placeholder = '', required = false, value, onChange }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
         </label>
         <div className="relative">
             <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
             </span>
             <input
                 type={type}
                 id={name}
                 name={name}
                 value={value ?? ''} 
                 onChange={onChange}
                 placeholder={placeholder}
                 required={required}
                 className={clsx("input-text w-full pl-10")}
             />
         </div>
    </div>
);

export const NewProspectForm: React.FC<ProspectFormProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<FormDataState>(initialFormState);

  // Efecto para pre-rellenar el formulario al editar
  useEffect(() => {
    if (isOpen && initialData) {
      const dataToSet: FormDataState = {
        name: initialData.name ?? '',
        company: initialData.company ?? '',
        email: initialData.email ?? '',
        phone: initialData.phone ?? '',
        source: initialData.source ?? '',
        lastInteraction: initialData.lastInteraction ?? '',
        value: initialData.value !== undefined && initialData.value !== null ? Number(initialData.value) : undefined,
      };
      setFormData(dataToSet);
    } else if (!isOpen) {
      setFormData(initialFormState);
    }
  }, [isOpen, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? (value === '' ? undefined : parseFloat(value)) : value 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
        alert('El nombre del prospecto es obligatorio.');
        return;
    }
    
    if (initialData) {
        const dataToSave: Prospect = { ...formData, id: initialData.id };
         onSave(dataToSave);
    } else {
        const dataToSave: Omit<Prospect, 'id'> = { ...formData };
         onSave(dataToSave);
    }
    
    onClose();
  };
  
  const modalTitle = initialData ? "Editar Prospecto" : "Registrar Nuevo Prospecto";

  return (
    <Modal isOpen={isOpen} onClose={() => { setFormData(initialFormState); onClose(); }} title={modalTitle}>
        <form onSubmit={handleSubmit} className="space-y-4">
            <InputField name="name" label="Nombre Completo" icon={User} required value={formData.name} onChange={handleChange} />
            <InputField name="company" label="Empresa" icon={Building} placeholder="Opcional" value={formData.company} onChange={handleChange} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField name="email" label="Correo Electrónico" icon={Mail} type="email" placeholder="ejemplo@dominio.com" value={formData.email} onChange={handleChange} />
                <InputField name="phone" label="Teléfono" icon={Phone} type="tel" placeholder="55-xxxx-xxxx" value={formData.phone} onChange={handleChange} />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField name="source" label="Origen" icon={Info} placeholder="Ej: Web, Referido, Evento" value={formData.source} onChange={handleChange} />
                <InputField 
                    name="value" 
                    label="Valor Potencial ($)" 
                    icon={DollarSign} 
                    type="number" 
                    placeholder="Ej: 5000" 
                    value={formData.value} 
                    onChange={handleChange} 
                />
            </div>
            <InputField 
                name="lastInteraction" 
                label="Última Interacción / Notas" 
                icon={Calendar} 
                placeholder="Ej: Llamada 25/May, Cita 05/Jun" 
                value={formData.lastInteraction} 
                onChange={handleChange} 
            />
            
            <div className="flex justify-end gap-3 pt-5 border-t border-gray-200 dark:border-gray-700">
                 <button 
                    type="button"
                    onClick={() => { setFormData(initialFormState); onClose(); }}
                    className="btn-secondary px-4 py-2 flex items-center gap-1"
                 >
                    <X className="w-4 h-4"/> Cancelar
                 </button>
                 <button 
                    type="submit"
                    className="btn-primary px-4 py-2 flex items-center gap-1"
                 >
                     <Save className="w-4 h-4"/> Guardar Cambios
                 </button>
             </div>
        </form>
    </Modal>
  );
};

// Clases auxiliares (asumiendo que existen)
// .btn-primary { ... }
// .btn-secondary { ... }
// .input-text { ... } 