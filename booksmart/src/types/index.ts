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