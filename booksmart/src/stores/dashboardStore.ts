import { create } from 'zustand';
import { supabase } from '../supabase';

interface DashboardData {
    totalRevenue: number;
    totalExpenses: number;
    totalProfit: number;
    totalInvoices: number;
    paidInvoices: number;
    unpaidInvoices: number;
    paidAmount: number;
    unpaidAmount: number;
}

interface RevenueExpenseData {
    month: string;
    revenue: number;
    expenses: number;
}

interface ProfitData {
    month: string;
    profit: number;
}

interface InvoiceData {
    name: string;
    value: number;
    color: string;
}

interface ErrorState {
    hasError: boolean;
    message: string;
}

interface DashboardState {
    dashboardData: DashboardData;
    revenueExpenseData: RevenueExpenseData[];
    profitData: ProfitData[];
    invoiceData: InvoiceData[];
    loading: boolean;
    error: ErrorState;

    // Actions
    setLoading: (loading: boolean) => void;
    setError: (error: ErrorState) => void;
    fetchDashboardData: () => Promise<void>;
    resetData: () => void;
}

const initialDashboardData: DashboardData = {
    totalRevenue: 0,
    totalExpenses: 0,
    totalProfit: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    unpaidInvoices: 0,
    paidAmount: 0,
    unpaidAmount: 0,
};

const initialError: ErrorState = {
    hasError: false,
    message: '',
};

export const useDashboardStore = create<DashboardState>((set, get) => ({
    dashboardData: initialDashboardData,
    revenueExpenseData: [],
    profitData: [],
    invoiceData: [],
    loading: true,
    error: initialError,

    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),

    resetData: () => set({
        dashboardData: initialDashboardData,
        revenueExpenseData: [],
        profitData: [],
        invoiceData: [],
        error: initialError,
    }),

    fetchDashboardData: async () => {
        try {
            set({ loading: true, error: initialError });

            // Fetch revenue and expense data
            const { data: revenueExpenses, error: reError } = await supabase
                .from('financial_data')
                .select('month, revenue, expenses')
                .order('month', { ascending: false });

            if (reError) throw reError;

            // Fetch invoice data
            const { data: invoices, error: invoiceError } = await supabase
                .from('invoices')
                .select('invoice_status, amount');

            if (invoiceError) throw invoiceError;

            // Process financial data
            let totalRevenue = 0;
            let totalExpenses = 0;
            const profits: ProfitData[] = [];

            if (revenueExpenses && revenueExpenses.length > 0) {
                for (const item of revenueExpenses) {
                    totalRevenue += item.revenue;
                    totalExpenses += item.expenses;
                    profits.push({
                        month: item.month,
                        profit: item.revenue - item.expenses
                    });
                }
            }

            // Process invoice data
            let paidAmount = 0;
            let unpaidAmount = 0;
            let paidCount = 0;
            let unpaidCount = 0;

            if (invoices && invoices.length > 0) {
                for (const invoice of invoices) {
                    if (invoice.invoice_status === 'paid') {
                        paidAmount += invoice.amount;
                        paidCount++;
                    } else {
                        unpaidAmount += invoice.amount;
                        unpaidCount++;
                    }
                }
            }

            const invoiceChartData = invoices && invoices.length > 0 ? [
                { name: 'Outstanding', value: unpaidAmount, color: '#AF5A5C' },
                { name: 'Paid', value: paidAmount, color: '#5BAF7C' }
            ] : [];

            set({
                dashboardData: {
                    totalRevenue,
                    totalExpenses,
                    totalProfit: totalRevenue - totalExpenses,
                    totalInvoices: invoices?.length || 0,
                    paidInvoices: paidCount,
                    unpaidInvoices: unpaidCount,
                    paidAmount,
                    unpaidAmount
                },
                revenueExpenseData: revenueExpenses || [],
                profitData: profits,
                invoiceData: invoiceChartData,
                loading: false
            });

        } catch (error: any) {
            console.error('Error fetching dashboard data:', error);
            set({
                error: {
                    hasError: true,
                    message: error.message || 'Failed to load dashboard data'
                },
                loading: false
            });

            get().resetData();
        }
    },
}));