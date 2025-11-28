import React, { useState } from 'react';
import { Expense } from '../types';
import { Trash2, Calendar, CreditCard, User, FileText, AlertTriangle } from 'lucide-react';
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
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        expenseId: string;
    } | null>(null);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this expense?')) {
            return;
        }

        setDeletingId(id);
        const success = await onDelete(id);
        setDeletingId(null);
        setContextMenu(null);

        if (!success) {
            alert('Failed to delete expense. Please try again.');
        }
    };

    const handleRightClick = (e: React.MouseEvent, expenseId: string) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            expenseId,
        });
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

    // Close context menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = () => setContextMenu(null);
        if (contextMenu) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [contextMenu]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading expenses...</p>
            </div>
        );
    }

    if (expenses.length === 0) {
        return (
            <div className="empty-state">
                <FileText size={64} className="empty-icon" />
                <h3>No expenses found</h3>
                <p>Start by adding your first expense using the button above.</p>
            </div>
        );
    }

    return (
        <>
            <div className="expenses-table">
                <div className="table-header">
                    <button className="header-cell sortable">Date</button>
                    <button className="header-cell sortable">Category</button>
                    <button className="header-cell sortable">Vendor</button>
                    <button className="header-cell sortable">Amount</button>
                    <button className="header-cell">Payment Method</button>
                    <button className="header-cell">Description</button>
                </div>

                <div className="table-body">
                    {expenses.map((expense) => (
                        <div
                            key={expense.id}
                            className="table-row"
                            onContextMenu={(e) => handleRightClick(e, expense.id)}
                        >
                            <div className="table-cell">
                                <Calendar size={14} />
                                {formatDate(expense.date)}
                            </div>

                            <div className="table-cell">
                                <div
                                    className="category-badge"
                                    style={{
                                        backgroundColor: `${getCategoryColor(expense.category)}20`,
                                        color: getCategoryColor(expense.category),
                                        border: `1px solid ${getCategoryColor(expense.category)}40`
                                    }}
                                >
                                    {expense.category}
                                </div>
                            </div>

                            <div className="table-cell">
                                {expense.vendor && (
                                    <>
                                        <User size={14} />
                                        {expense.vendor}
                                    </>
                                )}
                            </div>

                            <div className="table-cell amount">
                                ${expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>

                            <div className="table-cell">
                                {expense.payment_method && (
                                    <>
                                        <CreditCard size={14} />
                                        {expense.payment_method}
                                    </>
                                )}
                            </div>

                            <div className="table-cell description">
                                {expense.description && (
                                    <>
                                        <FileText size={14} />
                                        <span className="description-text" title={expense.description}>
                                            {expense.description}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="context-menu"
                    style={{
                        position: 'fixed',
                        top: contextMenu.y,
                        left: contextMenu.x,
                        zIndex: 1000,
                    }}
                >
                    <button
                        className="delete-option"
                        onClick={() => handleDelete(contextMenu.expenseId)}
                        disabled={deletingId === contextMenu.expenseId}
                    >
                        <Trash2 size={14} />
                        {deletingId === contextMenu.expenseId ? 'Deleting...' : 'Delete Expense'}
                    </button>
                </div>
            )}
        </>
    );
};

export default ExpenseList;
