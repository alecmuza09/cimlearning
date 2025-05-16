import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import clsx from 'clsx';
import { LeadStatus, LeadTimelineEntry, Lead } from '../types/lead';
import { formatISO } from 'date-fns';

// Mover leadStatusConfig aquí para que esté disponible globalmente en el archivo
const leadStatusConfig: Record<LeadStatus, { label: string; /* icon?: React.ElementType; */ colorClasses?: string }> = {
    not_contacted: { label: 'No Contactado' },
    contacted: { label: 'Contactado' },
    appointment_set: { label: 'Cita Agendada' },
    proposal_sent: { label: 'Propuesta Enviada' },
    converted: { label: 'Convertido' },
    lost: { label: 'Perdido' },
  };

// --- Componentes Auxiliares (Reutilizar o adaptar de NewClientForm/NewPolicyForm) ---
// Asumimos que InputField, SelectField, FormSection están disponibles o se importan
// Si no, necesitaríamos definirlos aquí o importarlos globalmente.

// Para este ejemplo, los copiaré y adaptaré simplificadamente.
const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <fieldset className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4 mt-6 first:mt-0 first:border-t-0 first:pt-0">
        <legend className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">{title}</legend>
        {children}
    </fieldset>
);

const InputField: React.FC<{ label: string; name: string; register: any; errors: any; type?: string; placeholder?: string; isOptional?: boolean; as?: 'input' | 'textarea' }> = 
    ({ label, name, register, errors, type = 'text', placeholder, isOptional = false, as = 'input' }) => {
    const error = name.split('.').reduce((o, i) => o?.[i], errors);
    const commonProps = {
      id: name,
      placeholder: placeholder,
      ...register(name),
      className: clsx(
        'mt-1 block w-full rounded-md shadow-sm focus:ring-1 sm:text-sm placeholder-gray-400 dark:placeholder-gray-500',
        'border-gray-300 focus:border-primary focus:ring-primary bg-white text-gray-900',
        'dark:border-gray-600 dark:focus:border-primary-dark dark:focus:ring-primary-dark dark:bg-gray-700 dark:text-gray-200',
        error && 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500 dark:focus:border-red-500 dark:focus:ring-red-500'
      )
    };
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {label} {!isOptional && <span className="text-red-500">*</span>}
            </label>
            {as === 'textarea' ? (
                <textarea {...commonProps} rows={3} />
            ) : (
                <input type={type} {...commonProps} />
            )}
            {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error.message}</p>}
        </div>
    );
};

const SelectField: React.FC<{ label: string; name: string; control: any; errors: any; options: { value: string; label: string }[]; placeholder?: string; isOptional?: boolean }> = 
({ label, name, control, errors, options, placeholder, isOptional = false }) => {
    const error = name.split('.').reduce((o, i) => o?.[i], errors);
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {label} {!isOptional && <span className="text-red-500">*</span>}
            </label>
            <Controller
                name={name}
                control={control}
                render={({ field }) => (
                    <select
                        id={name}
                        {...field}
                        className={clsx(
                            'mt-1 block w-full rounded-md shadow-sm focus:ring-1 sm:text-sm bg-white',
                            'border-gray-300 focus:border-primary focus:ring-primary',
                            'dark:border-gray-600 dark:focus:border-primary-dark dark:focus:ring-primary-dark dark:bg-gray-700 dark:text-gray-200',
                            error && 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500 dark:focus:border-red-500 dark:focus:ring-red-500'
                        )}
                    >
                        {placeholder && <option value="">{placeholder}</option>}
                        {options.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                )}
            />
            {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error.message}</p>}
        </div>
    );
};

// --- Zod Schema para Nuevo Prospecto ---
const leadStatusValues: [LeadStatus, ...LeadStatus[]] = [
    'not_contacted', 'contacted', 'appointment_set', 'proposal_sent', 'converted', 'lost'
];
const interestLevels: ['low', 'medium', 'high'] = ['low', 'medium', 'high'];

const newLeadSchema = z.object({
    fullName: z.string().min(3, 'Nombre completo (mín. 3 letras)').max(100),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    phone: z.string().regex(/^\+?[0-9\s-()]{7,}$/, 'Teléfono inválido (mín. 7 dígitos)').optional().or(z.literal('')),
    status: z.enum(leadStatusValues).default('not_contacted'),
    source: z.string().max(50).optional(),
    assignedAdvisor: z.string().max(50).optional(),
    potentialValue: z.coerce.number().positive('Debe ser un número positivo').optional(),
    interestLevel: z.enum(interestLevels).optional(),
    initialNote: z.string().max(500).optional(),
}).refine(data => data.email || data.phone, {
    message: "Se requiere al menos un email o un teléfono",
    path: ["email"], // O path: ["phone"] o un path general
});

type NewLeadFormData = z.infer<typeof newLeadSchema>;

