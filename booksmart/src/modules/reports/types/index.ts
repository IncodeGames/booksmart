export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface InvoiceDetail {
  id: string | number;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientCompany?: string;
  issueDate: Date;
  dueDate: Date;
  total: number;
  amountPaid: number;
  amountDue: number;
  status: 'draft' | 'unpaid' | 'paid' | 'overdue';
  lineItems: InvoiceLineItem[];
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export type ReportType =
  | 'overview'
  | 'general-ledger'
  | 'expense-reports'
  | 'invoice-details'
  | 'revenue-by-client'
  | 'profit-and-loss'
  | 'accounts-aging'
  | 'payments-collected';

export interface ReportButton {
  id: ReportType;
  title: string;
  description: string;
  icon: string;
  available: boolean;
}
