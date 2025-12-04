import { useEffect } from 'react';
import { useLedgerStore } from '../../../stores/ledgerStore';
import DropdownButton, { DropdownOption } from '../../../components/DropdownButton';
import '../styles/GeneralLedger.css';

interface GeneralLedgerProps {
  onBack: () => void;
}

/**
 * General Ledger component that displays all financial transactions
 * Shows expenses, invoices, and payments in chronological order with running balance
 */
const GeneralLedger = ({ onBack }: GeneralLedgerProps) => {
  const {
    filteredEntries,
    isLoading,
    error,
    dateRange,
    typeFilter,
    searchTerm,
    setDateRange,
    setTypeFilter,
    setSearchTerm,
    fetchLedgerData,
    applyFilters,
    getTotals
  } = useLedgerStore();

  useEffect(() => {
    fetchLedgerData();
  }, [fetchLedgerData]);

  useEffect(() => {
    applyFilters();
  }, [dateRange, typeFilter, searchTerm, applyFilters]);

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

  const { totalDebits, totalCredits, netAmount } = getTotals();

  // Export to CSV functionality
  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Description', 'Vendor/Client', 'Reference', 'Debit', 'Credit', 'Balance'];
    
    const csvData = filteredEntries.map(entry => [
      formatDate(entry.date),
      entry.type,
      entry.description,
      entry.vendor || entry.client || '',
      entry.reference || '',
      entry.debit > 0 ? entry.debit.toFixed(2) : '',
      entry.credit > 0 ? entry.credit.toFixed(2) : '',
      entry.balance?.toFixed(2) || ''
    ]);

    // Add totals row
    csvData.push([]);
    csvData.push(['', '', '', '', 'TOTALS:', totalDebits.toFixed(2), totalCredits.toFixed(2), netAmount.toFixed(2)]);

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
    link.setAttribute('download', `general_ledger_${new Date().toISOString().split('T')[0]}.csv`);
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
        <button className="back-button" onClick={onBack}>
          ← Back to Reports
        </button>
        <div className="header-content">
          <div className="header-title-section">
            <h1 className="page-title">General Ledger</h1>
            <DropdownButton
              label="Actions"
              icon="⚙️"
              options={actionOptions}
              variant="secondary"
              className="header-actions"
            />
          </div>
          <p className="page-subtitle">
            Complete record of all financial transactions organized by date
          </p>
        </div>
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
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="endDate">End Date:</label>
            <input
              type="date"
              id="endDate"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
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
            Showing {filteredEntries.length} transactions
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralLedger;
