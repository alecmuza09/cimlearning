import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import clsx from 'clsx';
import { PaymentForm as PaymentFormType, PaymentMethod as PaymentMethodType } from '../types/policy';

// --- Definiciones de Componentes Auxiliares (Mover al inicio) ---

const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <fieldset className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4 mt-6 first:mt-0 first:border-t-0 first:pt-0">
        <legend className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">{title}</legend>
        {children}
    </fieldset>
);

const InputField: React.FC<{ label: string; name: string; register: any; errors: any; type?: string; placeholder?: string; step?: string; isOptional?: boolean }> =
    ({ label, name, register, errors, type = 'text', placeholder, step, isOptional = false }) => {
        const error = name.split('.').reduce((o, i) => o?.[i], errors);
        return (
            <div>
                <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label} {!isOptional && <span className="text-red-500">*</span>}
                </label>
                <input
                    id={name}
                    type={type}
                    placeholder={placeholder}
                    step={step}
                    {...register(name)}
                    className={clsx(
                        'mt-1 block w-full rounded-md shadow-sm focus:ring-1 sm:text-sm placeholder-gray-400 dark:placeholder-gray-500',
                        'border-gray-300 focus:border-primary focus:ring-primary bg-white text-gray-900',
                        'dark:border-gray-600 dark:focus:border-primary-dark dark:focus:ring-primary-dark dark:bg-gray-700 dark:text-gray-200',
                        error && 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500 dark:focus:border-red-500 dark:focus:ring-red-500'
                    )}
                />
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

const CheckboxField: React.FC<{ label: string; name: string; register: any; errors: any; description?: string; isRequired?: boolean; className?: string }> =
    ({ label, name, register, errors, description, isRequired = false, className }) => {
        const error = name.split('.').reduce((o, i) => o?.[i], errors);
        return (
            <div className={clsx("relative flex items-start", className)}>
                <div className="flex h-5 items-center">
                    <input
                        id={name}
                        type="checkbox"
                        {...register(name)}
                        className={clsx(
                            "h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary",
                            "dark:border-gray-600 dark:text-primary-dark dark:focus:ring-primary-dark dark:bg-gray-700 dark:checked:bg-primary-dark",
                            error && "border-red-500 focus:ring-red-500 dark:border-red-500 dark:focus:ring-red-500"
                        )}
                    />
                </div>
                <div className="ml-3 text-sm">
                    <label htmlFor={name} className="font-medium text-gray-700 dark:text-gray-200">
                        {label} {isRequired && <span className="text-red-500">*</span>}
                    </label>
                    {description && <p className="text-gray-500 dark:text-gray-400 text-xs">{description}</p>}
                    {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error.message}</p>}
                </div>
            </div>
        );
    };

// --- Zod Schema Definition para Póliza ---

// Definir arrays con los valores de los tipos para z.enum
const paymentFormValues: [PaymentFormType, ...PaymentFormType[]] = ['monthly', 'quarterly', 'annual', 'single'];
const paymentMethodValues: [PaymentMethodType, ...PaymentMethodType[]] = ['direct_debit', 'card', 'transfer', 'cash'];

// Sub-schema opcional para el asegurado
const insuredSchema = z.object({
    fullName: z.string().min(3, 'Nombre del asegurado requerido').max(100),
    birthDate: z.string().min(1, 'Fecha de nacimiento del asegurado requerida'),
    // Añadir más campos si son necesarios (RFC, dirección?)
}).optional();

const policySchema = z.object({
  clientId: z.string().min(1, 'Debes seleccionar un cliente (Contratante)'),
  policyNumber: z.string().min(3, 'Escribe el número de póliza (al menos 3 caracteres)').max(50),
  policyType: z.string().min(1, 'Selecciona el tipo de seguro'),
  insuranceCompany: z.string().min(1, 'Escribe el nombre de la aseguradora'),
  startDate: z.string().min(1, 'Selecciona una fecha de inicio'),
  endDate: z.string().min(1, 'Selecciona una fecha de fin'),
  premiumAmount: z.coerce.number({ invalid_type_error: 'Escribe el monto de la prima (número)' }).positive('La prima debe ser un valor positivo'),
  premiumCurrency: z.string().default('MXN'),
  paymentForm: z.enum(paymentFormValues, { required_error: 'Elige la forma de pago' }),
  paymentMethod: z.enum(paymentMethodValues, { required_error: 'Elige el método de pago' }),
  // Campos para asegurado diferente
  isInsuredDifferent: z.boolean().default(false),
  insuredDetails: insuredSchema,
}).refine(data => {
    try {
      return new Date(data.endDate) >= new Date(data.startDate);
    } catch { return false; }
  }, {
    message: "La fecha de fin no puede ser anterior a la de inicio",
    path: ["endDate"],
})
// Refinamiento condicional: si isInsuredDifferent es true, insuredDetails debe existir
.refine(data => !data.isInsuredDifferent || (data.isInsuredDifferent && data.insuredDetails), {
    message: "Debes completar los datos del asegurado si es diferente",
    path: ["insuredDetails.fullName"], // Path aproximado para el error
});

// Definir opciones manualmente para SelectField
const paymentFormOptions: { value: PaymentFormType; label: string }[] = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'annual', label: 'Anual' },
  { value: 'single', label: 'Pago Único' },
];
const paymentMethodOptions: { value: PaymentMethodType; label: string }[] = [
  { value: 'direct_debit', label: 'Domiciliación' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'cash', label: 'Efectivo' },
];

