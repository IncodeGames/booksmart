import React, { useEffect } from 'react';
import { useInvoiceDetailsStore } from '../../stores/invoiceDetailsStore';
import DropdownButton, { DropdownOption } from '../DropdownButton';
import '../styles/InvoiceDetails.css';

interface InvoiceDetailsProps {
  onBack: () => void;
}

/**
 * Invoice Details report component that displays all invoices
 * Shows invoice list with expandable line items and summary totals for paid/outstanding invoices
 */
const InvoiceDetails = ({ onBack }: InvoiceDetailsProps) => {
  const {
    filteredInvoices,
    expandedInvoiceId,
    isLoading,
    error,
    dateRange,
    statusFilter,
    searchTerm,
    setDateRange,
    setStatusFilter,
    setSearchTerm,
    setExpandedInvoiceId,
    fetchInvoiceDetails,
    applyFilters,
    getTotals
  } = useInvoiceDetailsStore();

  useEffect(() => {
    fetchInvoiceDetails();
  }, [fetchInvoiceDetails]);

  useEffect(() => {
    applyFilters();
  }, [dateRange, statusFilter, searchTerm, applyFilters]);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return '✅';
      case 'unpaid': return '⏳';
      case 'overdue': return '⚠️';
      case 'draft': return '📝';
      default: return '📄';
    }
  };

  const toggleInvoiceExpand = (invoiceId: string | number) => {
    setExpandedInvoiceId(expandedInvoiceId === invoiceId ? null : invoiceId);
  };

  const { paidCount, paidAmount, outstandingCount, outstandingAmount } = getTotals();

  // Export to CSV functionality
  const exportToCSV = () => {
    const headers = ['Client ID', 'Invoice Number', 'Issue Date', 'Due Date', 'Total', 'Status'];
    
    const csvData = filteredInvoices.map(invoice => [
      invoice.clientId,
      invoice.invoiceNumber,
      formatDate(invoice.issueDate),
      formatDate(invoice.dueDate),
      invoice.total.toFixed(2),
      invoice.status
    ]);

    // Add totals rows
    csvData.push([]);
    csvData.push(['', '', '', 'Paid:', paidAmount.toFixed(2), `${paidCount} invoices`]);
    csvData.push(['', '', '', 'Outstanding:', outstandingAmount.toFixed(2), `${outstandingCount} invoices`]);

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
    link.setAttribute('download', `invoice_details_${new Date().toISOString().split('T')[0]}.csv`);
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
      <div className="invoice-details-loading">
        <div className="loading-spinner"></div>
        <span>Loading invoice details...</span>
      </div>
    );
  }

  return (
    <div className="invoice-details">
      <div className="invoice-details-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Reports
        </button>
        <div className="header-content">
          <div className="header-title-section">
            <h1 className="page-title">Invoice Details</h1>
            <DropdownButton
              label="Actions"
              icon="⚙️"
              options={actionOptions}
              variant="secondary"
              className="header-actions"
            />
          </div>
          <p className="page-subtitle">
            Comprehensive invoice tracking with line item details and payment status
          </p>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={fetchInvoiceDetails}>Retry</button>
        </div>
      )}

      {/* Filters */}
      <div className="invoice-filters">
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
            <label htmlFor="statusFilter">Status:</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="outstanding">Outstanding (Unpaid + Overdue)</option>
              <option value="unpaid">Unpaid</option>
              <option value="overdue">Overdue</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="search">Search:</label>
            <input
              type="text"
              id="search"
              placeholder="Search by invoice #, client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="totals-row">
          <div className="total-item">
            <span className="total-label">Total Paid:</span>
            <span className="total-value paid">{formatCurrency(paidAmount)}</span>
            <span className="total-count">{paidCount} invoice{paidCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="total-item">
            <span className="total-label">Total Outstanding:</span>
            <span className="total-value outstanding">{formatCurrency(outstandingAmount)}</span>
            <span className="total-count">{outstandingCount} invoice{outstandingCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="invoice-table-container">
        <table className="invoice-table">
          <thead>
            <tr>
              <th style={{ width: '30px' }}></th>
              <th>Client ID</th>
              <th>Invoice #</th>
              <th>Issue Date</th>
              <th>Due Date</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="no-data">
                  No invoices found for the selected criteria
                </td>
              </tr>
            ) : (
              filteredInvoices.map((invoice) => (
                <React.Fragment key={invoice.id}>
                  <tr 
                    className={`invoice-row ${invoice.status} ${expandedInvoiceId === invoice.id ? 'expanded' : ''}`}
                    onClick={() => toggleInvoiceExpand(invoice.id)}
                  >
                    <td>
                      <span className={`expand-icon ${expandedInvoiceId === invoice.id ? 'expanded' : ''}`}>
                        ▶
                      </span>
                    </td>
                    <td className="client-id-cell" title={invoice.clientName}>
                      {invoice.clientId.slice(0, 8)}...
                    </td>
                    <td className="invoice-number-cell">{invoice.invoiceNumber}</td>
                    <td className="date-cell">{formatDate(invoice.issueDate)}</td>
                    <td className="date-cell">{formatDate(invoice.dueDate)}</td>
                    <td className="total-cell">{formatCurrency(invoice.total)}</td>
                    <td className="status-cell">
                      <span className={`status-badge ${invoice.status}`}>
                        {getStatusIcon(invoice.status)} {invoice.status}
                      </span>
                    </td>
                  </tr>
                  {expandedInvoiceId === invoice.id && (
                    <tr className="line-items-row">
                      <td colSpan={7}>
                        <div className="line-items-container">
                          <div className="line-items-header">
                            📋 Line Items for {invoice.invoiceNumber}
                            {invoice.clientCompany && (
                              <span style={{ fontWeight: 'normal', marginLeft: '8px', color: '#6b7280' }}>
                                ({invoice.clientCompany})
                              </span>
                            )}
                          </div>
                          <table className="line-items-table">
                            <thead>
                              <tr>
                                <th>Description</th>
                                <th style={{ textAlign: 'center' }}>Qty</th>
                                <th style={{ textAlign: 'center' }}>Rate</th>
                                <th style={{ textAlign: 'right' }}>Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {invoice.lineItems.map((item) => (
                                <tr key={item.id}>
                                  <td>{item.description}</td>
                                  <td className="quantity-cell">{item.quantity}</td>
                                  <td className="rate-cell">{formatCurrency(item.rate)}</td>
                                  <td className="amount-cell">{formatCurrency(item.amount)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredInvoices.length > 0 && (
        <div className="invoice-footer">
          <div className="results-count">
            Showing {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetails;
