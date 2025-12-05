import {
    calculateInvoiceChartData,
    calculateTotalAmount,
    formatCurrency,
    formatDate,
    getStatusClass,
    calculateExpenseTotal,
    groupExpensesByCategory,
} from '../utils/clientDetailHelpers';
import { ClientInvoice, ClientExpense, InvoiceStatus } from '../types';

const mockInvoices: ClientInvoice[] = [
    {
        id: 1,
        amount: 1000,
        created_at: '2024-01-15T10:00:00Z',
        invoice_status: InvoiceStatus.Paid,
        client_id: 'client-uuid-1',
        due_date: '2024-02-15',
        issued_date: '2024-01-15',
    },
    {
        id: 2,
        amount: 500,
        created_at: '2024-02-01T10:00:00Z',
        invoice_status: InvoiceStatus.Paid,
        client_id: 'client-uuid-1',
        due_date: '2024-03-01',
        issued_date: '2024-02-01',
    },
    {
        id: 3,
        amount: 750,
        created_at: '2024-03-01T10:00:00Z',
        invoice_status: InvoiceStatus.Unpaid,
        client_id: 'client-uuid-1',
        due_date: '2024-04-01',
        issued_date: '2024-03-01',
    },
    {
        id: 4,
        amount: 250,
        created_at: '2024-03-15T10:00:00Z',
        invoice_status: InvoiceStatus.Draft,
        client_id: 'client-uuid-1',
        due_date: '2024-04-15',
        issued_date: '2024-03-15',
    },
    {
        id: 5,
        amount: 300,
        created_at: '2024-01-01T10:00:00Z',
        invoice_status: InvoiceStatus.Overdue,
        client_id: 'client-uuid-1',
        due_date: '2024-01-31',
        issued_date: '2024-01-01',
    },
];

describe('calculateInvoiceChartData', () => {
    it('should return empty array for empty invoices', () => {
        const result = calculateInvoiceChartData([]);
        expect(result).toHaveLength(0);
    });

    it('should calculate correct amounts by status', () => {
        const result = calculateInvoiceChartData(mockInvoices);

        // Check that we have entries for each status present
        expect(result).toHaveLength(4); // paid, unpaid, draft, overdue

        const paid = result.find((d) => d.name === 'Paid');
        const unpaid = result.find((d) => d.name === 'Unpaid');
        const draft = result.find((d) => d.name === 'Draft');
        const overdue = result.find((d) => d.name === 'Overdue');

        expect(paid?.value).toBe(1500); // 1000 + 500
        expect(unpaid?.value).toBe(750);
        expect(draft?.value).toBe(250);
        expect(overdue?.value).toBe(300);
    });

    it('should assign correct colors to each status', () => {
        const result = calculateInvoiceChartData(mockInvoices);

        const paid = result.find((d) => d.name === 'Paid');
        const unpaid = result.find((d) => d.name === 'Unpaid');
        const draft = result.find((d) => d.name === 'Draft');
        const overdue = result.find((d) => d.name === 'Overdue');

        expect(paid?.color).toBe('#22c55e');
        expect(unpaid?.color).toBe('#f59e0b');
        expect(draft?.color).toBe('#6b7280');
        expect(overdue?.color).toBe('#ef4444');
    });

    it('should exclude statuses with zero amount', () => {
        const paidOnlyInvoices: ClientInvoice[] = [
            {
                id: 1,
                amount: 100,
                created_at: '2024-01-15T10:00:00Z',
                invoice_status: InvoiceStatus.Paid,
                client_id: 'client-uuid-1',
                due_date: '2024-02-15',
                issued_date: '2024-01-15',
            },
        ];

        const result = calculateInvoiceChartData(paidOnlyInvoices);

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Paid');
        expect(result[0].value).toBe(100);
    });

    it('should handle invoices with only unpaid status', () => {
        const unpaidInvoices: ClientInvoice[] = [
            {
                id: 1,
                amount: 200,
                created_at: '2024-01-15T10:00:00Z',
                invoice_status: InvoiceStatus.Unpaid,
                client_id: 'client-uuid-1',
                due_date: '2024-02-15',
                issued_date: '2024-01-15',
            },
            {
                id: 2,
                amount: 300,
                created_at: '2024-01-16T10:00:00Z',
                invoice_status: InvoiceStatus.Unpaid,
                client_id: 'client-uuid-1',
                due_date: '2024-02-16',
                issued_date: '2024-01-16',
            },
        ];

        const result = calculateInvoiceChartData(unpaidInvoices);

        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Unpaid');
        expect(result[0].value).toBe(500);
    });
});

