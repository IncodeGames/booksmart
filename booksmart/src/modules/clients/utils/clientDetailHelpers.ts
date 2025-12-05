import { ClientInvoice, ClientExpense, InvoiceStatus, InvoiceChartData } from '../types';

const CHART_COLORS: Record<string, string> = {
    paid: '#22c55e',
    unpaid: '#f59e0b',
    draft: '#6b7280',
    overdue: '#ef4444',
};

/**
 * Calculates invoice chart data from a list of invoices
 */
export function calculateInvoiceChartData(invoices: ClientInvoice[]): InvoiceChartData[] {
    const paidAmount = invoices
        .filter((inv) => inv.invoice_status === InvoiceStatus.Paid)
        .reduce((sum, inv) => sum + inv.amount, 0);
    const unpaidAmount = invoices
        .filter((inv) => inv.invoice_status === InvoiceStatus.Unpaid)
        .reduce((sum, inv) => sum + inv.amount, 0);
    const draftAmount = invoices
        .filter((inv) => inv.invoice_status === InvoiceStatus.Draft)
        .reduce((sum, inv) => sum + inv.amount, 0);
    const overdueAmount = invoices
        .filter((inv) => inv.invoice_status === InvoiceStatus.Overdue)
        .reduce((sum, inv) => sum + inv.amount, 0);

    const data: InvoiceChartData[] = [];

    if (paidAmount > 0) {
        data.push({ name: 'Paid', value: paidAmount, color: CHART_COLORS.paid });
    }
    if (unpaidAmount > 0) {
        data.push({ name: 'Unpaid', value: unpaidAmount, color: CHART_COLORS.unpaid });
    }
    if (draftAmount > 0) {
        data.push({ name: 'Draft', value: draftAmount, color: CHART_COLORS.draft });
    }
    if (overdueAmount > 0) {
        data.push({ name: 'Overdue', value: overdueAmount, color: CHART_COLORS.overdue });
    }

    return data;
}

/**
 * Calculates total amount from invoices
 */
export function calculateTotalAmount(invoices: ClientInvoice[]): number {
    return invoices.reduce((sum, inv) => sum + inv.amount, 0);
}

/**
 * Formats a number as USD currency
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}

/**
 * Formats a date string to a localized date
 */
export function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Returns the CSS class for an invoice status
 */
export function getStatusClass(status: InvoiceStatus): string {
    switch (status) {
        case InvoiceStatus.Paid:
            return 'status-paid';
        case InvoiceStatus.Unpaid:
            return 'status-unpaid';
        case InvoiceStatus.Draft:
            return 'status-draft';
        case InvoiceStatus.Overdue:
            return 'status-overdue';
        default:
            return '';
    }
}

/**
 * Calculates total expense amount from a list of expenses
 */
export function calculateExpenseTotal(expenses: ClientExpense[]): number {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
}

/**
 * Groups expenses by category and returns totals
 */
export function groupExpensesByCategory(
    expenses: ClientExpense[]
): { category: string; total: number }[] {
    const categoryMap = new Map<string, number>();

    for (const expense of expenses) {
        const current = categoryMap.get(expense.category) || 0;
        categoryMap.set(expense.category, current + expense.amount);
    }

    return Array.from(categoryMap.entries())
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total);
}
