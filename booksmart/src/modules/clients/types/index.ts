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
    id: number;
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

export interface User {
    email?: string;
}

export interface ClientsPageProps {
    user: User;
    onSignOut: () => void;
}
