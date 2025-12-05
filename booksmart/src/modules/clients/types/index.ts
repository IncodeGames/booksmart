export enum InvoiceStatus {
    Draft = 'draft',
    Unpaid = 'unpaid',
    Paid = 'paid',
    Overdue = 'overdue',
}

export enum ClientFilterField {
    All = 'all',
    Name = 'name',
    Email = 'email',
    Phone = 'phone',
    Company = 'company',
}

export enum ClientSortField {
    Name = 'name',
    Email = 'email',
    Company = 'company',
    CreatedAt = 'created_at',
    OutstandingAmount = 'outstanding_amount',
}

export enum SortDirection {
    Ascending = 'asc',
    Descending = 'desc',
}

export interface Client {
    id: string;  // UUID in database
    name: string;
    email: string;
    phone?: string;
    company?: string;
    created_at: string;
    outstanding_amount: number;
    outstanding_invoice_count: number;
    paid_invoice_count: number;
    user_id?: string;
}

export interface ClientFormData {
    name: string;
    email: string;
    phone: string;
    company: string;
}

export interface ClientSearchFilters {
    searchTerm: string;
    filterField: ClientFilterField;
    sortField: ClientSortField;
    sortDirection: SortDirection;
    hasOutstandingBalance: boolean | null;
}

export interface ClientInvoiceSummary {
    outstanding_count: number;
    paid_count: number;
    outstanding_amount: number;
}

export interface ClientInvoice {
    id: number;  // serial integer in database
    amount: number;
    created_at: string;
    invoice_status: InvoiceStatus;
    client_id: string;  // UUID reference to client
    due_date: string;
    issued_date: string;
}

export interface ClientExpense {
    id: string;  // UUID in database
    amount: number;
    description?: string;
    category: string;
    date: string;
    vendor?: string;
    payment_method?: string;
    created_at: string;
    client_id?: string;
}

export enum ClientDetailTab {
    Invoices = 'invoices',
    Expenses = 'expenses',
}

export interface InvoiceChartData {
    name: string;
    value: number;
    color: string;
}

export interface User {
    email?: string;
}

export interface ClientsPageProps {
    user: User;
    onSignOut: () => void;
}