interface NewLeadFormProps {
  onSubmit: (data: Lead) => void; // Debería enviar un objeto Lead completo
  onClose: () => void;
  // Lista de asesores para el select
  advisors?: { id: string; name: string }[]; 
}

// --- Componente Principal del Formulario ---
export const NewLeadForm: React.FC<NewLeadFormProps> = ({ onSubmit, onClose, advisors = [] }) => {
    const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<NewLeadFormData>({
        resolver: zodResolver(newLeadSchema),
        defaultValues: {
            status: 'not_contacted',
        }
    });

    const handleFormSubmit = (data: NewLeadFormData) => {
        const now = formatISO(new Date());
        const newLeadEntry: Lead = {
            id: `lead_${Date.now()}`,
            createdAt: now,
            lastContactDate: undefined, // Al crear, no hay contacto previo por defecto
            nextActionDate: undefined,
            timeline: [],
            ...data, // Los campos del formulario
            // Asegurar que los campos opcionales que no están en el form pero sí en Lead sean undefined o valor por defecto
            email: data.email || undefined,
            phone: data.phone || undefined,
            source: data.source || undefined,
            assignedAdvisor: data.assignedAdvisor || undefined,
            potentialValue: data.potentialValue || undefined,
            interestLevel: data.interestLevel || undefined,
        };

        if (data.initialNote) {
            newLeadEntry.timeline?.push({
                id: `time_${Date.now()}`,
                date: now,
                type: 'note',
                notes: data.initialNote,
                actor: data.assignedAdvisor || 'Sistema', // O el usuario actual
            });
        }
        // Primera entrada al timeline indicando creación y estado inicial
        newLeadEntry.timeline?.unshift({
            id: `time_create_${Date.now()}`,
            date: now,
            type: 'status_change',
            notes: `Prospecto creado. Estado inicial: ${leadStatusConfig[newLeadEntry.status]?.label || newLeadEntry.status}`,
            actor: 'Sistema',
            newStatus: newLeadEntry.status,
        });

        onSubmit(newLeadEntry);
    };

    const exampleAdvisors = [
        { id: 'ana_lopez', name: 'Ana López' },
        { id: 'carlos_marin', name: 'Carlos Marín' },
        { id: 'otro', name: 'Otro Asesor' },
    ];

    const statusOptions = leadStatusValues.map(status => ({
        value: status,
        label: leadStatusConfig[status]?.label || status
    }));

    const interestOptions = interestLevels.map(level => ({
        value: level,
        label: level.charAt(0).toUpperCase() + level.slice(1) // Capitalizar: Low, Medium, High
    })); 

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5 p-1">
            <FormSection title="Información de Contacto">
                <InputField label="Nombre Completo" name="fullName" register={register} errors={errors} placeholder="Ej: Laura Martínez Vega" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Email" name="email" type="email" register={register} errors={errors} placeholder="ejemplo@correo.com" isOptional={true} />
                    <InputField label="Teléfono" name="phone" type="tel" register={register} errors={errors} placeholder="+52 55 1234 5678" isOptional={true} />
                </div>
            </FormSection>

            <FormSection title="Detalles del Prospecto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectField 
                        label="Estado Inicial" 
                        name="status" 
                        control={control} 
                        errors={errors} 
                        options={statusOptions} 
                    />
                    <InputField label="Fuente del Prospecto" name="source" register={register} errors={errors} placeholder="Ej: Referido, Web, Evento" isOptional={true} />
                </div>
                <SelectField 
                    label="Asesor Asignado" 
                    name="assignedAdvisor" 
                    control={control} 
                    errors={errors} 
                    options={advisors.length > 0 ? advisors.map(a => ({value: a.name, label: a.name})) : exampleAdvisors.map(a => ({ value: a.name, label: a.name }))} 
                    placeholder="Seleccionar asesor..." 
                    isOptional={true} 
                />
            </FormSection>

            <FormSection title="Información Adicional (Opcional)">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Valor Potencial Estimado ($)" name="potentialValue" type="number" register={register} errors={errors} placeholder="Ej: 25000" isOptional={true} />
                    <SelectField 
                        label="Nivel de Interés" 
                        name="interestLevel" 
                        control={control} 
                        errors={errors} 
                        options={interestOptions} 
                        placeholder="Seleccionar nivel..." 
                        isOptional={true} 
                    />
                </div>
                <InputField 
                    label="Nota Inicial" 
                    name="initialNote" 
                    as="textarea" 
                    register={register} 
                    errors={errors} 
                    placeholder="Añade un comentario o contexto inicial sobre el prospecto..." 
                    isOptional={true} 
                />
            </FormSection>

            <div className="flex justify-end gap-3 pt-5 border-t border-gray-200 dark:border-gray-700">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="btn-secondary px-4 py-2"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary px-4 py-2 flex items-center"
                >
                    {isSubmitting ? 'Guardando...' : 'Guardar Prospecto'}
                </button>
            </div>
        </form>
    );
};

export default NewLeadForm; 