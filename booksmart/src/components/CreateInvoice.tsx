import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { EmailService } from '../services/emailService';
import './styles/CreateInvoice.css';

interface User {
    email?: string;
}

interface CreateInvoiceProps {
    user: User;
    onSignOut: () => void;
    onNavigateToInvoices: () => void;
    onNavigateToDashboard: () => void;
}

interface Client {
    id: string;
    name: string;
    email: string;
    company?: string;
    phone?: string;
}

interface LineItem {
    id: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
}

interface InvoiceData {
    client_id: string;
    invoice_number: string;
    issue_date: string;
    due_date: string;
    notes: string;
    terms: string;
    line_items: LineItem[];
    subtotal: number;
    tax_rate: number;
    tax_amount: number;
    total: number;
    status: 'draft' | 'sent' | 'paid';
}

const CreateInvoice = ({ user, onSignOut, onNavigateToInvoices, onNavigateToDashboard }: CreateInvoiceProps) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [sending, setSending] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');

    const [invoiceData, setInvoiceData] = useState<InvoiceData>({
        client_id: '',
        invoice_number: '',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        notes: '',
        terms: 'Payment is due within 30 days of invoice date. Late payments may be subject to fees.',
        line_items: [
            {
                id: '1',
                description: '',
                quantity: 1,
                rate: 0,
                amount: 0
            }
        ],
        subtotal: 0,
        tax_rate: 0,
        tax_amount: 0,
        total: 0,
        status: 'draft'
    });

    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [showPreview, setShowPreview] = useState<boolean>(false);
    const [showSendModal, setShowSendModal] = useState<boolean>(false);
    const [emailData, setEmailData] = useState({
        subject: '',
        message: ''
    });

    useEffect(() => {
        fetchClients();
        generateInvoiceNumber();
    }, []);

    useEffect(() => {
        calculateTotals();
    }, [invoiceData.line_items, invoiceData.tax_rate]);

    useEffect(() => {
        if (invoiceData.client_id) {
            const client = clients.find(c => c.id === invoiceData.client_id);
            setSelectedClient(client || null);
        }
    }, [invoiceData.client_id, clients]);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('clients')
                .select('id, name, email, company, phone')
                .order('name');

            if (error) throw error;
            setClients(data || []);
        } catch (error: any) {
            console.error('Error fetching clients:', error);
            setError('Failed to load clients. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const generateInvoiceNumber = async () => {
        try {
            // Get the latest invoice number
            const { data, error } = await supabase
                .from('invoices')
                .select('invoice_number')
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) throw error;

            let nextNumber = 1;
            if (data && data.length > 0 && data[0].invoice_number) {
                const lastNumber = parseInt(data[0].invoice_number.replace(/\D/g, '')) || 0;
                nextNumber = lastNumber + 1;
            }

            const invoiceNumber = `INV-${nextNumber.toString().padStart(4, '0')}`;
            setInvoiceData(prev => ({ ...prev, invoice_number: invoiceNumber }));
        } catch (error) {
            console.error('Error generating invoice number:', error);
            // Fallback to timestamp-based number
            const timestamp = Date.now().toString().slice(-6);
            setInvoiceData(prev => ({ ...prev, invoice_number: `INV-${timestamp}` }));
        }
    };

    const calculateTotals = useCallback(() => {
        const subtotal = invoiceData.line_items.reduce((sum, item) => sum + item.amount, 0);
        const tax_amount = (subtotal * invoiceData.tax_rate) / 100;
        const total = subtotal + tax_amount;

        setInvoiceData(prev => ({
            ...prev,
            subtotal,
            tax_amount,
            total
        }));
    }, [invoiceData.line_items, invoiceData.tax_rate]);

    const addLineItem = () => {
        const newItem: LineItem = {
            id: Date.now().toString(),
            description: '',
            quantity: 1,
            rate: 0,
            amount: 0
        };

        setInvoiceData(prev => ({
            ...prev,
            line_items: [...prev.line_items, newItem]
        }));
    };

    const removeLineItem = (itemId: string) => {
        if (invoiceData.line_items.length === 1) return; // Keep at least one item

        setInvoiceData(prev => ({
            ...prev,
            line_items: prev.line_items.filter(item => item.id !== itemId)
        }));
    };

    const updateLineItem = (itemId: string, field: keyof LineItem, value: string | number) => {
        setInvoiceData(prev => ({
            ...prev,
            line_items: prev.line_items.map(item => {
                if (item.id === itemId) {
                    const updatedItem = { ...item, [field]: value };

                    // Recalculate amount when quantity or rate changes
                    if (field === 'quantity' || field === 'rate') {
                        updatedItem.amount = updatedItem.quantity * updatedItem.rate;
                    }

                    return updatedItem;
                }
                return item;
            })
        }));
    };

    const validateInvoice = (): string[] => {
        const errors: string[] = [];

        if (!invoiceData.client_id) errors.push('Client is required');
        if (!invoiceData.invoice_number) errors.push('Invoice number is required');
        if (!invoiceData.issue_date) errors.push('Issue date is required');
        if (!invoiceData.due_date) errors.push('Due date is required');

        if (invoiceData.issue_date && invoiceData.due_date) {
            if (new Date(invoiceData.due_date) < new Date(invoiceData.issue_date)) {
                errors.push('Due date cannot be earlier than issue date');
            }
        }

        if (invoiceData.line_items.length === 0) {
            errors.push('At least one line item is required');
        }

        const hasValidLineItems = invoiceData.line_items.some(item =>
            item.description.trim() && item.quantity > 0 && item.rate > 0
        );

        if (!hasValidLineItems) {
            errors.push('At least one line item must have description, quantity, and rate');
        }

        if (invoiceData.tax_rate < 0 || invoiceData.tax_rate > 100) {
            errors.push('Tax rate must be between 0 and 100');
        }

        return errors;
    };

    const saveAsDraft = async () => {
        const validationErrors = validateInvoice();
        if (validationErrors.length > 0) {
            setError(validationErrors.join('. '));
            return;
        }

        try {
            setSaving(true);
            setError('');

            const { error } = await supabase
                .from('invoices')
                .insert([{
                    client_id: invoiceData.client_id,
                    invoice_number: invoiceData.invoice_number,
                    amount: invoiceData.total,
                    issued_date: invoiceData.issue_date,
                    due_date: invoiceData.due_date,
                    invoice_status: 'draft',
                    notes: invoiceData.notes,
                    terms: invoiceData.terms,
                    line_items: invoiceData.line_items,
                    subtotal: invoiceData.subtotal,
                    tax_rate: invoiceData.tax_rate,
                    tax_amount: invoiceData.tax_amount
                }]);

            if (error) throw error;

            setSuccess('Invoice saved as draft successfully!');
            setTimeout(() => {
                onNavigateToInvoices();
            }, 1500);
        } catch (error: any) {
            console.error('Error saving invoice:', error);
            setError(error.message || 'Failed to save invoice. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const sendInvoice = async () => {
        if (!selectedClient?.email) {
            setError('Client email is required to send invoice');
            return;
        }

        const validationErrors = validateInvoice();
        if (validationErrors.length > 0) {
            setError(validationErrors.join('. '));
            return;
        }

        try {
            setSending(true);
            setError('');

            // First save the invoice
            const { data, error: saveError } = await supabase
                .from('invoices')
                .insert([{
                    client_id: invoiceData.client_id,
                    invoice_number: invoiceData.invoice_number,
                    amount: invoiceData.total,
                    issued_date: invoiceData.issue_date,
                    due_date: invoiceData.due_date,
                    invoice_status: 'sent',
                    notes: invoiceData.notes,
                    terms: invoiceData.terms,
                    line_items: invoiceData.line_items,
                    subtotal: invoiceData.subtotal,
                    tax_rate: invoiceData.tax_rate,
                    tax_amount: invoiceData.tax_amount
                }])
                .select('id')
                .single();

            if (saveError) throw saveError;

            // Then send the email
            const success = await EmailService.sendInvoice({
                invoiceId: data.id,
                clientName: selectedClient.name,
                clientEmail: selectedClient.email,
                amount: invoiceData.total,
                dueDate: invoiceData.due_date,
                issuedDate: invoiceData.issue_date,
                customMessage: emailData.message,
                invoiceNumber: invoiceData.invoice_number
            });

            if (success) {
                setSuccess('Invoice sent successfully!');
                setShowSendModal(false);
                setTimeout(() => {
                    onNavigateToInvoices();
                }, 1500);
            }
        } catch (error: any) {
            console.error('Error sending invoice:', error);
            setError(error.message || 'Failed to send invoice. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const openSendModal = () => {
        if (!selectedClient?.email) {
            setError('Client email is required to send invoice');
            return;
        }

        setEmailData({
            subject: `Invoice ${invoiceData.invoice_number} from Your Company`,
            message: `Dear ${selectedClient.name},\n\nPlease find your invoice attached for $${invoiceData.total.toFixed(2)}.\n\nDue Date: ${new Date(invoiceData.due_date).toLocaleDateString()}\n\nThank you for your business!`
        });
        setShowSendModal(true);
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
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="create-invoice-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="create-invoice-page">
            {/* Header */}
            <header className="page-header">
                <div className="header-left">
                    <button
                        className="back-button"
                        onClick={onNavigateToInvoices}
                        aria-label="Back to Invoices"
                    >
                        ← Back to Invoices
                    </button>
                    <h1>Create Invoice</h1>
                </div>

                <div className="header-right">
                    <button
                        className="preview-btn"
                        onClick={() => setShowPreview(!showPreview)}
                    >
                        {showPreview ? 'Hide Preview' : 'Preview'}
                    </button>

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

            {/* Main Content */}
            <main className="create-invoice-main">
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

                {success && (
                    <div className="success-message" role="alert">
                        <span className="success-icon">✅</span>
                        {success}
                    </div>
                )}

                <div className="invoice-container">
                    {/* Invoice Form */}
                    <div className="invoice-form-section">
                        <div className="invoice-form">
                            {/* Basic Information */}
                            <div className="form-section">
                                <h2>Invoice Details</h2>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label htmlFor="invoice-number">Invoice Number</label>
                                        <input
                                            type="text"
                                            id="invoice-number"
                                            value={invoiceData.invoice_number}
                                            onChange={(e) => setInvoiceData(prev => ({ ...prev, invoice_number: e.target.value }))}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="client">Client *</label>
                                        <select
                                            id="client"
                                            value={invoiceData.client_id}
                                            onChange={(e) => setInvoiceData(prev => ({ ...prev, client_id: e.target.value }))}
                                            required
                                        >
                                            <option value="">Select a client</option>
                                            {clients.map(client => (
                                                <option key={client.id} value={client.id}>
                                                    {client.name} {client.company && `(${client.company})`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="issue-date">Issue Date *</label>
                                        <input
                                            type="date"
                                            id="issue-date"
                                            value={invoiceData.issue_date}
                                            onChange={(e) => setInvoiceData(prev => ({ ...prev, issue_date: e.target.value }))}
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="due-date">Due Date *</label>
                                        <input
                                            type="date"
                                            id="due-date"
                                            value={invoiceData.due_date}
                                            onChange={(e) => setInvoiceData(prev => ({ ...prev, due_date: e.target.value }))}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Line Items */}
                            <div className="form-section">
                                <div className="section-header">
                                    <h2>Line Items</h2>
                                    <button
                                        type="button"
                                        className="add-item-btn"
                                        onClick={addLineItem}
                                    >
                                        + Add Item
                                    </button>
                                </div>

                                <div className="line-items-container">
                                    <div className="line-items-header">
                                        <div className="col-description">Description</div>
                                        <div className="col-quantity">Qty</div>
                                        <div className="col-rate">Rate</div>
                                        <div className="col-amount">Amount</div>
                                        <div className="col-actions">Actions</div>
                                    </div>

                                    {invoiceData.line_items.map((item) => (
                                        <div key={item.id} className="line-item-row">
                                            <div className="col-description">
                                                <input
                                                    type="text"
                                                    value={item.description}
                                                    onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                                                    placeholder="Description of work or product"
                                                />
                                            </div>
                                            <div className="col-quantity">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.quantity}
                                                    onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                />
                                            </div>
                                            <div className="col-rate">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.rate}
                                                    onChange={(e) => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                                                />
                                            </div>
                                            <div className="col-amount">
                                                {formatCurrency(item.amount)}
                                            </div>
                                            <div className="col-actions">
                                                <button
                                                    type="button"
                                                    className="remove-item-btn"
                                                    onClick={() => removeLineItem(item.id)}
                                                    disabled={invoiceData.line_items.length === 1}
                                                    aria-label="Remove item"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="form-section">
                                <h2>Totals</h2>
                                <div className="totals-container">
                                    <div className="totals-row">
                                        <label>Subtotal:</label>
                                        <span>{formatCurrency(invoiceData.subtotal)}</span>
                                    </div>
                                    <div className="totals-row">
                                        <label htmlFor="tax-rate">Tax Rate (%):</label>
                                        <input
                                            type="number"
                                            id="tax-rate"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            value={invoiceData.tax_rate}
                                            onChange={(e) => setInvoiceData(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
                                        />
                                    </div>
                                    <div className="totals-row">
                                        <label>Tax Amount:</label>
                                        <span>{formatCurrency(invoiceData.tax_amount)}</span>
                                    </div>
                                    <div className="totals-row total-row">
                                        <label>Total:</label>
                                        <span>{formatCurrency(invoiceData.total)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Notes and Terms */}
                            <div className="form-section">
                                <h2>Additional Information</h2>
                                <div className="form-group">
                                    <label htmlFor="notes">Notes</label>
                                    <textarea
                                        id="notes"
                                        rows={3}
                                        value={invoiceData.notes}
                                        onChange={(e) => setInvoiceData(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="Additional notes or instructions"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="terms">Terms & Conditions</label>
                                    <textarea
                                        id="terms"
                                        rows={3}
                                        value={invoiceData.terms}
                                        onChange={(e) => setInvoiceData(prev => ({ ...prev, terms: e.target.value }))}
                                        placeholder="Payment terms and conditions"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="draft-btn"
                                    onClick={saveAsDraft}
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : 'Save as Draft'}
                                </button>
                                <button
                                    type="button"
                                    className="send-btn"
                                    onClick={openSendModal}
                                    disabled={sending}
                                >
                                    {sending ? 'Sending...' : 'Send Invoice'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Preview */}
                    {showPreview && (
                        <div className="invoice-preview-section">
                            <div className="invoice-preview">
                                <div className="preview-header">
                                    <h2>Invoice Preview</h2>
                                </div>
                                <div className="preview-content">
                                    <div className="preview-top">
                                        <div className="company-info">
                                            <h3>Your Company</h3>
                                            <p>123 Business Street</p>
                                            <p>City, State 12345</p>
                                            <p>contact@yourcompany.com</p>
                                        </div>
                                        <div className="invoice-info">
                                            <h3>Invoice {invoiceData.invoice_number}</h3>
                                            <p><strong>Issue Date:</strong> {formatDate(invoiceData.issue_date)}</p>
                                            <p><strong>Due Date:</strong> {formatDate(invoiceData.due_date)}</p>
                                        </div>
                                    </div>

                                    {selectedClient && (
                                        <div className="bill-to">
                                            <h4>Bill To:</h4>
                                            <p><strong>{selectedClient.name}</strong></p>
                                            {selectedClient.company && <p>{selectedClient.company}</p>}
                                            <p>{selectedClient.email}</p>
                                            {selectedClient.phone && <p>{selectedClient.phone}</p>}
                                        </div>
                                    )}

                                    <div className="preview-items">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Description</th>
                                                    <th>Qty</th>
                                                    <th>Rate</th>
                                                    <th>Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {invoiceData.line_items.map((item) => (
                                                    <tr key={item.id}>
                                                        <td>{item.description}</td>
                                                        <td>{item.quantity}</td>
                                                        <td>{formatCurrency(item.rate)}</td>
                                                        <td>{formatCurrency(item.amount)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="preview-totals">
                                        <div className="totals-grid">
                                            <div className="total-line">
                                                <span>Subtotal:</span>
                                                <span>{formatCurrency(invoiceData.subtotal)}</span>
                                            </div>
                                            {invoiceData.tax_rate > 0 && (
                                                <div className="total-line">
                                                    <span>Tax ({invoiceData.tax_rate}%):</span>
                                                    <span>{formatCurrency(invoiceData.tax_amount)}</span>
                                                </div>
                                            )}
                                            <div className="total-line final-total">
                                                <span>Total:</span>
                                                <span>{formatCurrency(invoiceData.total)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {invoiceData.notes && (
                                        <div className="preview-notes">
                                            <h4>Notes:</h4>
                                            <p>{invoiceData.notes}</p>
                                        </div>
                                    )}

                                    {invoiceData.terms && (
                                        <div className="preview-terms">
                                            <h4>Terms & Conditions:</h4>
                                            <p>{invoiceData.terms}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Send Invoice Modal */}
            {showSendModal && (
                <div className="modal-overlay" onClick={() => setShowSendModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Send Invoice</h2>
                            <button
                                className="modal-close"
                                onClick={() => setShowSendModal(false)}
                                aria-label="Close modal"
                            >
                                ×
                            </button>
                        </div>

                        <div className="email-form">
                            <div className="form-group">
                                <label htmlFor="email-to">To:</label>
                                <input
                                    type="email"
                                    id="email-to"
                                    value={selectedClient?.email || ''}
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
                                    placeholder="Add a personal message"
                                />
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => setShowSendModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="send-btn"
                                    onClick={sendInvoice}
                                    disabled={sending}
                                >
                                    {sending ? 'Sending...' : 'Send Invoice'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateInvoice;