import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import './styles/Clients.css';

interface User {
    email?: string;
}

interface ClientsProps {
    user: User;
    onSignOut: () => void;
    onNavigateToDashboard: () => void;
}

interface Client {
    id: number;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    created_at: string;
    outstanding_amount: number;
}

interface NewClient {
    name: string;
    email: string;
    phone: string;
    company: string;
}

const Clients = ({ user, onSignOut, onNavigateToDashboard }: ClientsProps) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
    const [newClient, setNewClient] = useState<NewClient>({
        name: '',
        email: '',
        phone: '',
        company: ''
    });
    const [creating, setCreating] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            setLoading(true);

            // Fetch clients with their outstanding invoice amounts
            const { data: clientsData, error: clientsError } = await supabase
                .from('clients')
                .select(`
                    id,
                    name,
                    email,
                    phone,
                    company,
                    created_at
                `);

            if (clientsError) throw clientsError;

            // Calculate outstanding amounts for each client
            const clientsWithOutstanding = await Promise.all(
                (clientsData || []).map(async (client) => {
                    const { data: invoices, error: invoiceError } = await supabase
                        .from('invoices')
                        .select('amount')
                        .eq('client_id', client.id)
                        .eq('invoice_status', 'Unpaid');

                    if (invoiceError) {
                        console.error('Error fetching invoices for client:', client.id, invoiceError);
                        return { ...client, outstanding_amount: 0 };
                    }

                    const outstanding = invoices?.reduce((sum, invoice) => sum + invoice.amount, 0) || 0;
                    return { ...client, outstanding_amount: outstanding };
                })
            );

            setClients(clientsWithOutstanding);
        } catch (error) {
            console.error('Error fetching clients:', error);
            setError('Failed to load clients');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newClient.name || !newClient.email) {
            setError('Name and email are required');
            return;
        }

        try {
            setCreating(true);
            setError('');

            const { data, error } = await supabase
                .from('clients')
                .insert([{
                    name: newClient.name,
                    email: newClient.email,
                    phone: newClient.phone || null,
                    company: newClient.company || null
                }])
                .select()
                .single();

            if (error) throw error;

            // Add the new client to the list with 0 outstanding amount
            setClients(prev => [...prev, { ...data, outstanding_amount: 0 }]);

            // Reset form and close modal
            setNewClient({ name: '', email: '', phone: '', company: '' });
            setShowCreateModal(false);
        } catch (error) {
            console.error('Error creating client:', error);
            setError('Failed to create client');
        } finally {
            setCreating(false);
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

    return (
        <div className="clients-page">
            {/* Header */}
            <header className="clients-header">
                <div className="header-left">
                    <button
                        className="back-button"
                        onClick={onNavigateToDashboard}
                    >
                        ← Back to Dashboard
                    </button>
                    <h1>Clients</h1>
                </div>

                <div className="header-right">
                    <button
                        className="create-client-btn"
                        onClick={() => setShowCreateModal(true)}
                    >
                        + New Client
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
            <main className="clients-main">
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading clients...</p>
                    </div>
                ) : (
                    <div className="clients-container">
                        <div className="clients-summary">
                            <div className="summary-card">
                                <h3>Total Clients</h3>
                                <div className="summary-value">{clients.length}</div>
                            </div>
                            <div className="summary-card">
                                <h3>Total Outstanding</h3>
                                <div className="summary-value">
                                    {formatCurrency(clients.reduce((sum, client) => sum + client.outstanding_amount, 0))}
                                </div>
                            </div>
                        </div>

                        <div className="clients-list">
                            {clients.length === 0 ? (
                                <div className="empty-state">
                                    <h3>No clients yet</h3>
                                    <p>Create your first client to get started</p>
                                    <button
                                        className="create-client-btn"
                                        onClick={() => setShowCreateModal(true)}
                                    >
                                        + Create Client
                                    </button>
                                </div>
                            ) : (
                                <div className="clients-grid">
                                    {clients.map((client) => (
                                        <div key={client.id} className="client-card">
                                            <div className="client-header">
                                                <div className="client-avatar">
                                                    {client.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="client-info">
                                                    <h3>{client.name}</h3>
                                                    {client.company && (
                                                        <p className="client-company">{client.company}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="client-details">
                                                <div className="detail-item">
                                                    <span className="detail-label">Email:</span>
                                                    <span className="detail-value">{client.email}</span>
                                                </div>
                                                {client.phone && (
                                                    <div className="detail-item">
                                                        <span className="detail-label">Phone:</span>
                                                        <span className="detail-value">{client.phone}</span>
                                                    </div>
                                                )}
                                                <div className="detail-item">
                                                    <span className="detail-label">Created:</span>
                                                    <span className="detail-value">{formatDate(client.created_at)}</span>
                                                </div>
                                            </div>

                                            <div className="client-outstanding">
                                                <span className="outstanding-label">Outstanding:</span>
                                                <span className={`outstanding-amount ${client.outstanding_amount > 0 ? 'has-outstanding' : ''}`}>
                                                    {formatCurrency(client.outstanding_amount)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Create Client Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create New Client</h2>
                            <button
                                className="modal-close"
                                onClick={() => setShowCreateModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleCreateClient} className="client-form">
                            <div className="form-group">
                                <label htmlFor="name">Name *</label>
                                <input
                                    type="text"
                                    id="name"
                                    value={newClient.name}
                                    onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Email *</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={newClient.email}
                                    onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="phone">Phone</label>
                                <input
                                    type="tel"
                                    id="phone"
                                    value={newClient.phone}
                                    onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="company">Company</label>
                                <input
                                    type="text"
                                    id="company"
                                    value={newClient.company}
                                    onChange={(e) => setNewClient(prev => ({ ...prev, company: e.target.value }))}
                                />
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="submit-btn"
                                    disabled={creating}
                                >
                                    {creating ? 'Creating...' : 'Create Client'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Clients;