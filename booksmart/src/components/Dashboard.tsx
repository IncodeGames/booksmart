import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import InvoiceTemplate from './InvoiceTemplate';
import './styles/Dashboard.css';

import {
    BarChart,
    Bar,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface User {
    email?: string;
}

interface DashboardProps {
    user: User;
    onSignOut: () => void;
    onNavigateToClients?: () => void;
}

interface WindowSize {
    width: number;
    height: number;
}

interface Stat {
    title: string;
    value: string;
    change: string;
    trend: 'up' | 'down';
}

interface ActivityItem {
    action: string;
    time: string;
    type: 'user' | 'deployment' | 'payment' | 'system';
}

enum InvoiceType {
    UNPAID = 'Unpaid',
    PAID = 'Paid'
}

// Chart data interfaces
interface RevenueExpenseData {
    month: string;
    revenue: number;
    expenses: number;
}

interface ProfitData {
    month: string;
    profit: number;
}

interface InvoiceData {
    name: string;
    value: number;
    color: string;
}

const Dashboard = ({ user, onSignOut, onNavigateToClients }: DashboardProps) => {
    const [currentView, setCurrentView] = useState<'dashboard' | 'invoice-template'>('dashboard');
    const [windowSize, setWindowSize] = useState<WindowSize>({
        width: window.innerWidth,
        height: window.innerHeight
    });
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

    // Chart data states
    const [revenueExpenseData, setRevenueExpenseData] = useState<RevenueExpenseData[]>([]);
    const [profitData, setProfitData] = useState<ProfitData[]>([]);
    const [invoiceData, setInvoiceData] = useState<InvoiceData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const handleResize = (): void => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch data from Supabase
    useEffect(() => {
        const fetchChartData = async () => {
            try {
                setLoading(true);

                // Fetch revenue and expense data
                const { data: revenueExpenses, error: reError } = await supabase
                    .from('financial_data')
                    .select('month, revenue, expenses')
                    .order('month');

                if (reError) throw reError;

                const profits: ProfitData[] = [];
                for (let i = 0; i < revenueExpenses.length; i++) {
                    const profitData = {
                        month: revenueExpenses[i].month,
                        profit: revenueExpenses[i].revenue - revenueExpenses[i].expenses
                    }
                    profits.push(profitData);
                }

                // Fetch invoice data
                const { data: invoices, error: invoiceError } = await supabase
                    .from('invoices')
                    .select('invoice_status, amount');

                if (invoiceError) throw invoiceError;

                // Process data
                setRevenueExpenseData(revenueExpenses || []);
                setProfitData(profits || []);

                // Process invoice data for pie chart
                if (invoices) {
                    const outstanding = invoices
                        .filter(inv => inv.invoice_status === InvoiceType.UNPAID)
                        .reduce((sum, inv) => sum + inv.amount, 0);

                    const paid = invoices
                        .filter(inv => inv.invoice_status === InvoiceType.PAID)
                        .reduce((sum, inv) => sum + inv.amount, 0);

                    setInvoiceData([
                        { name: 'Outstanding', value: outstanding, color: '#ff6b6b' },
                        { name: 'Paid', value: paid, color: '#4ecdc4' }
                    ]);
                }

            } catch (error) {
                console.error('Error fetching chart data:', error);

                // Fallback to sample data if Supabase fails
                setRevenueExpenseData([
                    { month: 'Jan', revenue: 12000, expenses: 8000 },
                    { month: 'Feb', revenue: 15000, expenses: 9000 },
                    { month: 'Mar', revenue: 18000, expenses: 10000 },
                    { month: 'Apr', revenue: 22000, expenses: 12000 },
                    { month: 'May', revenue: 25000, expenses: 13000 },
                    { month: 'Jun', revenue: 28000, expenses: 14000 }
                ]);

                setProfitData([
                    { month: 'Jan', profit: 4000 },
                    { month: 'Feb', profit: 6000 },
                    { month: 'Mar', profit: 8000 },
                    { month: 'Apr', profit: 10000 },
                    { month: 'May', profit: 12000 },
                    { month: 'Jun', profit: 14000 }
                ]);

                setInvoiceData([
                    { name: 'Outstanding', value: 45000, color: '#ff6b6b' },
                    { name: 'Paid', value: 125000, color: '#4ecdc4' }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchChartData();
    }, []);

    const isMobile: boolean = windowSize.width <= 768;

    const stats: Stat[] = [
        { title: 'Total Projects', value: '12', change: '+2.5%', trend: 'up' },
        { title: 'Active Users', value: '1,234', change: '+12.3%', trend: 'up' },
        { title: 'Revenue', value: '$45.2K', change: '+8.1%', trend: 'up' },
        { title: 'Conversion', value: '3.2%', change: '-1.2%', trend: 'down' },
    ];

    const recentActivity: ActivityItem[] = [
        { action: 'New user registration', time: '2 minutes ago', type: 'user' },
        { action: 'Project deployed', time: '15 minutes ago', type: 'deployment' },
        { action: 'Payment received', time: '1 hour ago', type: 'payment' },
        { action: 'Database backup completed', time: '3 hours ago', type: 'system' },
    ];

    const navigateToInvoiceTemplate = () => {
        setCurrentView('invoice-template');
    };

    const navigateBackToDashboard = () => {
        setCurrentView('dashboard');
    };

    if (currentView === 'invoice-template') {
        return <InvoiceTemplate user={user} onBack={navigateBackToDashboard} />;
    }

    return (
        <div className="dashboard">
            {/* Sidebar */}
            <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo">
                        <div className="logo-icon"></div>
                        <span className="logo-text">YourApp</span>
                    </div>
                    {isMobile && (
                        <button
                            className="sidebar-close"
                            onClick={() => setSidebarOpen(false)}
                        >
                            ×
                        </button>
                    )}
                </div>

                <nav className="sidebar-nav">
                    <a href="#" className="nav-item active">
                        <span className="nav-icon">📊</span>
                        Dashboard
                    </a>
                    <a href="#" className="nav-item" onClick={() => onNavigateToClients()}>
                        <span className="nav-icon">👥</span>
                        Clients
                    </a>
                    <a
                        href="#"
                        className="nav-item"
                        onClick={(e) => {
                            e.preventDefault();
                            navigateToInvoiceTemplate();
                        }}
                    >
                        <span className="nav-icon">📄</span>
                        Invoice Templates
                    </a>
                    <a href="#" className="nav-item">
                        <span className="nav-icon">📈</span>
                        Analytics
                    </a>
                    <a href="#" className="nav-item">
                        <span className="nav-icon">⚙️</span>
                        Settings
                    </a>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="dashboard-main">
                {/* Header */}
                <header className="dashboard-header">
                    <div className="header-left">
                        {isMobile && (
                            <button
                                className="menu-toggle"
                                onClick={() => setSidebarOpen(true)}
                            >
                                ☰
                            </button>
                        )}
                        <h1>Dashboard</h1>
                    </div>

                    <div className="header-right">
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

                {/* Dashboard Content */}
                <div className="dashboard-content">
                    {/* Welcome Section */}
                    <section className="welcome-section">
                        <div className="welcome-card">
                            <h2>Welcome back!</h2>
                            <p>Here's what's happening with your projects today.</p>
                        </div>
                    </section>

                    {/* Stats Grid */}
                    <section className="stats-section">
                        <div className="stats-grid">
                            {stats.map((stat, index) => (
                                <div key={index} className="stat-card">
                                    <div className="stat-header">
                                        <h3>{stat.title}</h3>
                                        <span className={`stat-change ${stat.trend}`}>
                                            {stat.change}
                                        </span>
                                    </div>
                                    <div className="stat-value">{stat.value}</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Charts Section */}
                    <section className="charts-section">
                        <div className="charts-grid">
                            {/* Revenue vs Expenses Bar Chart */}
                            <div className="chart-card">
                                <div className="card-header">
                                    <h3>Revenue vs Expenses</h3>
                                </div>
                                <div className="chart-container">
                                    {loading ? (
                                        <div className="chart-loading">Loading...</div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={revenueExpenseData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="month" />
                                                <YAxis />
                                                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                                                <Legend />
                                                <Bar dataKey="revenue" fill="#4ecdc4" name="Revenue" />
                                                <Bar dataKey="expenses" fill="#ff6b6b" name="Expenses" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>

                            {/* Total Profit Area Chart */}
                            <div className="chart-card">
                                <div className="card-header">
                                    <h3>Total Profit Trend</h3>
                                </div>
                                <div className="chart-container">
                                    {loading ? (
                                        <div className="chart-loading">Loading...</div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <AreaChart data={profitData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="month" />
                                                <YAxis />
                                                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Profit']} />
                                                <Area
                                                    type="monotone"
                                                    dataKey="profit"
                                                    stroke="#8884d8"
                                                    fill="#8884d8"
                                                    fillOpacity={0.6}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>

                            {/* Invoice Status Pie Chart */}
                            <div className="chart-card">
                                <div className="card-header">
                                    <h3>Invoice Status</h3>
                                </div>
                                <div className="chart-container">
                                    {loading ? (
                                        <div className="chart-loading">Loading...</div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={invoiceData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {invoiceData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Content Grid */}
                    <section className="content-section">
                        <div className="content-grid">
                            {/* Chart Card */}
                            <div className="content-card chart-card">
                                <div className="card-header">
                                    <h3>Analytics Overview</h3>
                                    <button className="card-action">View All</button>
                                </div>
                                <div className="chart-container">
                                    <div className="chart-placeholder">
                                        {[...Array(7)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="chart-bar"
                                                style={{
                                                    height: `${Math.random() * 80 + 20}%`,
                                                    animationDelay: `${i * 0.1}s`
                                                }}
                                            ></div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Activity Card */}
                            <div className="content-card activity-card">
                                <div className="card-header">
                                    <h3>Recent Activity</h3>
                                    <button className="card-action">View All</button>
                                </div>
                                <div className="activity-list">
                                    {recentActivity.map((item, index) => (
                                        <div key={index} className="activity-item">
                                            <div className={`activity-icon ${item.type}`}></div>
                                            <div className="activity-content">
                                                <p>{item.action}</p>
                                                <span className="activity-time">{item.time}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            {/* Mobile Sidebar Overlay */}
            {isMobile && sidebarOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}
        </div>
    );
};

export default Dashboard;