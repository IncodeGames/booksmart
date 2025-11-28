import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Destinations } from '../lib/routes';
import { supabase } from '../lib/supabase';
import { EmailService } from '../services/emailService';
import CreateInvoice from './CreateInvoice';
import Sidebar from './Sidebar';
import * as siteUtils from '../utils/siteUtils';
import { useNavigationStore } from '../stores/navigationStore';
import './styles/base.css'
import './styles/Invoices.css'

interface User {
    email?: string;
}

interface InvoicesProps {
    user: User;
    onSignOut: () => void;
}

interface Client {
    id: string;
    name: string;
    email: string;
    company?: string;
}

enum InvoiceStatus {
    Draft = 'draft',
    Unpaid = 'unpaid',
    Paid = 'paid',
}

interface Invoice {
    id: number;
    amount: number;
    created_at: string;
    invoice_status: InvoiceStatus;
    client_id: string;
    due_date: string;
    issued_date: string;
    client?: Client;
}

type SortField = 'id' | 'amount' | 'due_date' | 'issued_date' | 'client_name' | 'created_at';
type SortDirection = 'asc' | 'desc';

const Invoices = ({ user, onSignOut }: InvoicesProps) => {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [showCreateInvoice, setShowCreateInvoice] = useState<boolean>(false);
    const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; invoiceId: number } | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<'All' | InvoiceStatus.Paid | InvoiceStatus.Unpaid>('All');
    const [sortField, setSortField] = useState<SortField>('created_at');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [error, setError] = useState<string>('');
    const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
    const [emailingInvoice, setEmailingInvoice] = useState<Invoice | null>(null);
    const [emailData, setEmailData] = useState({
        subject: '',
        message: ''
    });
    const [sending, setSending] = useState<boolean>(false);

    const isOverdue = (dueDate: string, status: InvoiceStatus) => {
        return status === InvoiceStatus.Unpaid && new Date(dueDate) < new Date();
    };

    // Memoized filtered and sorted invoices
    const filteredAndSortedInvoices = useMemo(() => {
        let filtered = invoices;

        if (searchTerm) {
            filtered = filtered.filter(invoice =>
                invoice.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                invoice.client?.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                invoice.id.toString().includes(searchTerm)
            );
        }

        if (statusFilter !== 'All') {
            filtered = filtered.filter(invoice => invoice.invoice_status === statusFilter);
        }

        const sorted = [...filtered].sort((a, b) => {
            let aValue: any, bValue: any;

            switch (sortField) {
                case 'client_name':
                    aValue = a.client?.name || '';
                    bValue = b.client?.name || '';
                    break;
                case 'amount':
                    aValue = a.amount;
                    bValue = b.amount;
                    break;
                case 'due_date':
                    aValue = new Date(a.due_date);
                    bValue = new Date(b.due_date);
                    break;
                case 'issued_date':
                    aValue = new Date(a.issued_date);
                    bValue = new Date(b.issued_date);
                    break;
                default:
                    aValue = a.id;
                    bValue = b.id;
            }

            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted;
    }, [invoices, searchTerm, statusFilter, sortField, sortDirection]);

    const totals = useMemo(() => {
        const outstanding = invoices
            .filter(inv => inv.invoice_status === InvoiceStatus.Unpaid)
            .reduce((sum, inv) => sum + inv.amount, 0);

        const overdue = invoices
            .filter(inv => isOverdue(inv.due_date, inv.invoice_status))
            .reduce((sum, inv) => sum + inv.amount, 0);

        const paid = invoices
            .filter(inv => inv.invoice_status === InvoiceStatus.Paid)
            .reduce((sum, inv) => sum + inv.amount, 0);

        return { outstanding, overdue, paid };
    }, [invoices]);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (contextMenu) {
                setContextMenu(null);
            }
        };

        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setContextMenu(null);
                if (showCreateInvoice) setShowCreateInvoice(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        document.addEventListener('keydown', handleEscapeKey);

        return () => {
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [contextMenu, showCreateInvoice]);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            await Promise.all([fetchInvoices(), fetchClients()]);
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to load data. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchInvoices = async () => {
        const { data: invoicesData, error: invoicesError } = await supabase
            .from('invoices')
            .select(`
                id,
                amount,
                created_at,
                invoice_status,
                client_id,
                due_date,
                issued_date,
                clients (
                    id,
                    name,
                    email,
                    company
                )
            `)
            .order('created_at', { ascending: false });

        if (invoicesError) throw invoicesError;

        const processedInvoices = invoicesData?.map(invoice => ({
            ...invoice,
            client: invoice.clients
        })) || [];

        setInvoices(processedInvoices);
    };

    const fetchClients = async () => {
        const { data: clientsData, error: clientsError } = await supabase
            .from('clients')
            .select('id, name, email, company')
            .order('name');

        if (clientsError) throw clientsError;
        setClients(clientsData || []);
    };

    const handleEditInvoice = (invoiceId: number) => {
        const invoice = invoices.find(inv => inv.id === invoiceId);
        if (invoice && invoice.invoice_status !== 'sent' && invoice.invoice_status !== InvoiceStatus.Paid) {
            setInvoiceToEdit(invoice);
            setShowCreateInvoice(true);
        } else {
            setError('Can only edit draft invoices');
        }
    };

    const handleDeleteInvoice = async (invoiceId: number) => {
        const invoice = invoices.find(inv => inv.id === invoiceId);
        if (!invoice) return;

        if (!window.confirm(`Are you sure you want to delete invoice #${invoiceId}? This action cannot be undone.`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('invoices')
                .delete()
                .eq('id', invoiceId);

            if (error) throw error;

            setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
            setContextMenu(null);
        } catch (error: any) {
            console.error('Error deleting invoice:', error);
            setError(error.message || 'Failed to delete invoice. Please try again.');
        }
    };

    const handleSendInvoice = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!emailingInvoice) return;

        try {
            setSending(true);
            setError('');

            const success = await EmailService.sendInvoice({
                invoiceId: emailingInvoice.id,
                clientName: emailingInvoice.client?.name || 'Unknown Client',
                clientEmail: emailingInvoice.client?.email || '',
                amount: emailingInvoice.amount,
                dueDate: emailingInvoice.due_date,
                issuedDate: emailingInvoice.issued_date,
                customMessage: emailData.message
            });

            if (success) {
                // Update invoice status to indicate it was sent
                const { error: updateError } = await supabase
                    .from('invoices')
                    .update({
                        last_sent_at: new Date().toISOString()
                    })
                    .eq('id', emailingInvoice.id);

                if (updateError) {
                    console.warn('Failed to update last_sent_at:', updateError);
                }

                setShowEmailModal(false);
                setEmailingInvoice(null);
                setEmailData({ subject: '', message: '' });

                // Show success message
                alert('Invoice sent successfully!');
            }
        } catch (error: any) {
            console.error('Error sending invoice:', error);
            setError(error.message || 'Failed to send invoice. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const openEmailModal = (invoice: Invoice) => {
        if (!invoice.client?.email) {
            setError('Client email is required to send invoice');
            return;
        }

        setEmailingInvoice(invoice);
        setEmailData({
            subject: `Invoice #${invoice.id} from Your Company`,
            message: `Dear ${invoice.client.name},\n\nPlease find attached your invoice for ${invoice.amount.toFixed(2)}.\n\nThank you for your business!`
        });
        setShowEmailModal(true);
        setContextMenu(null);
        setError('');
    };

    const handleContextMenu = (e: React.MouseEvent, invoiceId: number) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            invoiceId
        });
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return '↕️';
        return sortDirection === 'asc' ? '↑' : '↓';
    };

    const handleNavigateBackToInvoices = () => {
        setShowCreateInvoice(false);
        fetchData(); // Refresh the invoice list
    };

    const windowSize = siteUtils.useWindowSize();
    const { sidebarOpen, setSidebarOpen } = useNavigationStore();

    return (
        <div className="invoices-page">
            <Sidebar />
            {showCreateInvoice ? (
                <CreateInvoice
                    user={user}
                    onSignOut={onSignOut}
                    onBack={() => {
                        setShowCreateInvoice(false);
                        setInvoiceToEdit(null);
                        fetchInvoices(); // Refresh the list
                    }}
                    invoiceToEdit={invoiceToEdit}
                />
            ) : (
                <main className="invoices-main">
                    {/* Header */}
                    <header className="invoices-header">
                        <div className="header-left">
                            <h1>Invoices</h1>
                        </div>

                        <div className="header-right">
                            <button
                                className="create-invoice-btn"
                                onClick={() => {
                                    setInvoiceToEdit(null); // Clear any previous edit
                                    setShowCreateInvoice(true);
                                    setError('');
                                }}
                                aria-label="Create new invoice"
                            >
                                + New Invoice
                            </button>

                            {siteUtils.isMobile(windowSize) && (
                                <button
                                    className="menu-toggle"
                                    onClick={() => setSidebarOpen(true)}
                                    aria-label="Open sidebar menu"
                                >
                                    ☰
                                </button>
                            )}

                            <div className="user-menu">
                                <div className="user-avatar">
                                    {user.email?.charAt(0).toUpperCase()}
                                </div>
                                <div className="user-info">
                                    <span className="user-name">{user.email}</span>
                                    <button className="sign-out-btn" onClick={onSignOut}>
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Content */}
                    <div className="invoices-content">
                        {error && (
                            <div className="error-message" role="alert">
                                <span className="error-icon">⚠️</span>
                                {error}
                                <button
                                    className="error-dismiss"
                                    onClick={() => setError('')}
                                    aria-label="Dismiss error"
                                >
                                    ×
                                </button>
                            </div>
                        )}

                        {loading ? (
                            <div className="loading-container">
                                <div className="loading-spinner" aria-label="Loading"></div>
                                <p>Loading invoices...</p>
                            </div>
                        ) : (
                            <div className="invoices-container">
                                {/* Summary Cards */}
                                <div className="invoices-summary">
                                    <div className="summary-card">
                                        <h3>Total Invoices</h3>
                                        <div className="summary-value">{invoices.length}</div>
                                    </div>
                                    <div className="summary-card">
                                        <h3>Outstanding</h3>
                                        <div className="summary-value outstanding">
                                            {formatCurrency(totals.outstanding)}
                                        </div>
                                    </div>
                                    <div className="summary-card">
                                        <h3>Overdue</h3>
                                        <div className="summary-value overdue">
                                            {formatCurrency(totals.overdue)}
                                        </div>
                                    </div>
                                    <div className="summary-card">
                                        <h3>Total Paid</h3>
                                        <div className="summary-value paid">
                                            {formatCurrency(totals.paid)}
                                        </div>
                                    </div>
                                </div>

                                {/* Filters and Search */}
                                <div className="invoices-filters">
                                    <div className="search-container">
                                        <input
                                            type="text"
                                            placeholder="Search invoices..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="search-input"
                                            aria-label="Search invoices"
                                        />
                                    </div>
                                    <div className="filter-container">
                                        <label htmlFor="status-filter">Status:</label>
                                        <select
                                            id="status-filter"
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value as 'All' | InvoiceStatus.Paid | InvoiceStatus.Unpaid)}
                                            className="status-filter"
                                        >
                                            <option value="All">All</option>
                                            <option value={InvoiceStatus.Paid}>Paid</option>
                                            <option value={InvoiceStatus.Unpaid}>Unpaid</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Invoices List */}
                                <div className="invoices-list">
                                    {filteredAndSortedInvoices.length === 0 ? (
                                        <div className="empty-state">
                                            {invoices.length === 0 ? (
                                                <>
                                                    <h3>No invoices yet</h3>
                                                    <p>Create your first invoice to get started</p>
                                                    <button
                                                        className="create-invoice-btn"
                                                        onClick={() => setShowCreateInvoice(true)}
                                                    >
                                                        + Create Invoice
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <h3>No invoices match your search</h3>
                                                    <p>Try adjusting your filters or search term</p>
                                                    <button
                                                        className="clear-filters-btn"
                                                        onClick={() => {
                                                            setSearchTerm('');
                                                            setStatusFilter('All');
                                                        }}
                                                    >
                                                        Clear Filters
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="invoices-table">
                                            <div className="table-header">
                                                <button
                                                    className="header-cell sortable"
                                                    onClick={() => handleSort('id')}
                                                >
                                                    Invoice # {getSortIcon('id')}
                                                </button>
                                                <button
                                                    className="header-cell sortable"
                                                    onClick={() => handleSort('client_name')}
                                                >
                                                    Client {getSortIcon('client_name')}
                                                </button>
                                                <button
                                                    className="header-cell sortable"
                                                    onClick={() => handleSort('amount')}
                                                >
                                                    Amount {getSortIcon('amount')}
                                                </button>
                                                <div className="header-cell">Status</div>
                                                <button
                                                    className="header-cell sortable"
                                                    onClick={() => handleSort('due_date')}
                                                >
                                                    Due Date {getSortIcon('due_date')}
                                                </button>
                                                <button
                                                    className="header-cell sortable"
                                                    onClick={() => handleSort('issued_date')}
                                                >
                                                    Issued {getSortIcon('issued_date')}
                                                </button>
                                            </div>
                                            <div className="table-body">
                                                {filteredAndSortedInvoices.map((invoice) => (
                                                    <div
                                                        key={invoice.id}
                                                        className={`table-row ${isOverdue(invoice.due_date, invoice.invoice_status) ? 'overdue' : ''}`}
                                                        onContextMenu={(e) => handleContextMenu(e, invoice.id)}
                                                        role="row"
                                                        tabIndex={0}
                                                    >
                                                        <div className="table-cell">#{invoice.id}</div>
                                                        <div className="table-cell">
                                                            <div className="client-info">
                                                                <div className="client-name">{invoice.client?.name}</div>
                                                                {invoice.client?.company && (
                                                                    <div className="client-company">{invoice.client.company}</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="table-cell amount">
                                                            {formatCurrency(invoice.amount)}
                                                        </div>
                                                        <div className="table-cell">
                                                            <span className={`status-badge ${invoice.invoice_status.toLowerCase()}`}>
                                                                {invoice.invoice_status}
                                                                {invoice.invoice_status === InvoiceStatus.Draft && ' ✏️'}
                                                            </span>
                                                        </div>
                                                        <div className="table-cell">
                                                            {formatDate(invoice.due_date)}
                                                            {isOverdue(invoice.due_date, invoice.invoice_status) && (
                                                                <span className="overdue-indicator" aria-label="Overdue">⚠️</span>
                                                            )}
                                                        </div>
                                                        <div className="table-cell">
                                                            {formatDate(invoice.issued_date)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Context Menu */}
                    {contextMenu && (
                        <div
                            className="context-menu"
                            style={{
                                position: 'fixed',
                                top: contextMenu.y,
                                left: contextMenu.x,
                                zIndex: 1000
                            }}
                            role="menu"
                        >
                            <button
                                role="menuitem"
                                onClick={() => {
                                    handleEditInvoice(contextMenu.invoiceId);
                                    setContextMenu(null);
                                }}
                            >
                                Edit Invoice
                            </button>
                            <button
                                role="menuitem"
                                onClick={() => {
                                    const invoice = invoices.find(inv => inv.id === contextMenu.invoiceId);
                                    if (invoice) openEmailModal(invoice);
                                }}
                            >
                                Send Invoice
                            </button>
                            <button
                                role="menuitem"
                                onClick={() => handleDeleteInvoice(contextMenu.invoiceId)}
                                className="delete-option"
                            >
                                Delete Invoice
                            </button>
                        </div>
                    )}
                </main>
            )}

            {/* Send Invoice Modal */}
            {showEmailModal && emailingInvoice && (
                <div className="modal-overlay" onClick={() => setShowEmailModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="email-modal-title">
                        <div className="modal-header">
                            <h2 id="email-modal-title">Send Invoice #{emailingInvoice.id}</h2>
                            <button
                                className="modal-close"
                                onClick={() => setShowEmailModal(false)}
                                aria-label="Close modal"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSendInvoice} className="email-form">
                            <div className="form-group">
                                <label htmlFor="email-to">To:</label>
                                <input
                                    type="email"
                                    id="email-to"
                                    value={emailingInvoice.client?.email || ''}
                                    disabled
                                    className="disabled-input"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="email-subject">Subject:</label>
                                <input
                                    type="text"
                                    id="email-subject"
                                    value={emailData.subject}
                                    onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="email-message">Message:</label>
                                <textarea
                                    id="email-message"
                                    rows={6}
                                    value={emailData.message}
                                    onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                                    placeholder="Add a personal message (optional)"
                                />
                            </div>

                            <div className="invoice-preview">
                                <h4>Invoice Details:</h4>
                                <div className="preview-details">
                                    <p><strong>Client:</strong> {emailingInvoice.client?.name}</p>
                                    <p><strong>Amount:</strong> {formatCurrency(emailingInvoice.amount)}</p>
                                    <p><strong>Due Date:</strong> {formatDate(emailingInvoice.due_date)}</p>
                                    <p><strong>Status:</strong> {emailingInvoice.invoice_status}</p>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => setShowEmailModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="submit-btn send-btn"
                                    disabled={sending}
                                >
                                    {sending ? 'Sending...' : 'Send Invoice'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Mobile Sidebar Overlay */}
            {siteUtils.isMobile(windowSize) && sidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}
        </div>
    );
};

export default Invoices;