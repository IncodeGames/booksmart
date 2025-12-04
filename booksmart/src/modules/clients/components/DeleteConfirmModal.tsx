import React from 'react';
import { Client } from '../types';

interface DeleteConfirmModalProps {
    client: Client | null;
    isOpen: boolean;
    isDeleting: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
    client,
    isOpen,
    isDeleting,
    onClose,
    onConfirm,
}) => {
    const handleOverlayClick = (e: React.MouseEvent): void => {
        if (e.target === e.currentTarget && !isDeleting) {
            onClose();
        }
    };

    if (!isOpen || !client) {
        return null;
    }

    const hasOutstandingInvoices = client.outstanding_invoice_count > 0;

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-content delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Delete Client</h2>
                    <button
                        className="modal-close"
                        onClick={onClose}
                        disabled={isDeleting}
                        aria-label="Close modal"
                    >
                        ×
                    </button>
                </div>

                <div className="delete-confirm-body">
                    <div className="delete-warning-icon">⚠️</div>
                    <p className="delete-confirm-message">
                        Are you sure you want to delete <strong>{client.name}</strong>?
                    </p>
                    {hasOutstandingInvoices && (
                        <p className="delete-warning-message">
                            This client has {client.outstanding_invoice_count} outstanding invoice
                            {client.outstanding_invoice_count > 1 ? 's' : ''}. Deleting this client
                            may affect your invoice records.
                        </p>
                    )}
                    <p className="delete-note">This action cannot be undone.</p>
                </div>

                <div className="form-actions">
                    <button
                        type="button"
                        className="cancel-btn"
                        onClick={onClose}
                        disabled={isDeleting}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="delete-confirm-btn"
                        onClick={onConfirm}
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete Client'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;
