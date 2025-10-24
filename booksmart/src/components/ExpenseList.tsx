import React, { useState } from 'react';
import { Expense } from '../types';
import { Trash2, Calendar, CreditCard, User, FileText } from 'lucide-react';
import './styles/ExpenseList.css';

interface ExpenseListProps {
    expenses: Expense[];
    loading: boolean;
    onDelete: (id: string) => Promise<boolean>;
    onRefresh: () => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({
    expenses,
    loading,
    onDelete,
    onRefresh,
}) => {
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this expense?')) {
            return;
        }

        setDeletingId(id);
        const success = await onDelete(id);
        setDeletingId(null);

        if (!success) {
            alert('Failed to delete expense. Please try again.');
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            'Office Supplies': '#3b82f6',
            'Software & Subscriptions': '#8b5cf6',
            'Travel': '#06b6d4',
            'Meals & Entertainment': '#f59e0b',
            'Marketing & Advertising': '#ec4899',
            'Professional Services': '#10b981',
            'Utilities': '#6366f1',
            'Rent': '#ef4444',
            'Insurance': '#14b8a6',
            'Equipment': '#f97316',
            'Training & Education': '#8b5cf6',
            'Other': '#6b7280',
        };
        return colors[category] || '#6b7280';
    };

    if (loading) {
        return (
            <div className="expense-list-container">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading expenses...</p>
                </div>
            </div>
        );
    }

    if (expenses.length === 0) {
        return (
            <div className="expense-list-container">
                <div className="empty-state">
                    <FileText size={64} className="empty-icon" />
                    <h3>No expenses found</h3>
                    <p>Start by adding your first expense using the button above.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="expense-list-container">
            <div className="expense-list">
                {expenses.map((expense) => {
                    const isExpanded = expandedId === expense.id;
                    return (
                        <div
                            key={expense.id}
                            className={`expense-item ${isExpanded ? 'expanded' : ''}`}
                        >
                            <div
                                className="expense-item-header"
                                onClick={() => toggleExpand(expense.id)}
                            >
                                <div className="expense-main-info">
                                    <div
                                        className="expense-category-badge"
                                        style={{
                                            backgroundColor: `${getCategoryColor(expense.category)}20`,
                                            color: getCategoryColor(expense.category),
                                        }}
                                    >
                                        {expense.category}
                                    </div>
                                    <div className="expense-date">
                                        <Calendar size={14} />
                                        {formatDate(expense.date)}
                                    </div>
                                </div>

                                <div className="expense-amount-section">
                                    <span className="expense-amount">
                                        ${expense.amount.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="expense-item-details">
                                    {expense.vendor && (
                                        <div className="expense-detail-row">
                                            <User size={16} />
                                            <span className="detail-label">Vendor:</span>
                                            <span className="detail-value">{expense.vendor}</span>
                                        </div>
                                    )}

                                    {expense.payment_method && (
                                        <div className="expense-detail-row">
                                            <CreditCard size={16} />
                                            <span className="detail-label">Payment Method:</span>
                                            <span className="detail-value">
                                                {expense.payment_method}
                                            </span>
                                        </div>
                                    )}

                                    {expense.description && (
                                        <div className="expense-detail-row">
                                            <FileText size={16} />
                                            <span className="detail-label">Description:</span>
                                            <span className="detail-value">
                                                {expense.description}
                                            </span>
                                        </div>
                                    )}

                                    <div className="expense-actions">
                                        <button
                                            className="btn-delete"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(expense.id);
                                            }}
                                            disabled={deletingId === expense.id}
                                        >
                                            <Trash2 size={16} />
                                            {deletingId === expense.id ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ExpenseList;
