import React, { useEffect, useState } from 'react';
import { useInvoiceDetailsStore } from '../stores/invoiceDetailsStore';
import { supabase } from '../../../lib/supabase';
import DropdownButton, { DropdownOption } from '../../../components/DropdownButton';
import '../styles/InvoiceDetails.css';

interface InvoiceDetailsProps {
  onBack: () => void;
}

interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
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
    datePreset,
    statusFilter,
    searchTerm,
    setDateRange,
    setDatePreset,
    setStatusFilter,
    setSearchTerm,
    setExpandedInvoiceId,
    setError,
    fetchInvoiceDetails,
    deleteInvoice,
    applyFilters,
    getTotals
  } = useInvoiceDetailsStore();

  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailRecipientType, setEmailRecipientType] = useState<'client' | 'custom'>('custom');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('Invoice Details Report');
  const [emailMessage, setEmailMessage] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    fetchInvoiceDetails();
    fetchClients();
  }, [fetchInvoiceDetails]);

  useEffect(() => {
    applyFilters();
  }, [dateRange, statusFilter, searchTerm, applyFilters]);

  const fetchClients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email, company')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
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

  const handleDeleteInvoice = async (e: React.MouseEvent, invoiceId: string | number) => {
    e.stopPropagation(); // Prevent row expansion when clicking delete
    
    if (!window.confirm('Are you sure you want to delete this draft invoice? This action cannot be undone.')) {
      return;
    }

    const success = await deleteInvoice(invoiceId);
    if (success) {
      // Clear expanded state if we deleted the expanded invoice
      if (expandedInvoiceId === invoiceId) {
        setExpandedInvoiceId(null);
      }
    }
  };

  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset);
  };

  const { paidCount, paidAmount, outstandingCount, outstandingAmount } = getTotals();

  // Generate report HTML for email
  const generateReportHTML = () => {
    const reportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const invoiceRows = filteredInvoices.map(invoice => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 8px;">${invoice.clientName}${invoice.clientCompany ? `<br><small style="color: #6b7280;">${invoice.clientCompany}</small>` : ''}</td>
        <td style="padding: 12px 8px; font-weight: 600;">${invoice.invoiceNumber}</td>
        <td style="padding: 12px 8px;">${formatDate(invoice.issueDate)}</td>
        <td style="padding: 12px 8px;">${formatDate(invoice.dueDate)}</td>
        <td style="padding: 12px 8px; text-align: right; font-weight: 600;">${formatCurrency(invoice.total)}</td>
        <td style="padding: 12px 8px;">
          <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; ${
            invoice.status === 'paid' ? 'background: #dcfce7; color: #166534;' :
            invoice.status === 'overdue' ? 'background: #fee2e2; color: #991b1b;' :
            invoice.status === 'unpaid' ? 'background: #fef3c7; color: #92400e;' :
            'background: #f3f4f6; color: #4b5563;'
          }">${invoice.status}</span>
        </td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice Details Report</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #111827; margin: 0;">Invoice Details Report</h1>
          <p style="color: #6b7280; margin: 5px 0;">Generated on ${reportDate}</p>
        </div>

        <div style="display: flex; justify-content: space-around; margin-bottom: 30px; padding: 20px; background: #f9fafb; border-radius: 8px;">
          <div style="text-align: center;">
            <div style="font-size: 12px; color: #6b7280; text-transform: uppercase;">Total Paid</div>
            <div style="font-size: 24px; font-weight: 700; color: #059669;">${formatCurrency(paidAmount)}</div>
            <div style="font-size: 12px; color: #6b7280;">${paidCount} invoice${paidCount !== 1 ? 's' : ''}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 12px; color: #6b7280; text-transform: uppercase;">Total Outstanding</div>
            <div style="font-size: 24px; font-weight: 700; color: #dc2626;">${formatCurrency(outstandingAmount)}</div>
            <div style="font-size: 12px; color: #6b7280;">${outstandingCount} invoice${outstandingCount !== 1 ? 's' : ''}</div>
          </div>
        </div>

        ${emailMessage ? `
          <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0;">${emailMessage}</p>
          </div>
        ` : ''}

        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 12px 8px; text-align: left; font-size: 12px; text-transform: uppercase; color: #374151;">Client</th>
              <th style="padding: 12px 8px; text-align: left; font-size: 12px; text-transform: uppercase; color: #374151;">Invoice #</th>
              <th style="padding: 12px 8px; text-align: left; font-size: 12px; text-transform: uppercase; color: #374151;">Issue Date</th>
              <th style="padding: 12px 8px; text-align: left; font-size: 12px; text-transform: uppercase; color: #374151;">Due Date</th>
              <th style="padding: 12px 8px; text-align: right; font-size: 12px; text-transform: uppercase; color: #374151;">Total</th>
              <th style="padding: 12px 8px; text-align: left; font-size: 12px; text-transform: uppercase; color: #374151;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceRows}
          </tbody>
        </table>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
          <p>This report contains ${filteredInvoices.length} invoice${filteredInvoices.length !== 1 ? 's' : ''}.</p>
        </div>
      </body>
      </html>
    `;
  };

  // Handle sending email
  const handleSendEmail = async () => {
    const recipientEmail = emailRecipientType === 'client' 
      ? clients.find(c => c.id === selectedClientId)?.email 
      : customEmail;

    if (!recipientEmail) {
      setError('Please provide an email address');
      return;
    }

    setIsSendingEmail(true);

    try {
      // Use EmailService to send the report
      const response = await fetch('https://api.smtp2go.com/v3/email/send', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: import.meta.env.VITE_SMTP2GO_API_KEY,
          to: [recipientEmail],
          sender: import.meta.env.VITE_FROM_EMAIL || 'noreply@yourcompany.com',
          subject: emailSubject,
          html_body: generateReportHTML(),
        })
      });

      const result = await response.json();

      if (!response.ok || result.data?.succeeded === 0) {
        throw new Error(result.data?.error || 'Failed to send email');
      }

      alert('Report sent successfully!');
      setShowEmailModal(false);
      resetEmailForm();
    } catch (err: any) {
      console.error('Error sending email:', err);
      setError(err.message || 'Failed to send email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const resetEmailForm = () => {
    setEmailRecipientType('custom');
    setSelectedClientId('');
    setCustomEmail('');
    setEmailSubject('Invoice Details Report');
    setEmailMessage('');
  };

  const openEmailModal = () => {
    resetEmailForm();
    setShowEmailModal(true);
  };

  // Export to CSV functionality
  const exportToCSV = () => {
    const headers = ['Client Name', 'Business Name', 'Invoice Number', 'Issue Date', 'Due Date', 'Total', 'Amount Paid', 'Amount Due', 'Status'];
    
    const csvData = filteredInvoices.map(invoice => [
      invoice.clientName,
      invoice.clientCompany || '',
      invoice.invoiceNumber,
      formatDate(invoice.issueDate),
      formatDate(invoice.dueDate),
      invoice.total.toFixed(2),
      invoice.amountPaid.toFixed(2),
      invoice.amountDue.toFixed(2),
      invoice.status
    ]);

    // Add totals rows
    csvData.push([]);
    csvData.push(['', '', '', '', 'Paid:', paidAmount.toFixed(2), '', '', `${paidCount} invoices`]);
    csvData.push(['', '', '', '', 'Outstanding:', outstandingAmount.toFixed(2), '', '', `${outstandingCount} invoices`]);

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
      label: 'Email Report',
      value: 'email',
      icon: '📧',
      onClick: openEmailModal
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
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Filters */}
      <div className="invoice-filters">
        <div className="filters-row">
          <div className="filter-group">
            <label htmlFor="datePreset">Quick Filter:</label>
            <select
              id="datePreset"
              value={datePreset}
              onChange={(e) => handleDatePresetChange(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="this-month">This Month</option>
              <option value="this-quarter">This Quarter</option>
              <option value="this-year">This Year</option>
              <option value="last-year">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

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
              <th className="expand-col"></th>
              <th>Client</th>
              <th>Invoice #</th>
              <th>Issue Date</th>
              <th>Due Date</th>
              <th>Total</th>
              <th>Status</th>
              <th className="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="no-data">
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
                    <td className="expand-cell">
                      <span className={`expand-icon ${expandedInvoiceId === invoice.id ? 'expanded' : ''}`}>
                        ▶
                      </span>
                    </td>
                    <td className="client-cell">
                      <div className="client-info">
                        <span className="client-name">{invoice.clientName}</span>
                        {invoice.clientCompany && (
                          <span className="client-company">{invoice.clientCompany}</span>
                        )}
                      </div>
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
                    <td className="actions-cell">
                      {invoice.status === 'draft' && (
                        <button
                          className="delete-btn"
                          onClick={(e) => handleDeleteInvoice(e, invoice.id)}
                          title="Delete draft invoice"
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                  {/* Line items row - visible when expanded OR when printing */}
                  <tr className={`line-items-row ${expandedInvoiceId === invoice.id ? 'expanded' : ''}`}>
                    <td colSpan={8}>
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
                        <div className="invoice-summary">
                          <div className="summary-row">
                            <span className="summary-label">Invoice Total:</span>
                            <span className="summary-value">{formatCurrency(invoice.total)}</span>
                          </div>
                          <div className="summary-row">
                            <span className="summary-label">Amount Paid:</span>
                            <span className="summary-value paid">{formatCurrency(invoice.amountPaid)}</span>
                          </div>
                          <div className="summary-row total">
                            <span className="summary-label">Amount Due:</span>
                            <span className={`summary-value ${invoice.amountDue > 0 ? 'outstanding' : 'paid'}`}>
                              {formatCurrency(invoice.amountDue)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
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

      {/* Email Modal */}
      {showEmailModal && (
        <div className="email-modal-overlay" onClick={() => setShowEmailModal(false)}>
          <div className="email-modal" onClick={(e) => e.stopPropagation()}>
            <div className="email-modal-header">
              <h2>📧 Email Report</h2>
              <button className="email-modal-close" onClick={() => setShowEmailModal(false)}>
                ×
              </button>
            </div>
            
            <div className="email-modal-body">
              <div className="email-form-group">
                <label>Send To:</label>
                <div className="email-recipient-toggle">
                  <button
                    type="button"
                    className={emailRecipientType === 'client' ? 'active' : ''}
                    onClick={() => setEmailRecipientType('client')}
                  >
                    Select Client
                  </button>
                  <button
                    type="button"
                    className={emailRecipientType === 'custom' ? 'active' : ''}
                    onClick={() => setEmailRecipientType('custom')}
                  >
                    Enter Email
                  </button>
                </div>

                {emailRecipientType === 'client' ? (
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                  >
                    <option value="">Select a client...</option>
                    {clients.filter(c => c.email).map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name} {client.company ? `(${client.company})` : ''} - {client.email}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="email"
                    placeholder="recipient@example.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                  />
                )}
              </div>

              <div className="email-form-group">
                <label htmlFor="emailSubject">Subject:</label>
                <input
                  type="text"
                  id="emailSubject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>

              <div className="email-form-group">
                <label htmlFor="emailMessage">Message (optional):</label>
                <textarea
                  id="emailMessage"
                  placeholder="Add a personal message to include with the report..."
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                />
                <div className="helper-text">
                  The report will include {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''} based on current filters.
                </div>
              </div>
            </div>

            <div className="email-modal-footer">
              <button 
                type="button" 
                className="email-cancel-btn"
                onClick={() => setShowEmailModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="email-send-btn"
                onClick={handleSendEmail}
                disabled={isSendingEmail || (emailRecipientType === 'client' ? !selectedClientId : !customEmail)}
              >
                {isSendingEmail ? 'Sending...' : 'Send Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetails;
