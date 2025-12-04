import { create } from 'zustand';
import { supabase } from '../lib/supabase';

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

interface InvoiceDetailsState {
  invoices: InvoiceDetail[];
  filteredInvoices: InvoiceDetail[];
  expandedInvoiceId: string | number | null;
  isLoading: boolean;
  error: string | null;

  // Filter states
  dateRange: {
    startDate: string;
    endDate: string;
  };
  datePreset: string;
  statusFilter: string;
  searchTerm: string;

  // Actions
  setInvoices: (invoices: InvoiceDetail[]) => void;
  setFilteredInvoices: (invoices: InvoiceDetail[]) => void;
  setExpandedInvoiceId: (id: string | number | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setDateRange: (dateRange: { startDate: string; endDate: string }) => void;
  setDatePreset: (preset: string) => void;
  setStatusFilter: (filter: string) => void;
  setSearchTerm: (term: string) => void;

  // Data fetching
  fetchInvoiceDetails: () => Promise<void>;
  deleteInvoice: (invoiceId: string | number) => Promise<boolean>;
  applyFilters: () => void;

  // Utilities
  getTotals: () => {
    paidCount: number;
    paidAmount: number;
    outstandingCount: number;
    outstandingAmount: number;
  };
  getDateRangeFromPreset: (preset: string) => { startDate: string; endDate: string };
}

export const useInvoiceDetailsStore = create<InvoiceDetailsState>((set, get) => ({
  invoices: [],
  filteredInvoices: [],
  expandedInvoiceId: null,
  isLoading: false,
  error: null,
  dateRange: {
    startDate: '',
    endDate: '',
  },
  datePreset: 'all',
  statusFilter: 'all',
  searchTerm: '',

  setInvoices: (invoices) => set({ invoices }),
  setFilteredInvoices: (filteredInvoices) => set({ filteredInvoices }),
  setExpandedInvoiceId: (expandedInvoiceId) => set({ expandedInvoiceId }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setDateRange: (dateRange) => set({ dateRange, datePreset: 'custom' }),
  setDatePreset: (preset: string) => {
    const { getDateRangeFromPreset } = get();
    const dateRange = getDateRangeFromPreset(preset);
    set({ datePreset: preset, dateRange });
  },
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),

  getDateRangeFromPreset: (preset: string) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    
    switch (preset) {
      case 'this-month': {
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);
        return { startDate: formatDate(startDate), endDate: formatDate(endDate) };
      }
      case 'this-quarter': {
        const quarterStart = Math.floor(month / 3) * 3;
        const startDate = new Date(year, quarterStart, 1);
        const endDate = new Date(year, quarterStart + 3, 0);
        return { startDate: formatDate(startDate), endDate: formatDate(endDate) };
      }
      case 'this-year': {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        return { startDate: formatDate(startDate), endDate: formatDate(endDate) };
      }
      case 'last-year': {
        const startDate = new Date(year - 1, 0, 1);
        const endDate = new Date(year - 1, 11, 31);
        return { startDate: formatDate(startDate), endDate: formatDate(endDate) };
      }
      case 'all':
      default:
        return { startDate: '', endDate: '' };
    }
  },

  fetchInvoiceDetails: async () => {
    const { setLoading, setError, setInvoices } = get();

    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

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

      // Convert to InvoiceDetail format
      const invoiceDetails: InvoiceDetail[] = invoices?.map((invoice: any) => {
        const issueDate = new Date(invoice.issued_date || invoice.created_at);
        const dueDate = new Date(invoice.due_date);
        const now = new Date();
        
        // Determine status - check if overdue
        let status = invoice.invoice_status;
        if (status === 'unpaid' && dueDate < now) {
          status = 'overdue';
        }

        const total = Number(invoice.amount);
        // For paid invoices, amount_paid equals total; for others, it's 0 (or could come from a payments table)
        const amountPaid = status === 'paid' ? total : 0;
        const amountDue = total - amountPaid;

        // Generate line items from invoice data
        // Since we don't have a separate line_items table, create a single line item from the invoice total
        const lineItems: InvoiceLineItem[] = [
          {
            id: `${invoice.id}-1`,
            description: 'Services',
            quantity: 1,
            rate: total,
            amount: total,
          }
        ];

        return {
          id: invoice.id,
          invoiceNumber: `INV-${String(invoice.id).padStart(4, '0')}`,
          clientId: invoice.client_id,
          clientName: invoice.clients?.name || 'Unknown Client',
          clientCompany: invoice.clients?.company,
          issueDate,
          dueDate,
          total,
          amountPaid,
          amountDue,
          status,
          lineItems,
        };
      }) || [];

      setInvoices(invoiceDetails);
      get().applyFilters();
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      setError('Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  },

  deleteInvoice: async (invoiceId: string | number) => {
    const { setError, invoices, setInvoices } = get();

    try {
      // Find the invoice to check its status
      const invoice = invoices.find(inv => inv.id === invoiceId);
      if (!invoice) {
        setError('Invoice not found');
        return false;
      }

      if (invoice.status !== 'draft') {
        setError('Only draft invoices can be deleted');
        return false;
      }

      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;

      // Remove from local state
      const updatedInvoices = invoices.filter(inv => inv.id !== invoiceId);
      setInvoices(updatedInvoices);
      get().applyFilters();

      return true;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      setError('Failed to delete invoice');
      return false;
    }
  },

  applyFilters: () => {
    const { invoices, dateRange, statusFilter, searchTerm, setFilteredInvoices } = get();
    let filtered = [...invoices];

    // Date range filter (based on issue date)
    if (dateRange.startDate) {
      const startDate = new Date(dateRange.startDate);
      filtered = filtered.filter(invoice => invoice.issueDate >= startDate);
    }
    if (dateRange.endDate) {
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(invoice => invoice.issueDate <= endDate);
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'outstanding') {
        // Outstanding includes both unpaid and overdue
        filtered = filtered.filter(invoice => 
          invoice.status === 'unpaid' || invoice.status === 'overdue'
        );
      } else {
        filtered = filtered.filter(invoice => invoice.status === statusFilter);
      }
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(term) ||
        invoice.clientName.toLowerCase().includes(term) ||
        invoice.clientCompany?.toLowerCase().includes(term) ||
        invoice.clientId.toLowerCase().includes(term)
      );
    }

    setFilteredInvoices(filtered);
  },

  getTotals: () => {
    const { filteredInvoices } = get();
    
    const paidInvoices = filteredInvoices.filter(inv => inv.status === 'paid');
    const outstandingInvoices = filteredInvoices.filter(inv => 
      inv.status === 'unpaid' || inv.status === 'overdue'
    );

    return {
      paidCount: paidInvoices.length,
      paidAmount: paidInvoices.reduce((sum, inv) => sum + inv.total, 0),
      outstandingCount: outstandingInvoices.length,
      outstandingAmount: outstandingInvoices.reduce((sum, inv) => sum + inv.total, 0),
    };
  },
}));
