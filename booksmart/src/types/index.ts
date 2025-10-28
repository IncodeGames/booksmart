export interface Client {
    id: string;
    name: string;
    email?: string;
    outstanding_amount?: number;
    created_at?: string;
    phone?: string;
    company?: string;
    user_id?: string;
}

export interface TimeEntry {
    id: string;
    client_id?: string;
    description?: string;
    start_time: string;
    end_time?: string;
    duration?: number;
    created_at?: string;
    user_id?: string;
    client?: Client;
}

export interface TimerState {
    isRunning: boolean;
    startTime: Date | null;
    elapsedTime: number;
    client?: Client;
    description: string;
}

export interface Expense {
    id: string;
    user_id?: string;
    category: string;
    amount: number;
    description?: string;
    date: string;
    vendor?: string;
    payment_method?: string;
    receipt_url?: string;
    created_at?: string;
}


export interface Invoice {
    id: string | number;
    amount: number;
    created_at: string;
    invoice_status: 'unpaid' | 'paid' | 'overdue';
    client_id: string;
    due_date: string;
    issued_date: string;
    user_id?: string;
    clients?: {
        company_name?: string;
        contact_name?: string;
    };
    client?: Client;
}

export interface LedgerEntry {
    id: string;
    date: Date;
    type: 'expense' | 'invoice' | 'payment';
    description: string;
    vendor?: string;
    client?: string;
    category?: string;
    debit: number;
    credit: number;
    balance?: number;
    status?: string;
    reference?: string;
}