type PolicyFormData = z.infer<typeof policySchema>;

interface NewPolicyFormProps {
  onSubmit: (data: PolicyFormData) => void;
  onClose: () => void;
  // Podríamos necesitar pasar lista de clientes para seleccionar
  // clients: { id: string; name: string }[];
}

// --- Componente Principal del Formulario ---
export const NewPolicyForm: React.FC<NewPolicyFormProps> = ({ onSubmit, onClose /*, clients */ }) => {
  const { register, handleSubmit, control, watch, formState: { errors, isSubmitting } } = useForm<PolicyFormData>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      premiumCurrency: 'MXN',
      isInsuredDifferent: false,
    }
  });

  const isInsuredDifferent = watch('isInsuredDifferent'); // Observar el valor del checkbox

  const handleFormSubmit = (data: PolicyFormData) => {
    console.log("Policy Form Data Submitted:", data);
    // Si el asegurado no es diferente, podríamos limpiar insuredDetails antes de enviar
    const finalData = data.isInsuredDifferent ? data : { ...data, insuredDetails: undefined };
    onSubmit(finalData);
  };

  // Datos de ejemplo para clientes (reemplazar con prop `clients`)
  const exampleClients = [
      { id: '1', name: 'Juan Pérez García (Contratante)' },
      { id: '2', name: 'María Rodríguez Luna (Contratante)' },
      { id: '3', name: 'Pedro Martínez Solís (Contratante)' },
  ];

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5 p-1">

      {/* Selección de Cliente */}
      <SelectField
        label="Cliente Contratante"
        name="clientId"
        control={control}
        errors={errors}
        placeholder="Selecciona el cliente que contrata..."
        options={exampleClients.map(c => ({ value: c.id, label: c.name }))}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField label="Número de Póliza" name="policyNumber" register={register} errors={errors} placeholder="Ej: POL-2024-123" />
        <InputField label="Aseguradora" name="insuranceCompany" register={register} errors={errors} placeholder="Ej: GNP, AXA..." />
      </div>

      {/* Tipo de Póliza (Podría ser Select si hay tipos fijos) */}
      <InputField label="Tipo de Seguro" name="policyType" register={register} errors={errors} placeholder="Ej: Vida, Auto, Gastos Médicos Mayores" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Inicio Vigencia" name="startDate" register={register} errors={errors} type="date" />
          <InputField label="Fin Vigencia" name="endDate" register={register} errors={errors} type="date" />
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <InputField
                label="Monto Prima"
                name="premiumAmount"
                register={register}
                errors={errors}
                type="number"
                step="0.01"
                placeholder="Ej: 1500.00"
            />
           {/* Selección Moneda (si es necesario) */}
           <SelectField
               label="Moneda"
               name="premiumCurrency"
               control={control}
               errors={errors}
               options={[{value: 'MXN', label: 'MXN'}, {value: 'USD', label: 'USD'}]} // Ejemplo
           />
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <SelectField
               label="Forma de Pago"
               name="paymentForm"
               control={control}
               errors={errors}
               placeholder="¿Cada cuánto se paga?"
               options={paymentFormOptions}
           />
           <SelectField
               label="Método de Pago"
               name="paymentMethod"
               control={control}
               errors={errors}
               placeholder="¿Cómo se paga?"
               options={paymentMethodOptions}
           />
       </div>

      {/* Checkbox para Asegurado Diferente */}
       <CheckboxField
           label="El asegurado principal es diferente al contratante"
           name="isInsuredDifferent"
           register={register}
           errors={errors}
           className="pt-4"
        />

      {/* Sección Condicional para Datos del Asegurado */}
      {isInsuredDifferent && (
          <FormSection title="Datos del Asegurado Principal">
                <InputField
                   label="Nombre Completo del Asegurado"
                   name="insuredDetails.fullName" // Registrar con notación de punto
                   register={register}
                   errors={errors}
                   placeholder="Nombre completo como aparece en ID"
                />
                <InputField
                   label="Fecha de Nacimiento del Asegurado"
                   name="insuredDetails.birthDate" // Registrar con notación de punto
                   register={register}
                   errors={errors}
                   type="date"
               />
               {/* Mostrar error general de insuredDetails si existe y no está en campos específicos */}
               {errors.insuredDetails && !errors.insuredDetails.fullName && !errors.insuredDetails.birthDate && (
                   <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.insuredDetails.message}</p>
               )}
               {/* Añadir más campos aquí si es necesario */}
           </FormSection>
      )}

      {/* Botones de Acción */}
      <div className="flex justify-end gap-3 pt-5 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="btn-secondary px-4 py-2" // Usar clases de botones existentes
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary px-4 py-2 flex items-center" // Usar clases de botones existentes
        >
          {isSubmitting ? 'Guardando...' : 'Guardar Póliza'}
        </button>
      </div>
    </form>
  );
};

export default NewPolicyForm;

// Añadir Mapeo de Enums a Labels (para visualización si es necesario)
// Ejemplo:
// const paymentFormLabels: Record<PaymentForm, string> = {
//    monthly: 'Mensual',
//    quarterly: 'Trimestral',
//    annual: 'Anual',
//    single: 'Pago Único'
// };
// const paymentMethodLabels: Record<PaymentMethod, string> = {
//    direct_debit: 'Domiciliación',
//    card: 'Tarjeta',
//    transfer: 'Transferencia',
//    cash: 'Efectivo'
// }; 