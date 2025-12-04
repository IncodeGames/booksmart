import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import {
    ClientCard,
    ClientModal,
    ClientModalMode,
    DeleteConfirmModal,
    ClientSearchBar,
    ClientDetailPage,
} from './components';
import { useClientStore } from './stores/clientStore';
import { Client, ClientFormData, ClientsPageProps } from './types';
import '../../components/styles/base.css';
import './styles/Clients.css';

enum PageView {
    List = 'list',
    Detail = 'detail',
}

const ClientsPage: React.FC<ClientsPageProps> = ({ user, onSignOut }) => {
    const {
        clients,
        filteredClients,
        loading,
        error,
        filters,
        fetchClients,
        createClient,
        updateClient,
        deleteClient,
        setFilters,
        resetFilters,
        clearError,
    } = useClientStore();

    // View state
    const [currentView, setCurrentView] = useState<PageView>(PageView.List);
    const [viewingClient, setViewingClient] = useState<Client | null>(null);

    // Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const totalOutstanding = clients.reduce(
        (sum, client) => sum + client.outstanding_amount,
        0
    );

    // Handlers
    const handleOpenCreateModal = useCallback((): void => {
        setIsCreateModalOpen(true);
    }, []);

    const handleCloseCreateModal = useCallback((): void => {
        setIsCreateModalOpen(false);
    }, []);

    const handleOpenEditModal = useCallback((client: Client): void => {
        setSelectedClient(client);
        setIsEditModalOpen(true);
    }, []);

    const handleCloseEditModal = useCallback((): void => {
        setIsEditModalOpen(false);
        setSelectedClient(null);
    }, []);

    const handleOpenDeleteModal = useCallback((client: Client): void => {
        setSelectedClient(client);
        setIsDeleteModalOpen(true);
    }, []);

    const handleCloseDeleteModal = useCallback((): void => {
        setIsDeleteModalOpen(false);
        setSelectedClient(null);
    }, []);

    const handleCreateClient = useCallback(
        async (data: ClientFormData): Promise<void> => {
            try {
                setIsSubmitting(true);
                await createClient(data);
                setIsCreateModalOpen(false);
            } catch {
                // Error is handled by the store
            } finally {
                setIsSubmitting(false);
            }
        },
        [createClient]
    );

    const handleUpdateClient = useCallback(
        async (data: ClientFormData): Promise<void> => {
            if (!selectedClient) return;

            try {
                setIsSubmitting(true);
                await updateClient(selectedClient.id, data);
                setIsEditModalOpen(false);
                setSelectedClient(null);
            } catch {
                // Error is handled by the store
            } finally {
                setIsSubmitting(false);
            }
        },
        [selectedClient, updateClient]
    );

    const handleDeleteClient = useCallback(async (): Promise<void> => {
        if (!selectedClient) return;

        try {
            setIsSubmitting(true);
            await deleteClient(selectedClient.id);
            setIsDeleteModalOpen(false);
            setSelectedClient(null);
        } catch {
            // Error is handled by the store
        } finally {
            setIsSubmitting(false);
        }
    }, [selectedClient, deleteClient]);

    const handleDismissError = useCallback((): void => {
        clearError();
    }, [clearError]);

    const handleViewClientDetails = useCallback((client: Client): void => {
        setViewingClient(client);
        setCurrentView(PageView.Detail);
    }, []);

    const handleBackToList = useCallback((): void => {
        setViewingClient(null);
        setCurrentView(PageView.List);
        // Refresh the clients list in case there were changes
        fetchClients();
    }, [fetchClients]);

    // Render detail page if viewing a client
    if (currentView === PageView.Detail && viewingClient) {
        return (
            <div className="clients-page">
                <Sidebar />
                <div className="page-content">
                    <ClientDetailPage client={viewingClient} onBack={handleBackToList} />
                </div>
            </div>
        );
    }

    return (
        <div className="clients-page">
            <Sidebar />
            <div className="page-content">
                {/* Header */}
                <header className="clients-header">
                    <div className="header-left">
                        <h1>Clients</h1>
                    </div>

                    <div className="header-right">
                        <button
                            className="create-client-btn"
                            onClick={handleOpenCreateModal}
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
                            <button
                                className="dismiss-error-btn"
                                onClick={handleDismissError}
                                aria-label="Dismiss error"
                            >
                                ×
                            </button>
                        </div>
                    )}

                    {loading ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>Loading clients...</p>
                        </div>
                    ) : (
                        <div className="clients-container">
                            {/* Summary Cards */}
                            <div className="clients-summary">
                                <div className="summary-card">
                                    <h3>Total Clients</h3>
                                    <div className="summary-value">{clients.length}</div>
                                </div>
                                <div className="summary-card">
                                    <h3>Total Outstanding</h3>
                                    <div className="summary-value">
                                        {formatCurrency(totalOutstanding)}
                                    </div>
                                </div>
                            </div>

                            {/* Search and Filter Bar */}
                            <ClientSearchBar
                                filters={filters}
                                onFiltersChange={setFilters}
                                onReset={resetFilters}
                                totalCount={clients.length}
                                filteredCount={filteredClients.length}
                            />

                            {/* Client List */}
                            <div className="clients-list">
                                {clients.length === 0 ? (
                                    <div className="empty-state">
                                        <h3>No clients yet</h3>
                                        <p>Create your first client to get started</p>
                                        <button
                                            className="create-client-btn"
                                            onClick={handleOpenCreateModal}
                                        >
                                            + Create Client
                                        </button>
                                    </div>
                                ) : filteredClients.length === 0 ? (
                                    <div className="empty-state">
                                        <h3>No clients match your filters</h3>
                                        <p>Try adjusting your search or filter criteria</p>
                                        <button
                                            className="reset-filters-btn"
                                            onClick={resetFilters}
                                        >
                                            Clear Filters
                                        </button>
                                    </div>
                                ) : (
                                    <div className="clients-grid">
                                        {filteredClients.map((client) => (
                                            <ClientCard
                                                key={client.id}
                                                client={client}
                                                onEdit={handleOpenEditModal}
                                                onDelete={handleOpenDeleteModal}
                                                onViewDetails={handleViewClientDetails}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Create Client Modal */}
            <ClientModal
                mode={ClientModalMode.Create}
                isOpen={isCreateModalOpen}
                isSubmitting={isSubmitting}
                onClose={handleCloseCreateModal}
                onSubmit={handleCreateClient}
            />

            {/* Edit Client Modal */}
            <ClientModal
                mode={ClientModalMode.Edit}
                client={selectedClient}
                isOpen={isEditModalOpen}
                isSubmitting={isSubmitting}
                onClose={handleCloseEditModal}
                onSubmit={handleUpdateClient}
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                client={selectedClient}
                isOpen={isDeleteModalOpen}
                isDeleting={isSubmitting}
                onClose={handleCloseDeleteModal}
                onConfirm={handleDeleteClient}
            />
        </div>
    );
};

export default ClientsPage;
