// Core entity types
export interface Client {
  id: string;
  name: string;
  cc: string; // Contact person
  shipTo: string;
  shipCc: string; // Shipping contact
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Company {
  id: string;
  name: string;
  logo?: string;
  accent?: string;
  accentDark?: string;
  logoWidth?: string;
  contactHTML?: string;
  bankDetails?: BankDetails;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BankDetails {
  bankName: string;
  currency: string;
  accName: string;
  accNo: string;
  branch: string;
  swift?: string;
  vatTin?: string;
}

export interface Task {
  id: string;
  name: string;
  dur: number; // duration in days
  off: number; // offset in days
  dependsOn?: string;
}

export interface Resource {
  id?: string;
  type: string;
  hours: number;
  rate: number;
  amount?: number;
}

// Document types
export type DocumentType = "Invoice" | "Waybill" | "Account Info" | "Pro-Forma";

export interface InvoiceData {
  id?: string;
  docType: DocumentType;
  selectedClient: string;
  selectedCompany?: string;
  clientData?: Client;
  companyData?: Company;
  project: string;
  qty: number;
  rate: number;
  paid: number;
  discount: number;
  vat: number;
  fx: number; // exchange rate
  delivered?: number;
  longDesc: string;
  params: string;
  etaDays: number;
  showVat: boolean;
  startDate: string;
  lockTotal: boolean;
  finalTotal: number;
  totalInclVat: boolean;
  logoW: string;
  tasks: Task[];
  resources?: Resource[];
  // Exchange rate information
  invoiceCurrency?: string;
  exchangeRateId?: string;
  exchangeRateCompany?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Financial calculations
export interface FinancialSummary {
  subtotal: number;
  discountAmount: number;
  vatAmount: number;
  total: number;
  totalWithVat: number;
  amountDue: number;
  resourcesTotal?: number;
}

// API types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface GenerateInvoiceRequest {
  invoiceData: Omit<InvoiceData, "id" | "createdAt" | "updatedAt">;
  format?: "html" | "pdf";
  template?: string;
}

export interface GenerateInvoiceResponse {
  id: string;
  url?: string;
  html?: string;
  pdf?: Buffer;
}

// UI State types
export interface InvoiceFormState {
  data: InvoiceData;
  clients: Client[];
  companies: Company[];
  selectedClient: Client | null;
  selectedCompany: Company | null;
  financial: FinancialSummary;
  isLoading: boolean;
  errors: Record<string, string>;
}

// Template types
export interface InvoiceTemplate {
  id: string;
  name: string;
  companyId: string;
  data: Partial<InvoiceData>;
  style: {
    accent: string;
    accentDark: string;
    logoW: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Gantt chart types
export interface GanttTask extends Task {
  startDate: Date;
  endDate: Date;
  progress?: number;
  color?: string;
}

export interface GanttConfig {
  startDate: Date;
  totalDays: number;
  tasks: GanttTask[];
  title?: string;
}

// Database models (for Prisma)
export interface Invoice {
  id: string;
  docType: DocumentType;
  clientId: string;
  companyId: string;
  data: InvoiceData;
  status: "draft" | "sent" | "paid" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
  client: Client;
  company: Company;
}

// Form validation schemas (for Zod)
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormErrors {
  [key: string]: string | undefined;
}

// Export/Import types
export interface ExportOptions {
  format: "pdf" | "html" | "json";
  includeResources?: boolean;
  includeTasks?: boolean;
  template?: string;
}

export interface ImportData {
  invoices?: InvoiceData[];
  clients?: Client[];
  companies?: Company[];
  templates?: InvoiceTemplate[];
}

// Authentication types (for API access)
export interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  createdAt: Date;
  expiresAt?: Date;
}

// Webhook types (for external integrations)
export interface WebhookEvent {
  id: string;
  type: "invoice.created" | "invoice.updated" | "invoice.paid";
  data: any;
  timestamp: Date;
}

// Exchange Rate types
export interface ExchangeRate {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  rateType: 'buying' | 'selling' | 'mid';
  source: 'api' | 'manual' | 'cedirates';
  company?: string;
  apiProvider?: string;
  isActive: boolean;
  effectiveDate: Date;
  expiresAt?: Date;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExchangeRateHistory {
  id: string;
  exchangeRateId: string;
  oldRate?: number;
  newRate: number;
  changeReason: 'api_update' | 'manual_edit' | 'bulk_import';
  effectiveDate: Date;
  createdBy?: string;
  createdAt: Date;
}

export interface ExchangeRateConfig {
  id: string;
  defaultSource: 'api' | 'manual' | 'cedirates';
  autoUpdateEnabled: boolean;
  updateFrequency: 'hourly' | 'daily' | 'weekly';
  cediratesApiKey?: string;
  lastApiUpdate?: Date;
  apiUpdateStatus?: 'success' | 'failed' | 'pending';
  allowManualRates: boolean;
  requireApproval: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExchangeRateSummary {
  usdToGhs: { rate: number; company: string; source: string };
  eurToGhs: { rate: number; company: string; source: string };
  gbpToGhs: { rate: number; company: string; source: string };
  lastUpdated: string;
}

export interface CreateExchangeRateRequest {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  rateType: 'buying' | 'selling' | 'mid';
  source: 'api' | 'manual' | 'cedirates';
  company?: string;
  apiProvider?: string;
  effectiveDate?: Date;
  expiresAt?: Date;
}

export interface UpdateExchangeRateRequest {
  rate?: number;
  rateType?: 'buying' | 'selling' | 'mid';
  isActive?: boolean;
  effectiveDate?: Date;
  expiresAt?: Date;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalKeys<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;
