import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import '../styles/GeneralLedger.css';

interface LedgerEntry {
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

interface GeneralLedgerProps {
  onBack: () => void;
}

/**
 * General Ledger component that displays all financial transactions
 * Shows expenses, invoices, and payments in chronological order with running balance
 */
const GeneralLedger = (onBack: GeneralLedgerProps) => {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLedgerData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [entries, dateRange, typeFilter, searchTerm]);

  const fetchLedgerData = async () => {
    try {
      setIsLoading(true);
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
            company_name,
            contact_name
          )
        `)
        .eq('user_id', user.id)
        .order('issued_date', { ascending: false });

      if (invoicesError) throw invoicesError;

      // For now, we'll create mock payment entries since there's no payments table
      // In a real implementation, you'd fetch from a payments table
      const mockPayments = invoices
        ?.filter(invoice => invoice.invoice_status === 'paid')
        .map(invoice => ({
          id: `payment-${invoice.id}`,
          date: new Date(invoice.issued_date || invoice.created_at),
          type: 'payment' as const,
          description: `Payment received for Invoice #${invoice.id}`,
          client: invoice.clients?.company_name || invoice.clients?.contact_name || 'Unknown Client',
          debit: 0,
          credit: Number(invoice.amount),
          status: 'received',
          reference: `INV-${invoice.id}`,
        })) || [];

      // Convert expenses to ledger entries
      const expenseEntries: LedgerEntry[] = expenses?.map(expense => ({
        id: expense.id,
        date: new Date(expense.date),
        type: 'expense',
        description: expense.description || `${expense.category} expense`,
        vendor: expense.vendor || undefined,
        category: expense.category,
        debit: Number(expense.amount),
        credit: 0,
        reference: expense.id.slice(0, 8),
      })) || [];

      // Convert invoices to ledger entries
      const invoiceEntries: LedgerEntry[] = invoices?.map(invoice => ({
        id: `invoice-${invoice.id}`,
        date: new Date(invoice.issued_date || invoice.created_at),
        type: 'invoice',
        description: `Invoice #${invoice.id}`,
        client: invoice.clients?.company_name || invoice.clients?.contact_name || 'Unknown Client',
        debit: 0,
        credit: Number(invoice.amount),
        status: invoice.invoice_status,
        reference: `INV-${invoice.id}`,
      })) || [];

      // Combine all entries and sort by date (most recent first)
      const allEntries = [...expenseEntries, ...invoiceEntries, ...mockPayments]
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      // Calculate running balance (simplified - in reality this would be more complex)
      let runningBalance = 0;
      const entriesWithBalance = allEntries.map(entry => {
        runningBalance += entry.credit - entry.debit;
        return {
          ...entry,
          balance: runningBalance,
        };
      });

      setEntries(entriesWithBalance);
    } catch (error) {
      console.error('Error fetching ledger data:', error);
      setError('Failed to load general ledger data');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...entries];

    // Date range filter
    if (dateRange.startDate) {
      const startDate = new Date(dateRange.startDate);
      filtered = filtered.filter(entry => entry.date >= startDate);
    }
    if (dateRange.endDate) {
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999); // End of day
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
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'expense': return '💸';
      case 'invoice': return '🧾';
      case 'payment': return '💰';
      default: return '📝';
    }
  };

  const getTypeClass = (type: string) => {
    switch (type) {
      case 'expense': return 'expense';
      case 'invoice': return 'invoice';
      case 'payment': return 'payment';
      default: return '';
    }
  };

  const getTotals = () => {
    const totalDebits = filteredEntries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredits = filteredEntries.reduce((sum, entry) => sum + entry.credit, 0);
    const netAmount = totalCredits - totalDebits;

    return { totalDebits, totalCredits, netAmount };
  };

  const { totalDebits, totalCredits, netAmount } = getTotals();

  if (isLoading) {
    return (
      <div className="general-ledger-loading">
        <div className="loading-spinner"></div>
        <span>Loading general ledger...</span>
      </div>
    );
  }

  return (
    <div className="general-ledger">
      <div className="general-ledger-header">
        <div className="header-top">
          <button className="back-button" onClick={onBack}>
            ← Back to Reports
          </button>
          <h1 className="page-title">General Ledger</h1>
        </div>
        <p className="page-subtitle">
          Complete record of all financial transactions organized by date
        </p>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={fetchLedgerData}>Retry</button>
        </div>
      )}

      {/* Filters */}
      <div className="ledger-filters">
        <div className="filters-row">
          <div className="filter-group">
            <label htmlFor="startDate">Start Date:</label>
            <input
              type="date"
              id="startDate"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="endDate">End Date:</label>
            <input
              type="date"
              id="endDate"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="typeFilter">Type:</label>
            <select
              id="typeFilter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="expense">Expenses</option>
              <option value="invoice">Invoices</option>
              <option value="payment">Payments</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="search">Search:</label>
            <input
              type="text"
              id="search"
              placeholder="Search descriptions, vendors, clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="totals-row">
          <div className="total-item">
            <span className="total-label">Total Debits:</span>
            <span className="total-value debit">{formatCurrency(totalDebits)}</span>
          </div>
          <div className="total-item">
            <span className="total-label">Total Credits:</span>
            <span className="total-value credit">{formatCurrency(totalCredits)}</span>
          </div>
          <div className="total-item">
            <span className="total-label">Net Amount:</span>
            <span className={`total-value ${netAmount >= 0 ? 'credit' : 'debit'}`}>
              {formatCurrency(netAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="ledger-table-container">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Description</th>
              <th>Vendor/Client</th>
              <th>Reference</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={8} className="no-data">
                  No transactions found for the selected criteria
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry) => (
                <tr key={entry.id} className={`ledger-row ${getTypeClass(entry.type)}`}>
                  <td className="date-cell">{formatDate(entry.date)}</td>
                  <td className="type-cell">
                    <span className="type-badge">
                      {getTypeIcon(entry.type)} {entry.type}
                    </span>
                  </td>
                  <td className="description-cell">
                    <div className="description-content">
                      <span className="description-text">{entry.description}</span>
                      {entry.status && (
                        <span className={`status-badge ${entry.status}`}>
                          {entry.status}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="vendor-client-cell">
                    {entry.vendor || entry.client || '-'}
                  </td>
                  <td className="reference-cell">
                    {entry.reference || '-'}
                  </td>
                  <td className="debit-cell">
                    {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                  </td>
                  <td className="credit-cell">
                    {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                  </td>
                  <td className="balance-cell">
                    <span className={entry.balance! >= 0 ? 'positive' : 'negative'}>
                      {formatCurrency(entry.balance!)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredEntries.length > 0 && (
        <div className="ledger-footer">
          <div className="results-count">
            Showing {filteredEntries.length} of {entries.length} transactions
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralLedger;
