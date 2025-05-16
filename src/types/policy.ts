export type PolicyStatus = 'active' | 'expired' | 'pending_renewal' | 'cancelled';
export type PaymentForm = 'monthly' | 'quarterly' | 'annual' | 'single';
export type PaymentMethod = 'direct_debit' | 'card' | 'transfer' | 'cash';

export interface Policy {
  id: string;
  policyNumber: string;
  clientName: string;
  policyType: string;
  startDate: string; // Usar formato ISO 8601 (YYYY-MM-DD)
  endDate: string;   // Usar formato ISO 8601
  paymentDueDate?: string; // Fecha próximo pago (ISO 8601)
  premiumAmount: number;
  premiumCurrency?: string;
  status: PolicyStatus;
  insuranceCompany: string;
  paymentForm: PaymentForm;
  paymentMethod: PaymentMethod;
  lastPaymentDate?: string; // ISO 8601
  reminderScheduled: boolean;
  documentsAttached: boolean;
  hasPendingPayment?: boolean; // Para alerta de pago
} 