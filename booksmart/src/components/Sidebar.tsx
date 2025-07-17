import * as siteUtils from '../utils/siteUtils';
import { useNavigationStore } from '../stores/navigationStore';

interface SidebarProps {
    onNavigate?: (string) => void;
}

const Sidebar = ({
    onNavigate
}: SidebarProps) => {
    const windowSize = siteUtils.useWindowSize();

    const {
        sidebarOpen,
        setCurrentDashboardView,
        setSidebarOpen
    } = useNavigationStore();

    return (
        < aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
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
                        setCurrentDashboardView('invoice-template');;
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
                <a href="#" className="nav-item" onClick={(e) => {
                    onNavigate?.('settings')
                }}>
                    <span className="nav-icon">⚙️</span>
                    Settings
                </a>
                <a href="#" className="nav-item" onClick={(e) => {
                    onNavigate?.('billing')
                }}>
                    <span className="nav-icon">💳</span>
                    Billing
                </a>
            </nav>
        </aside >
    );
};

export default Sidebar;