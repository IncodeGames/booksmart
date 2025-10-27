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

    return (
        <div className="expenses-page">
            <Sidebar />
            <div className="page-content">
                <div className="page-header">
                    <h1>
                        <Receipt className="header-icon" />
                        Expenses
                    </h1>
                    <button
                        className="add-expense-btn btn-primary"
                        onClick={() => setIsModalOpen(true)}
                    >
                        <Plus size={20} />
                        Add Expense
                    </button>
                </div>

                {/* Summary Card */}
                <div className="expenses-summary card">
                    <div className="summary-item">
                        <span className="summary-label">Total Expenses</span>
                        <span className="summary-value expense-amount">
                            ${totalExpenses.toFixed(2)}
                        </span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Total Records</span>
                        <span className="summary-value">{filteredExpenses.length}</span>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="search-section">
                    <div className="search-bar">
                        <Search className="search-icon" size={20} />
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
