import React, { useState, useEffect } from 'react';
import { Client, ClientFormData } from '../types';

export enum ClientModalMode {
    Create = 'create',
    Edit = 'edit',
}

interface ClientModalProps {
    mode: ClientModalMode;
    client?: Client | null;
    isOpen: boolean;
    isSubmitting: boolean;
    onClose: () => void;
    onSubmit: (data: ClientFormData) => void;
}

const createEmptyFormData = (): ClientFormData => ({
    name: '',
    email: '',
    phone: '',
    company: '',
});

const ClientModal: React.FC<ClientModalProps> = ({
    mode,
    client,
    isOpen,
    isSubmitting,
    onClose,
    onSubmit,
}) => {
    const [formData, setFormData] = useState<ClientFormData>(createEmptyFormData());
    const [validationError, setValidationError] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            if (mode === ClientModalMode.Edit && client) {
                setFormData({
                    name: client.name,
                    email: client.email,
                    phone: client.phone || '',
                    company: client.company || '',
                });
            } else {
                setFormData(createEmptyFormData());
            }
            setValidationError('');
        }
    }, [isOpen, mode, client]);

    const handleSubmit = (e: React.FormEvent): void => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setValidationError('Name is required');
            return;
        }

        if (!formData.email.trim()) {
            setValidationError('Email is required');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setValidationError('Please enter a valid email address');
            return;
        }

        setValidationError('');
        onSubmit(formData);
    };

    const handleChange = (field: keyof ClientFormData, value: string): void => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (validationError) {
            setValidationError('');
        }
    };

    const handleOverlayClick = (e: React.MouseEvent): void => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) {
        return null;
    }

    const title = mode === ClientModalMode.Create ? 'Create New Client' : 'Edit Client';
    const submitText = mode === ClientModalMode.Create ? 'Create Client' : 'Save Changes';
    const submittingText = mode === ClientModalMode.Create ? 'Creating...' : 'Saving...';

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button
                        className="modal-close"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="client-form">
                    {validationError && (
                        <div className="form-error">{validationError}</div>
                    )}

                    <div className="form-group">
                        <label htmlFor="client-name">Name *</label>
                        <input
                            type="text"
                            id="client-name"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="Enter client name"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="client-email">Email *</label>
                        <input
                            type="email"
                            id="client-email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            placeholder="Enter email address"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="client-phone">Phone</label>
                        <input
                            type="tel"
                            id="client-phone"
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            placeholder="Enter phone number"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="client-company">Company</label>
                        <input
                            type="text"
                            id="client-company"
                            value={formData.company}
                            onChange={(e) => handleChange('company', e.target.value)}
                            placeholder="Enter company name"
                        />
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? submittingText : submitText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClientModal;
