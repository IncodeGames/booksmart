import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { LedgerEntry, Expense, Invoice } from '../types';

interface LedgerState {
  entries: LedgerEntry[];
  filteredEntries: LedgerEntry[];
  isLoading: boolean;
  error: string | null;

  // Filter states
  dateRange: {
    startDate: string;
    endDate: string;
  };
  typeFilter: string;
  searchTerm: string;

  // Actions
  setEntries: (entries: LedgerEntry[]) => void;
  setFilteredEntries: (entries: LedgerEntry[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setDateRange: (dateRange: { startDate: string; endDate: string }) => void;
  setTypeFilter: (filter: string) => void;
  setSearchTerm: (term: string) => void;

  // Data fetching
  fetchLedgerData: () => Promise<void>;
  applyFilters: () => void;

  // Utilities
  getTotals: () => { totalDebits: number; totalCredits: number; netAmount: number };
}

export const useLedgerStore = create<LedgerState>((set, get) => ({
  entries: [],
  filteredEntries: [],
  isLoading: false,
  error: null,
  dateRange: {
    startDate: '',
    endDate: '',
  },
  typeFilter: 'all',
  searchTerm: '',

  setEntries: (entries) => set({ entries }),
  setFilteredEntries: (filteredEntries) => set({ filteredEntries }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setDateRange: (dateRange) => set({ dateRange }),
  setTypeFilter: (typeFilter) => set({ typeFilter }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),

  fetchLedgerData: async () => {
    const { setLoading, setError, setEntries } = get();

    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Fetch expenses
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (expensesError) throw expensesError;

      // Fetch invoices with client information
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          *,
          clients (
            id,
            name,
            email,
            company
          )
        `)
        .eq('user_id', user.id)
        .order('issued_date', { ascending: false });

      if (invoicesError) throw invoicesError;

      // TODO: Fetch payments from payments table when available
      // For now, create mock payment entries for paid invoices
      const mockPayments = invoices
        ?.filter((invoice: any) => invoice.invoice_status === 'paid')
        .map((invoice: any) => ({
          id: `payment-${invoice.id}`,
          date: new Date(invoice.issued_date || invoice.created_at),
          type: 'payment' as const,
          description: `Payment received for Invoice #${invoice.id}`,
          client: invoice.clients?.company || invoice.clients?.name || 'Unknown Client',
          debit: 0,
          credit: Number(invoice.amount),
          status: 'received',
          reference: `INV-${invoice.id}`,
        })) || [];

      // Convert expenses to ledger entries
      const expenseEntries: LedgerEntry[] = expenses?.map((expense: Expense) => ({
        id: expense.id,
        date: new Date(expense.date),
        type: 'expense' as const,
        description: expense.description || `${expense.category} expense`,
        vendor: expense.vendor || undefined,
        category: expense.category,
        debit: Number(expense.amount),
        credit: 0,
        reference: expense.id.slice(0, 8),
      })) || [];

      // Convert invoices to ledger entries
      const invoiceEntries: LedgerEntry[] = invoices?.map((invoice: any) => ({
        id: `invoice-${invoice.id}`,
        date: new Date(invoice.issued_date || invoice.created_at),
        type: 'invoice' as const,
        description: `Invoice #${invoice.id}`,
        client: invoice.clients?.company || invoice.clients?.name || 'Unknown Client',
        debit: 0,
        credit: Number(invoice.amount),
        status: invoice.invoice_status,
        reference: `INV-${invoice.id}`,
      })) || [];

      // Combine all entries and sort by date (most recent first)
      const allEntries = [...expenseEntries, ...invoiceEntries, ...mockPayments]
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      // Calculate running balance
      let runningBalance = 0;
      const entriesWithBalance = allEntries.map(entry => {
        runningBalance += entry.credit - entry.debit;
        return {
          ...entry,
          balance: runningBalance,
        };
      });

      setEntries(entriesWithBalance);
      get().applyFilters();
    } catch (error) {
      console.error('Error fetching ledger data:', error);
      setError('Failed to load general ledger data');
    } finally {
      setLoading(false);
    }
  },

  applyFilters: () => {
    const { entries, dateRange, typeFilter, searchTerm, setFilteredEntries } = get();
    let filtered = [...entries];

    // Date range filter
    if (dateRange.startDate) {
      const startDate = new Date(dateRange.startDate);
      filtered = filtered.filter(entry => entry.date >= startDate);
    }
    if (dateRange.endDate) {
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(entry => entry.date <= endDate);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(entry => entry.type === typeFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.description.toLowerCase().includes(term) ||
        entry.vendor?.toLowerCase().includes(term) ||
        entry.client?.toLowerCase().includes(term) ||
        entry.category?.toLowerCase().includes(term)
      );
    }

    setFilteredEntries(filtered);
  },

  getTotals: () => {
    const { filteredEntries } = get();
    const totalDebits = filteredEntries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredits = filteredEntries.reduce((sum, entry) => sum + entry.credit, 0);
    const netAmount = totalCredits - totalDebits;

    return { totalDebits, totalCredits, netAmount };
  },
}));
