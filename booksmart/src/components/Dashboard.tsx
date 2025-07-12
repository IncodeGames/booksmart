import { useEffect } from 'react';
import { useDashboardStore } from '../stores/dashboardStore';
import { useNavigationStore } from '../stores/navigationStore';
import { useWindowSize } from '../hooks/useWindowSize';
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
    onNavigate?: (string) => void;
}

interface Stat {
    title: string;
    value: string;
}

const Dashboard = ({ user, onSignOut, onNavigate }: DashboardProps) => {
    const windowSize = useWindowSize();

    // Zustand stores
    const {
        dashboardData,
        revenueExpenseData,
        profitData,
        invoiceData,
        loading,
        error,
        fetchDashboardData
    } = useDashboardStore();

    const {
        currentDashboardView,
        sidebarOpen,
        setCurrentDashboardView,
        setSidebarOpen
    } = useNavigationStore();

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const isMobile: boolean = windowSize.width <= 768;

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const stats: Stat[] = [
        {
            title: 'Total Revenue',
            value: formatCurrency(dashboardData.totalRevenue),
        },
        {
            title: 'Total Expenses',
            value: formatCurrency(dashboardData.totalExpenses),
        },
        {
            title: 'Net Profit',
            value: formatCurrency(dashboardData.totalProfit),
        },
        {
            title: 'Total Invoices',
            value: dashboardData.totalInvoices.toString(),
        },
    ];

    const navigateToInvoiceTemplate = () => {
        setCurrentDashboardView('invoice-template');
    };

    const navigateBackToDashboard = () => {
        setCurrentDashboardView('dashboard');
    };

    const EmptyState = ({ title, description }: { title: string; description: string }) => (
        <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    );

    const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
        <div className="error-state">
            <div className="error-state-icon">⚠️</div>
            <h3>Unable to load data</h3>
            <p>{message}</p>
            <button className="retry-button" onClick={onRetry}>
                Try Again
            </button>
        </div>
    );

    if (currentDashboardView === 'invoice-template') {
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
                    <a
                        href="#"
                        className="nav-item"
                        onClick={(e) => {
                            onNavigate?.('clients')
                        }}>
                        <span className="nav-icon">👥</span>
                        Clients
                    </a>
                    <a
                        href="#"
                        className="nav-item"
                        onClick={(e) => {
                            e.preventDefault();
                            onNavigate?.('invoices');
                        }}
                    >
                        <span className="nav-icon">🧾</span>
                        Invoices
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
                    <a
                        href="#"
                        className="nav-item"
                        onClick={(e) => {
                            onNavigate?.('time-tracking')
                        }}>
                        <span className="nav-icon">🕓</span>
                        Time Tracking
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
                            <h2>Financial Dashboard</h2>
                            <p>Track your business performance and financial health.</p>
                        </div>
                    </section>

                    {/* Stats Grid */}
                    <section className="stats-section">
                        <div className="stats-grid">
                            {stats.map((stat, index) => (
                                <div key={index} className="stat-card">
                                    <div className="stat-header">
                                        <h3>{stat.title}</h3>
                                    </div>
                                    <div className="stat-value">{stat.value}</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Error State */}
                    {error.hasError && (
                        <section className="error-section">
                            <ErrorState
                                message={error.message}
                                onRetry={fetchDashboardData}
                            />
                        </section>
                    )}

                    {/* Charts Section */}
                    {!error.hasError && (
                        <section className="charts-section">
                            <div className="charts-grid">
                                {/* Revenue vs Expenses Bar Chart */}
                                <div className="chart-card">
                                    <div className="card-header">
                                        <div className="chart-title-section">
                                            <h3>Revenue vs Expenses</h3>
                                        </div>
                                    </div>
                                    <div className="chart-container">
                                        <div className="chart-totals">
                                            <div className="total-revenue">
                                                Revenue: {formatCurrency(dashboardData.totalRevenue)}
                                            </div>
                                            <div className="total-expenses">
                                                Expenses: {formatCurrency(dashboardData.totalExpenses)}
                                            </div>
                                        </div>
                                        {loading ? (
                                            <div className="chart-loading">
                                                <div className="loading-spinner"></div>
                                                <span>Loading financial data...</span>
                                            </div>
                                        ) : revenueExpenseData.length === 0 ? (
                                            <EmptyState
                                                title="No Financial Data"
                                                description="Add revenue and expense records to see your financial overview."
                                            />
                                        ) : (
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={revenueExpenseData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                    <XAxis dataKey="month" stroke="#6b7280" />
                                                    <YAxis stroke="#6b7280" />
                                                    <Tooltip
                                                        formatter={(value: any) => [formatCurrency(Number(value)), '']}
                                                        contentStyle={{
                                                            backgroundColor: 'white',
                                                            border: '1px solid #e5e7eb',
                                                            borderRadius: '8px',
                                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                        }}
                                                    />
                                                    <Legend />
                                                    <Bar dataKey="revenue" fill="#5BAF7C" name="Revenue" radius={[4, 4, 0, 0]} />
                                                    <Bar dataKey="expenses" fill="#AF5A5C" name="Expenses" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </div>

                                {/* Total Profit Area Chart */}
                                <div className="chart-card">
                                    <div className="card-header">
                                        <div className="chart-title-section">
                                            <h3>Profit Trend</h3>
                                            <div className="chart-totals">
                                            </div>
                                        </div>
                                    </div>
                                    <div className="chart-container">
                                        <div className="total-profit">
                                            Total Profit: {formatCurrency(dashboardData.totalProfit)}
                                        </div>
                                        {loading ? (
                                            <div className="chart-loading">
                                                <div className="loading-spinner"></div>
                                                <span>Loading profit data...</span>
                                            </div>
                                        ) : profitData.length === 0 ? (
                                            <EmptyState
                                                title="No Profit Data"
                                                description="Profit calculations will appear once you have revenue and expense data."
                                            />
                                        ) : (
                                            <ResponsiveContainer width="100%" height={300}>
                                                <AreaChart data={profitData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                    <XAxis dataKey="month" stroke="#6b7280" />
                                                    <YAxis stroke="#6b7280" />
                                                    <Tooltip
                                                        formatter={(value: any) => [formatCurrency(Number(value)), 'Profit']}
                                                        contentStyle={{
                                                            backgroundColor: 'white',
                                                            border: '1px solid #e5e7eb',
                                                            borderRadius: '8px',
                                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                        }}
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="profit"
                                                        stroke="#5BAF7C"
                                                        fill="#5BAF7C"
                                                        fillOpacity={0.3}
                                                        strokeWidth={3}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </div>

                                {/* Invoice Status Pie Chart */}
                                <div className="chart-card">
                                    <div className="card-header">
                                        <div className="chart-title-section">
                                            <h3>Invoice Status</h3>
                                        </div>
                                    </div>
                                    <div className="chart-container">
                                        <div className="chart-totals">
                                            <div className="total-invoices">
                                                Total: {dashboardData.totalInvoices} invoices
                                            </div>
                                            <div className="invoice-amounts">
                                                Paid: {formatCurrency(dashboardData.paidAmount)} |
                                                Outstanding: {formatCurrency(dashboardData.unpaidAmount)}
                                            </div>
                                        </div>
                                        {loading ? (
                                            <div className="chart-loading">
                                                <div className="loading-spinner"></div>
                                                <span>Loading invoice data...</span>
                                            </div>
                                        ) : invoiceData.length === 0 || dashboardData.totalInvoices === 0 ? (
                                            <EmptyState
                                                title="No Invoices"
                                                description="Create your first invoice to track payment status and amounts."
                                            />
                                        ) : (
                                            <ResponsiveContainer width="100%" height={280}>
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
                                                    <Tooltip
                                                        formatter={(value: any) => [formatCurrency(Number(value)), '']}
                                                        contentStyle={{
                                                            backgroundColor: 'white',
                                                            border: '1px solid #e5e7eb',
                                                            borderRadius: '8px',
                                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                        }}
                                                    />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}
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