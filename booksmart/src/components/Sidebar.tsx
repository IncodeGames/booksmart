import React from 'react';
import * as siteUtils from '../utils/siteUtils';
import { Destinations } from '../lib/routes.ts';
import { useNavigationStore } from '../stores/navigationStore';
import { useNavigate, useLocation } from 'react-router';

const Sidebar = () => {
    const windowSize = siteUtils.useWindowSize();
    const navigate = useNavigate();
    const location = useLocation();

    const {
        sidebarOpen,
        setSidebarOpen
    } = useNavigationStore();

    const isActive = (path: string) => {
        return location.pathname === `/${path}`;
    };

    return (
        <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <div className="logo">
                    <div className="logo-icon"></div>
                    <span className="logo-text">Booksmart</span>
                </div>
                {siteUtils.isMobile(windowSize) && (
                    <button
                        className="sidebar-close"
                        onClick={() => setSidebarOpen(false)}
                    >
                        ×
                    </button>
                )}
            </div>

            <nav className="sidebar-nav">
                <a
                    href="#"
                    className={`nav-item ${isActive('dashboard') ? 'active' : ''}`}
                    onClick={(e) => {
                        e.preventDefault();
                        navigate(Destinations.DASHBOARD);
                        setSidebarOpen(false);
                    }}
                >
                    <span className="nav-icon">📊</span>
                    Dashboard
                </a>
                <a
                    href="#"
                    className={`nav-item ${isActive('clients') ? 'active' : ''}`}
                    onClick={(e) => {
                        e.preventDefault();
                        navigate(Destinations.CLIENTS);
                        setSidebarOpen(false);
                    }}
                >
                    <span className="nav-icon">👥</span>
                    Clients
                </a>
                <a
                    href="#"
                    className={`nav-item ${isActive('invoices') ? 'active' : ''}`}
                    onClick={(e) => {
                        e.preventDefault();
                        navigate(Destinations.INVOICES);
                        setSidebarOpen(false);
                    }}
                >
                    <span className="nav-icon">🧾</span>
                    Invoices
                </a>
                <a
                    href="#"
                    className={`nav-item ${isActive('time-tracking') ? 'active' : ''}`}
                    onClick={(e) => {
                        e.preventDefault();
                        navigate(Destinations.TIME_TRACKING);
                        setSidebarOpen(false);
                    }}
                >
                    <span className="nav-icon">🕓</span>
                    Time Tracking
                </a>
                <a
                    href="#"
                    className={`nav-item ${isActive('expenses') ? 'active' : ''}`}
                    onClick={(e) => {
                        e.preventDefault();
                        navigate(Destinations.EXPENSES);
                        setSidebarOpen(false);
                    }}
                >
                    <span className="nav-icon">💰</span>
                    Expenses
                </a>
                <a
                    href="#"
                    className={`nav-item ${isActive('reports') ? 'active' : ''}`}
                    onClick={(e) => {
                        e.preventDefault();
                        navigate(Destinations.REPORTS);
                        setSidebarOpen(false);
                    }}
                >
                    <span className="nav-icon">📊</span>
                    Reports
                </a>
                <a
                    href="#"
                    className={`nav-item ${isActive('settings') ? 'active' : ''}`}
                    onClick={(e) => {
                        e.preventDefault();
                        navigate(Destinations.SETTINGS);
                        setSidebarOpen(false);
                    }}
                >
                    <span className="nav-icon">⚙️</span>
                    Settings
                </a>
                <a
                    href="#"
                    className={`nav-item ${isActive('billing') ? 'active' : ''}`}
                    onClick={(e) => {
                        e.preventDefault();
                        navigate(Destinations.BILLING);
                        setSidebarOpen(false);
                    }}
                >
                    <span className="nav-icon">💳</span>
                    Billing
                </a>
            </nav>
        </aside>
    );
};

export default Sidebar;