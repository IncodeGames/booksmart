import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import Sidebar from './Sidebar';
import GeneralLedger from './reports/GeneralLedger';
import ExpenseReports from './reports/ExpenseReports';
import './styles/Reports.css';

type ReportType =
  | 'overview'
  | 'general-ledger'
  | 'expense-reports'
  | 'invoice-details'
  | 'revenue-by-client'
  | 'profit-and-loss'
  | 'accounts-aging'
  | 'payments-collected';

interface User {
  email?: string;
}

interface ReportsProps {
  user: User;
  onSignOut: () => void;
}

interface ReportButton {
  id: ReportType;
  title: string;
  description: string;
  icon: string;
  available: boolean;
}

/**
 * Main Reports page that provides navigation to various financial reports
 * Currently implements General Ledger with stubs for other reports
 */
const Reports = ({ user, onSignOut }: ReportsProps) => {
  const [activeReport, setActiveReport] = useState<ReportType>('overview');
  const navigate = useNavigate();

  const reportButtons: ReportButton[] = [
    {
      id: 'general-ledger',
      title: 'General Ledger',
      description: 'Complete record of all financial transactions',
      icon: '📖',
      available: true,
    },
    {
      id: 'expense-reports',
      title: 'Expense Reports',
      description: 'Detailed breakdown of business expenses by category',
      icon: '💸',
      available: true,
    },
    {
      id: 'invoice-details',
      title: 'Invoice Details',
      description: 'Comprehensive invoice tracking and status reports',
      icon: '🧾',
      available: false,
    },
    {
      id: 'revenue-by-client',
      title: 'Revenue by Client',
      description: 'Income analysis organized by client relationships',
      icon: '👥',
      available: false,
    },
    {
      id: 'profit-and-loss',
      title: 'Profit & Loss',
      description: 'Income statement showing profitability over time',
      icon: '📊',
      available: false,
    },
    {
      id: 'accounts-aging',
      title: 'Accounts Aging',
      description: 'Outstanding invoice aging and collection reports',
      icon: '⏰',
      available: false,
    },
    {
      id: 'payments-collected',
      title: 'Payments Collected',
      description: 'Track received payments and cash flow',
      icon: '💰',
      available: false,
    },
  ];

  const handleReportSelect = (reportId: ReportType) => {
    if (reportId === 'general-ledger' || reportId === 'expense-reports') {
      setActiveReport(reportId);
    } else {
      // Show coming soon message for other reports
      alert(`${reportButtons.find(r => r.id === reportId)?.title} coming soon!`);
    }
  };

  const handleBackToOverview = () => {
    setActiveReport('overview');
  };

  // Render specific report component
  const renderReportContent = () => {
    switch (activeReport) {
      case 'general-ledger':
        return <GeneralLedger onBack={handleBackToOverview} />;
      case 'expense-reports':
        return <ExpenseReports onBack={handleBackToOverview} />;
      case 'overview':
      default:
        return (
          <div className="reports-overview">
            <div className="reports-header">
              <h1 className="page-title">Financial Reports</h1>
              <p className="page-subtitle">
                Generate detailed reports to analyze your business performance
              </p>
            </div>

            <div className="reports-grid">
              {reportButtons.map((report) => (
                <button
                  key={report.id}
                  className={`report-card ${!report.available ? 'coming-soon' : ''}`}
                  onClick={() => handleReportSelect(report.id)}
                  disabled={!report.available}
                >
                  <div className="report-card-header">
                    <span className="report-icon">{report.icon}</span>
                    <h3 className="report-title">{report.title}</h3>
                    {!report.available && (
                      <span className="coming-soon-badge">Coming Soon</span>
                    )}
                  </div>
                  <p className="report-description">{report.description}</p>
                  <div className="report-card-footer">
                    {report.available ? (
                      <span className="view-report-text">View Report →</span>
                    ) : (
                      <span className="coming-soon-text">In Development</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Quick Stats Section */}
            <div className="reports-quick-stats">
              <div className="section-header">
                <h2>Quick Overview</h2>
                <p>Key metrics at a glance</p>
              </div>
              <div className="quick-stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">💰</div>
                  <div className="stat-content">
                    <div className="stat-label">Total Revenue</div>
                    <div className="stat-value">-</div>
                    <div className="stat-note">This month</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">💸</div>
                  <div className="stat-content">
                    <div className="stat-label">Total Expenses</div>
                    <div className="stat-value">-</div>
                    <div className="stat-note">This month</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <div className="stat-label">Net Profit</div>
                    <div className="stat-value">-</div>
                    <div className="stat-note">This month</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🧾</div>
                  <div className="stat-content">
                    <div className="stat-label">Outstanding</div>
                    <div className="stat-value">-</div>
                    <div className="stat-note">Unpaid invoices</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <div className="reports-page">
          {renderReportContent()}
        </div>
      </div>
    </div>
  );
};

export default Reports;
