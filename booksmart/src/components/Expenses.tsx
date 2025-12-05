import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Expense } from '../types';
import { Plus, Receipt, Search, X } from 'lucide-react';
import Sidebar from './Sidebar';
import AddExpenseModal from './AddExpenseModal';
import ExpenseList from './ExpenseList';
import './styles/Expenses.css';
import './styles/base.css';

const ExpensesPage = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // Fetch expenses from Supabase
    const fetchExpenses = async () => {
        setLoading(true);
        try {
            // TODO: Add user authentication check
            const { data, error } = await supabase
                .from('expenses')
                .select('*')
                .order('date', { ascending: false });

            if (error) {
                console.error('Error fetching expenses:', error);
            } else {
                setExpenses(data || []);
                setFilteredExpenses(data || []);
            }
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    // Filter expenses based on search term
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredExpenses(expenses);
        } else {
            const filtered = expenses.filter((expense) => {
                const searchLower = searchTerm.toLowerCase();
                return (
                    expense.category?.toLowerCase().includes(searchLower) ||
                    expense.description?.toLowerCase().includes(searchLower) ||
                    expense.vendor?.toLowerCase().includes(searchLower) ||
                    expense.amount.toString().includes(searchLower)
                );
            });
            setFilteredExpenses(filtered);
        }
    }, [searchTerm, expenses]);

    const handleAddExpense = async (expenseData: Omit<Expense, 'id' | 'created_at'>) => {
        try {
            // TODO: Add user_id from auth context
            const response = await supabase.auth.getUser();
            expenseData.user_id = response?.data?.user?.id;
            const { data, error } = await supabase
                .from('expenses')
                .insert([expenseData])
                .select()
                .single();

            if (error) {
                console.error('Error adding expense:', error);
                return false;
            }

            // Refresh the list
            await fetchExpenses();
            setIsModalOpen(false);
            return true;
        } catch (error) {
            console.error('Error adding expense:', error);
            return false;
        }
    };

    const handleDeleteExpense = async (id: string) => {
        try {
            const { error } = await supabase
                .from('expenses')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting expense:', error);
                return false;
            }

            // Refresh the list
            await fetchExpenses();
            return true;
        } catch (error) {
            console.error('Error deleting expense:', error);
            return false;
        }
    };

    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const averageExpense = filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0;

    return (
        <div className="expenses-page">
            <Sidebar />
            <div className="page-content">
                {/* Header */}
                <header className="expenses-header">
                    <div className="header-left">
                        <h1>Expenses</h1>
                    </div>

                    <div className="header-right">
                        <button
                            className="create-expense-btn"
                            onClick={() => setIsModalOpen(true)}
                            aria-label="Add new expense"
                        >
                            <Plus size={20} />
                            Add Expense
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <div className="expenses-main">
                    {/* Summary Cards */}
                    <div className="expenses-summary">
                        <div className="summary-card">
                            <h3>Total Expenses</h3>
                            <p className="summary-value expense-amount">
                                ${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="summary-card">
                            <h3>Total Records</h3>
                            <p className="summary-value">{filteredExpenses.length}</p>
                        </div>
                        <div className="summary-card">
                            <h3>Average Amount</h3>
                            <p className="summary-value">
                                ${averageExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="expenses-filters">
                        <div className="search-container">
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search by category, vendor, description, or amount..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    className="clear-search-btn"
                                    onClick={() => setSearchTerm('')}
                                    aria-label="Clear search"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Expense List */}
                    <ExpenseList
                        expenses={filteredExpenses}
                        loading={loading}
                        onDelete={handleDeleteExpense}
                        onRefresh={fetchExpenses}
                    />
                </div>

                {/* Add Expense Modal */}
                {isModalOpen && (
                    <AddExpenseModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSubmit={handleAddExpense}
                    />
                )}
            </div>
        </div>
    );
};

export default ExpensesPage;
