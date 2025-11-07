export interface Invoice {
  id: string;
  invoiceNumber?: string;
  docType: string;
  status: string;
  project: string;
  client: { id: string; name: string };
  company: { id: string; name: string };
  finalTotal: number;
  qty: number;
  rate: number;
  paid: number;
  discount: number;
  vat: number;
  longDesc: string;
  params: string;
  etaDays: number;
  startDate: string;
  createdAt: string;
  updatedAt: string;
  showVat?: boolean;
  lockTotal?: boolean;
  totalInclVat?: boolean;
  logoW?: string;
  fx?: number;
  delivered?: number;
  tasks?: Array<{
    id: string;
    name: string;
    dur: number;
    off: number;
  }>;
  resources?: Array<{
    id: string;
    type: string;
    hours: number;
    rate: number;
  }>;
}
