import { create } from 'zustand';
import { supabase } from '../lib/supabase';

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

            // Fetch invoice data for revenue
            const { data: invoices, error: invoiceError } = await supabase
                .from('invoices')
                .select('invoice_status, amount, created_at');

            if (invoiceError) throw invoiceError;

            // Fetch expense data
            const { data: expenses, error: expenseError } = await supabase
                .from('expenses')
                .select('amount, date');

            if (expenseError) throw expenseError;

            // Calculate total revenue from invoices
            let totalRevenue = 0;
            if (invoices && invoices.length > 0) {
                totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
            }

            // Calculate total expenses
            let totalExpenses = 0;
            if (expenses && expenses.length > 0) {
                totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
            }

            // Group data by month for charts
            const monthlyData = new Map<string, { revenue: number; expenses: number }>();

            // Process invoices by month
            if (invoices && invoices.length > 0) {
                for (const invoice of invoices) {
                    const date = new Date(invoice.created_at);
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    const existing = monthlyData.get(monthKey) || { revenue: 0, expenses: 0 };
                    existing.revenue += invoice.amount;
                    monthlyData.set(monthKey, existing);
                }
            }

            // Process expenses by month
            if (expenses && expenses.length > 0) {
                for (const expense of expenses) {
                    const date = new Date(expense.date);
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    const existing = monthlyData.get(monthKey) || { revenue: 0, expenses: 0 };
                    existing.expenses += expense.amount;
                    monthlyData.set(monthKey, existing);
                }
            }

            // Convert to array and sort by month
            const revenueExpenses: RevenueExpenseData[] = Array.from(monthlyData.entries())
                .map(([month, data]) => ({
                    month,
                    revenue: data.revenue,
                    expenses: data.expenses
                }))
                .sort((a, b) => b.month.localeCompare(a.month));

            // Calculate profit data
            const profits: ProfitData[] = revenueExpenses.map(item => ({
                month: item.month,
                profit: item.revenue - item.expenses
            }));

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
                revenueExpenseData: revenueExpenses,
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