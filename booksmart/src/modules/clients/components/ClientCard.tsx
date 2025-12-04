import React from 'react';
import { Client } from '../types';

interface ClientCardProps {
    client: Client;
    onEdit: (client: Client) => void;
    onDelete: (client: Client) => void;
    onViewDetails: (client: Client) => void;
}

const ClientCard: React.FC<ClientCardProps> = ({ client, onEdit, onDelete, onViewDetails }) => {
    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="client-card">
            <div className="client-header">
                <button
                    className="client-avatar client-avatar-btn"
                    onClick={() => onViewDetails(client)}
                    title={`View ${client.name}'s history`}
                    aria-label={`View ${client.name}'s invoice and expense history`}
                >
                    {client.name.charAt(0).toUpperCase()}
                </button>
                <div className="client-info">
                    <h3>{client.name}</h3>
                    {client.company && (
                        <p className="client-company">{client.company}</p>
                    )}
                </div>
                <div className="client-actions">
                    <button
                        className="action-btn edit-btn"
                        onClick={() => onEdit(client)}
                        title="Edit client"
                        aria-label={`Edit ${client.name}`}
                    >
                        ✎
                    </button>
                    <button
                        className="action-btn delete-btn"
                        onClick={() => onDelete(client)}
                        title="Delete client"
                        aria-label={`Delete ${client.name}`}
                    >
                        ✕
                    </button>
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

            <div className="client-invoice-summary">
                <div className="invoice-count-row">
                    <div className="invoice-count outstanding-count">
                        <span className="count-value">{client.outstanding_invoice_count}</span>
                        <span className="count-label">Outstanding</span>
                    </div>
                    <div className="invoice-count paid-count">
                        <span className="count-value">{client.paid_invoice_count}</span>
                        <span className="count-label">Paid</span>
                    </div>
                </div>
            </div>

            <div className="client-outstanding">
                <span className="outstanding-label">Outstanding Balance:</span>
                <span
                    className={`outstanding-amount ${
                        client.outstanding_amount > 0 ? 'has-outstanding' : ''
                    }`}
                >
                    {formatCurrency(client.outstanding_amount)}
                </span>
            </div>
        </div>
    );
};

export default ClientCard;