describe('calculateTotalAmount', () => {
    it('should return 0 for empty invoices', () => {
        const result = calculateTotalAmount([]);
        expect(result).toBe(0);
    });

    it('should calculate total amount correctly', () => {
        const result = calculateTotalAmount(mockInvoices);
        // 1000 + 500 + 750 + 250 + 300 = 2800
        expect(result).toBe(2800);
    });

    it('should handle single invoice', () => {
        const singleInvoice: ClientInvoice[] = [
            {
                id: 1,
                amount: 999.99,
                created_at: '2024-01-15T10:00:00Z',
                invoice_status: InvoiceStatus.Paid,
                client_id: 'client-uuid-1',
                due_date: '2024-02-15',
                issued_date: '2024-01-15',
            },
        ];

        const result = calculateTotalAmount(singleInvoice);
        expect(result).toBe(999.99);
    });
});

describe('formatCurrency', () => {
    it('should format positive numbers as USD currency', () => {
        expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('should format zero', () => {
        expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should format large numbers with commas', () => {
        expect(formatCurrency(1000000)).toBe('$1,000,000.00');
    });

    it('should format small decimal amounts', () => {
        expect(formatCurrency(0.99)).toBe('$0.99');
    });

    it('should handle negative numbers', () => {
        expect(formatCurrency(-500)).toBe('-$500.00');
    });
});

describe('formatDate', () => {
    it('should format ISO date string to readable format', () => {
        const result = formatDate('2024-01-15T10:00:00Z');
        expect(result).toBe('Jan 15, 2024');
    });

    it('should format date-only string', () => {
        const result = formatDate('2024-12-25');
        expect(result).toBe('Dec 25, 2024');
    });

    it('should handle different months', () => {
        expect(formatDate('2024-06-01')).toBe('Jun 1, 2024');
        expect(formatDate('2024-11-30')).toBe('Nov 30, 2024');
    });
});

describe('getStatusClass', () => {
    it('should return correct class for Paid status', () => {
        expect(getStatusClass(InvoiceStatus.Paid)).toBe('status-paid');
    });

    it('should return correct class for Unpaid status', () => {
        expect(getStatusClass(InvoiceStatus.Unpaid)).toBe('status-unpaid');
    });

    it('should return correct class for Draft status', () => {
        expect(getStatusClass(InvoiceStatus.Draft)).toBe('status-draft');
    });

    it('should return correct class for Overdue status', () => {
        expect(getStatusClass(InvoiceStatus.Overdue)).toBe('status-overdue');
    });

    it('should return empty string for unknown status', () => {
        // Test with a value that doesn't match any case
        const unknownStatus = 'unknown' as InvoiceStatus;
        expect(getStatusClass(unknownStatus)).toBe('');
    });
});

describe('integration: invoice data flow', () => {
    it('should correctly process a typical client invoice history', () => {
        // Simulate a client with mixed invoice statuses
        const clientInvoices: ClientInvoice[] = [
            {
                id: 101,
                amount: 5000,
                created_at: '2024-01-01T00:00:00Z',
                invoice_status: InvoiceStatus.Paid,
                client_id: 'test-client',
                due_date: '2024-01-31',
                issued_date: '2024-01-01',
            },
            {
                id: 102,
                amount: 2500,
                created_at: '2024-02-01T00:00:00Z',
                invoice_status: InvoiceStatus.Paid,
                client_id: 'test-client',
                due_date: '2024-02-28',
                issued_date: '2024-02-01',
            },
            {
                id: 103,
                amount: 1500,
                created_at: '2024-03-01T00:00:00Z',
                invoice_status: InvoiceStatus.Unpaid,
                client_id: 'test-client',
                due_date: '2024-03-31',
                issued_date: '2024-03-01',
            },
        ];

        // Calculate totals
        const total = calculateTotalAmount(clientInvoices);
        expect(total).toBe(9000);

        // Calculate chart data
        const chartData = calculateInvoiceChartData(clientInvoices);
        expect(chartData).toHaveLength(2); // paid and unpaid

        const paidData = chartData.find((d) => d.name === 'Paid');
        const unpaidData = chartData.find((d) => d.name === 'Unpaid');

        expect(paidData?.value).toBe(7500); // 5000 + 2500
        expect(unpaidData?.value).toBe(1500);

        // Verify formatting
        expect(formatCurrency(total)).toBe('$9,000.00');
        expect(formatCurrency(paidData?.value ?? 0)).toBe('$7,500.00');
    });
});

// Expense helper tests
const mockExpenses: ClientExpense[] = [
    {
        id: 'expense-1',
        amount: 150,
        category: 'Office Supplies',
        date: '2024-01-15',
        description: 'Printer paper',
        vendor: 'Staples',
        created_at: '2024-01-15T10:00:00Z',
        client_id: 'client-uuid-1',
    },
    {
        id: 'expense-2',
        amount: 500,
        category: 'Software & Subscriptions',
        date: '2024-02-01',
        description: 'Annual license',
        vendor: 'Adobe',
        created_at: '2024-02-01T10:00:00Z',
        client_id: 'client-uuid-1',
    },
    {
        id: 'expense-3',
        amount: 75,
        category: 'Office Supplies',
        date: '2024-02-15',
        description: 'Notebooks',
        vendor: 'Amazon',
        created_at: '2024-02-15T10:00:00Z',
        client_id: 'client-uuid-1',
    },
    {
        id: 'expense-4',
        amount: 200,
        category: 'Travel',
        date: '2024-03-01',
        description: 'Client meeting',
        created_at: '2024-03-01T10:00:00Z',
        client_id: 'client-uuid-1',
    },
];

describe('calculateExpenseTotal', () => {
    it('should return 0 for empty expenses', () => {
        const result = calculateExpenseTotal([]);
        expect(result).toBe(0);
    });

    it('should calculate total expense amount correctly', () => {
        const result = calculateExpenseTotal(mockExpenses);
        // 150 + 500 + 75 + 200 = 925
        expect(result).toBe(925);
    });

    it('should handle single expense', () => {
        const singleExpense: ClientExpense[] = [
            {
                id: 'expense-1',
                amount: 99.99,
                category: 'Other',
                date: '2024-01-01',
                created_at: '2024-01-01T10:00:00Z',
            },
        ];
        const result = calculateExpenseTotal(singleExpense);
        expect(result).toBe(99.99);
    });
});

describe('groupExpensesByCategory', () => {
    it('should return empty array for no expenses', () => {
        const result = groupExpensesByCategory([]);
        expect(result).toHaveLength(0);
    });

    it('should group expenses by category and sum amounts', () => {
        const result = groupExpensesByCategory(mockExpenses);

        // Should have 3 categories: Office Supplies, Software & Subscriptions, Travel
        expect(result).toHaveLength(3);

        // Office Supplies: 150 + 75 = 225
        const officeSupplies = result.find((r) => r.category === 'Office Supplies');
        expect(officeSupplies?.total).toBe(225);

        // Software & Subscriptions: 500
        const software = result.find((r) => r.category === 'Software & Subscriptions');
        expect(software?.total).toBe(500);

        // Travel: 200
        const travel = result.find((r) => r.category === 'Travel');
        expect(travel?.total).toBe(200);
    });

    it('should sort results by total descending', () => {
        const result = groupExpensesByCategory(mockExpenses);

        // Software (500) should be first, then Office Supplies (225), then Travel (200)
        expect(result[0].category).toBe('Software & Subscriptions');
        expect(result[0].total).toBe(500);
        expect(result[1].category).toBe('Office Supplies');
        expect(result[1].total).toBe(225);
        expect(result[2].category).toBe('Travel');
        expect(result[2].total).toBe(200);
    });

    it('should handle single category', () => {
        const singleCategoryExpenses: ClientExpense[] = [
            {
                id: 'e1',
                amount: 100,
                category: 'Travel',
                date: '2024-01-01',
                created_at: '2024-01-01T00:00:00Z',
            },
            {
                id: 'e2',
                amount: 200,
                category: 'Travel',
                date: '2024-01-02',
                created_at: '2024-01-02T00:00:00Z',
            },
        ];

        const result = groupExpensesByCategory(singleCategoryExpenses);
        expect(result).toHaveLength(1);
        expect(result[0].category).toBe('Travel');
        expect(result[0].total).toBe(300);
    });
});

describe('integration: expense data flow', () => {
    it('should correctly process a typical client expense history', () => {
        // Calculate total
        const total = calculateExpenseTotal(mockExpenses);
        expect(total).toBe(925);

        // Group by category
        const byCategory = groupExpensesByCategory(mockExpenses);
        expect(byCategory).toHaveLength(3);

        // Verify the highest category
        expect(byCategory[0].category).toBe('Software & Subscriptions');

        // Verify formatting
        expect(formatCurrency(total)).toBe('$925.00');
    });
});
