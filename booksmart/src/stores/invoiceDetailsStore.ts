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
  statusFilter: string;
  searchTerm: string;

  // Actions
  setInvoices: (invoices: InvoiceDetail[]) => void;
  setFilteredInvoices: (invoices: InvoiceDetail[]) => void;
  setExpandedInvoiceId: (id: string | number | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setDateRange: (dateRange: { startDate: string; endDate: string }) => void;
  setStatusFilter: (filter: string) => void;
  setSearchTerm: (term: string) => void;

  // Data fetching
  fetchInvoiceDetails: () => Promise<void>;
  applyFilters: () => void;

  // Utilities
  getTotals: () => {
    paidCount: number;
    paidAmount: number;
    outstandingCount: number;
    outstandingAmount: number;
  };
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
  statusFilter: 'all',
  searchTerm: '',

  setInvoices: (invoices) => set({ invoices }),
  setFilteredInvoices: (filteredInvoices) => set({ filteredInvoices }),
  setExpandedInvoiceId: (expandedInvoiceId) => set({ expandedInvoiceId }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setDateRange: (dateRange) => set({ dateRange }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),

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

        // Generate line items from invoice data
        // Since we don't have a separate line_items table, create a single line item from the invoice total
        const lineItems: InvoiceLineItem[] = [
          {
            id: `${invoice.id}-1`,
            description: 'Services',
            quantity: 1,
            rate: Number(invoice.amount),
            amount: Number(invoice.amount),
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
          total: Number(invoice.amount),
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
