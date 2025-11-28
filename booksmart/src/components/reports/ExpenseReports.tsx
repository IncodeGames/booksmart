import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Expense } from '../../types';
import DropdownButton, { DropdownOption } from '../DropdownButton';
import '../styles/ExpenseReports.css';

interface ExpenseReportsProps {
  onBack: () => void;
}

interface ExpenseReportEntry {
  id: string;
  date: Date;
  category: string;
  description: string;
  vendor: string;
  amount: number;
  paymentMethod: string;
  reference: string;
}

interface ExpenseState {
  entries: ExpenseReportEntry[];
  filteredEntries: ExpenseReportEntry[];
  isLoading: boolean;
  error: string | null;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  categoryFilter: string;
  searchTerm: string;
}

/**
 * Expense Reports component that displays detailed expense analysis
 * Shows expenses organized by category with filtering and export capabilities
 */
const ExpenseReports = ({ onBack }: ExpenseReportsProps) => {
  const [state, setState] = useState<ExpenseState>({
    entries: [],
    filteredEntries: [],
    isLoading: false,
    error: null,
    dateRange: {
      startDate: '',
      endDate: '',
    },
    categoryFilter: 'all',
    searchTerm: '',
  });

  const fetchExpenseData = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
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

      // Convert expenses to report entries
      const expenseEntries: ExpenseReportEntry[] = expenses?.map((expense: Expense) => ({
        id: expense.id,
        date: new Date(expense.date),
        category: expense.category,
        description: expense.description || 'No description',
        vendor: expense.vendor || 'Unknown Vendor',
        amount: Number(expense.amount),
        paymentMethod: expense.payment_method || 'Not specified',
        reference: expense.id.slice(0, 8).toUpperCase(),
      })) || [];

      setState(prev => ({ 
        ...prev, 
        entries: expenseEntries,
        isLoading: false 
      }));

    } catch (error) {
      console.error('Error fetching expense data:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to load expense data',
        isLoading: false 
      }));
    }
  };

  const applyFilters = () => {
    let filtered = [...state.entries];

    // Date range filter
    if (state.dateRange.startDate) {
      const startDate = new Date(state.dateRange.startDate);
      filtered = filtered.filter(entry => entry.date >= startDate);
    }
    if (state.dateRange.endDate) {
      const endDate = new Date(state.dateRange.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(entry => entry.date <= endDate);
    }

    // Category filter
    if (state.categoryFilter !== 'all') {
      filtered = filtered.filter(entry => entry.category === state.categoryFilter);
    }

    // Search filter
    if (state.searchTerm) {
      const term = state.searchTerm.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.description.toLowerCase().includes(term) ||
        entry.vendor.toLowerCase().includes(term) ||
        entry.category.toLowerCase().includes(term) ||
        entry.paymentMethod.toLowerCase().includes(term)
      );
    }

    setState(prev => ({ ...prev, filteredEntries: filtered }));
  };

  useEffect(() => {
    fetchExpenseData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [state.dateRange, state.categoryFilter, state.searchTerm, state.entries]);

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

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Office Supplies': '📝',
      'Software & Subscriptions': '💻',
      'Travel': '✈️',
      'Meals & Entertainment': '🍽️',
      'Marketing & Advertising': '📢',
      'Professional Services': '🏢',
      'Utilities': '⚡',
      'Rent': '🏠',
      'Insurance': '🛡️',
      'Equipment': '🔧',
      'Training & Education': '📚',
      'Other': '📁',
    };
    return icons[category] || '💸';
  };

  const getUniqueCategories = () => {
    const categories = Array.from(new Set(state.entries.map(entry => entry.category)));
    return categories.sort();
  };

  const getTotals = () => {
    const totalAmount = state.filteredEntries.reduce((sum, entry) => sum + entry.amount, 0);
    const categoryTotals = state.filteredEntries.reduce((acc, entry) => {
      acc[entry.category] = (acc[entry.category] || 0) + entry.amount;
      return acc;
    }, {} as Record<string, number>);
    
    return { totalAmount, categoryTotals };
  };

  // Export to CSV functionality
  const exportToCSV = () => {
    const headers = ['Date', 'Category', 'Description', 'Vendor', 'Payment Method', 'Amount', 'Reference'];
    
    const csvData = state.filteredEntries.map(entry => [
      formatDate(entry.date),
      entry.category,
      entry.description,
      entry.vendor,
      entry.paymentMethod,
      entry.amount.toFixed(2),
      entry.reference,
    ]);

    // Add totals by category
    csvData.push([]);
    csvData.push(['CATEGORY TOTALS:']);
    const { categoryTotals, totalAmount } = getTotals();
    Object.entries(categoryTotals).forEach(([category, total]) => {
      csvData.push(['', category, '', '', '', total.toFixed(2), '']);
    });
    csvData.push([]);
    csvData.push(['', '', '', '', 'GRAND TOTAL:', totalAmount.toFixed(2), '']);

    // Convert to CSV string
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `expense_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print functionality
  const handlePrint = () => {
    window.print();
  };

  // Dropdown options for actions
  const actionOptions: DropdownOption[] = [
    {
      label: 'Export as CSV',
      value: 'export-csv',
      icon: '📊',
      onClick: exportToCSV
    },
    {
      label: 'Print',
      value: 'print',
      icon: '🖨️',
      onClick: handlePrint
    }
  ];

  const { totalAmount, categoryTotals } = getTotals();

  if (state.isLoading) {
    return (
      <div className="expense-reports-loading">
        <div className="loading-spinner"></div>
        <span>Loading expense reports...</span>
      </div>
    );
  }

  return (
    <div className="expense-reports">
      <div className="expense-reports-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Reports
        </button>
        <div className="header-content">
          <div className="header-title-section">
            <h1 className="page-title">Expense Reports</h1>
            <DropdownButton
              label="Actions"
              icon="⚙️"
              options={actionOptions}
              variant="secondary"
              className="header-actions"
            />
          </div>
          <p className="page-subtitle">
            Detailed breakdown of business expenses by category and time period
          </p>
        </div>
      </div>

      {state.error && (
        <div className="error-banner">
          <span>{state.error}</span>
          <button onClick={fetchExpenseData}>Retry</button>
        </div>
      )}

      {/* Filters */}
      <div className="expense-filters">
        <div className="filters-row">
          <div className="filter-group">
            <label htmlFor="startDate">Start Date:</label>
            <input
              type="date"
              id="startDate"
              value={state.dateRange.startDate}
              onChange={(e) => setState(prev => ({ 
                ...prev, 
                dateRange: { ...prev.dateRange, startDate: e.target.value } 
              }))}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="endDate">End Date:</label>
            <input
              type="date"
              id="endDate"
              value={state.dateRange.endDate}
              onChange={(e) => setState(prev => ({ 
                ...prev, 
                dateRange: { ...prev.dateRange, endDate: e.target.value } 
              }))}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="categoryFilter">Category:</label>
            <select
              id="categoryFilter"
              value={state.categoryFilter}
              onChange={(e) => setState(prev => ({ ...prev, categoryFilter: e.target.value }))}
            >
              <option value="all">All Categories</option>
              {getUniqueCategories().map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="search">Search:</label>
            <input
              type="text"
              id="search"
              placeholder="Search descriptions, vendors, categories..."
              value={state.searchTerm}
              onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
            />
          </div>
        </div>

        <div className="summary-row">
          <div className="summary-item">
            <span className="summary-label">Total Expenses:</span>
            <span className="summary-value expense-total">{formatCurrency(totalAmount)}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Records:</span>
            <span className="summary-value">{state.filteredEntries.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Average Amount:</span>
            <span className="summary-value">
              {state.filteredEntries.length > 0 
                ? formatCurrency(totalAmount / state.filteredEntries.length)
                : formatCurrency(0)
              }
            </span>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {Object.keys(categoryTotals).length > 0 && (
        <div className="category-breakdown">
          <h3>Expenses by Category</h3>
          <div className="category-grid">
            {Object.entries(categoryTotals)
              .sort(([,a], [,b]) => b - a)
              .map(([category, amount]) => (
                <div key={category} className="category-card">
                  <div className="category-header">
                    <span className="category-icon">{getCategoryIcon(category)}</span>
                    <span className="category-name">{category}</span>
                  </div>
                  <div className="category-amount">{formatCurrency(amount)}</div>
                  <div className="category-percentage">
                    {((amount / totalAmount) * 100).toFixed(1)}% of total
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* Expense Table */}
      <div className="expense-table-container">
        <table className="expense-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th>Vendor</th>
              <th>Payment Method</th>
              <th>Amount</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {state.filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={7} className="no-data">
                  No expenses found for the selected criteria
                </td>
              </tr>
            ) : (
              state.filteredEntries.map((entry) => (
                <tr key={entry.id} className="expense-row">
                  <td className="date-cell">{formatDate(entry.date)}</td>
                  <td className="category-cell">
                    <span className="category-badge">
                      {getCategoryIcon(entry.category)} {entry.category}
                    </span>
                  </td>
                  <td className="description-cell">
                    <span className="description-text">{entry.description}</span>
                  </td>
                  <td className="vendor-cell">
                    {entry.vendor}
                  </td>
                  <td className="payment-cell">
                    {entry.paymentMethod}
                  </td>
                  <td className="amount-cell">
                    {formatCurrency(entry.amount)}
                  </td>
                  <td className="reference-cell">
                    {entry.reference}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {state.filteredEntries.length > 0 && (
        <div className="expense-footer">
          <div className="results-count">
            Showing {state.filteredEntries.length} expenses
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseReports;
