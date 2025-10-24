import React, { useState } from 'react';
import { Expense } from '../types';
import { X } from 'lucide-react';
import './styles/AddExpenseModal.css';

interface AddExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (expense: Omit<Expense, 'id' | 'created_at'>) => Promise<boolean>;
}

const EXPENSE_CATEGORIES = [
    'Office Supplies',
    'Software & Subscriptions',
    'Travel',
    'Meals & Entertainment',
    'Marketing & Advertising',
    'Professional Services',
    'Utilities',
    'Rent',
    'Insurance',
    'Equipment',
    'Training & Education',
    'Other',
];

const PAYMENT_METHODS = [
    'Cash',
    'Credit Card',
    'Debit Card',
    'Bank Transfer',
    'Check',
    'Other',
];

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        category: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        vendor: '',
        payment_method: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.category) {
            newErrors.category = 'Category is required';
        }

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            newErrors.amount = 'Amount must be greater than 0';
        }

        if (!formData.date) {
            newErrors.date = 'Date is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        setSubmitting(true);

        const expenseData: Omit<Expense, 'id' | 'created_at'> = {
            category: formData.category,
            amount: parseFloat(formData.amount),
            description: formData.description || undefined,
            date: formData.date,
            vendor: formData.vendor || undefined,
            payment_method: formData.payment_method || undefined,
        };

        const success = await onSubmit(expenseData);

        setSubmitting(false);

        if (success) {
            // Reset form
            setFormData({
                category: '',
                amount: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                vendor: '',
                payment_method: '',
            });
            setErrors({});
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="modal-content expense-modal animate-fadeIn">
                <div className="modal-header">
                    <h2>Add New Expense</h2>
                    <button
                        className="modal-close-btn"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="expense-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="category">
                                Category <span className="required">*</span>
                            </label>
                            <select
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className={errors.category ? 'error' : ''}
                            >
                                <option value="">Select a category</option>
                                {EXPENSE_CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                            {errors.category && (
                                <span className="error-message">{errors.category}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="amount">
                                Amount <span className="required">*</span>
                            </label>
                            <input
                                type="number"
                                id="amount"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                className={errors.amount ? 'error' : ''}
                            />
                            {errors.amount && (
                                <span className="error-message">{errors.amount}</span>
                            )}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="date">
                                Date <span className="required">*</span>
                            </label>
                            <input
                                type="date"
                                id="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                className={errors.date ? 'error' : ''}
                            />
                            {errors.date && (
                                <span className="error-message">{errors.date}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="payment_method">Payment Method</label>
                            <select
                                id="payment_method"
                                name="payment_method"
                                value={formData.payment_method}
                                onChange={handleChange}
                            >
                                <option value="">Select payment method</option>
                                {PAYMENT_METHODS.map((method) => (
                                    <option key={method} value={method}>
                                        {method}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="vendor">Vendor/Payee</label>
                        <input
                            type="text"
                            id="vendor"
                            name="vendor"
                            value={formData.vendor}
                            onChange={handleChange}
                            placeholder="Enter vendor name"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Add any additional notes or details..."
                            rows={4}
                        />
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submitting}
                        >
                            {submitting ? 'Adding...' : 'Add Expense'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddExpenseModal;
