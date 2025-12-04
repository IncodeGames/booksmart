import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { supabase } from '../../../lib/supabase';
import { Client, ClientInvoice } from '../types';
import {
    calculateInvoiceChartData,
    calculateTotalAmount,
    formatCurrency,
    formatDate,
    getStatusClass,
} from '../utils/clientDetailHelpers';

interface ClientDetailPageProps {
    client: Client;
    onBack: () => void;
}

const ClientDetailPage: React.FC<ClientDetailPageProps> = ({ client, onBack }) => {
    const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchClientInvoices = useCallback(async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            // Fetch invoices for this client
            const { data: invoicesData, error: invoicesError } = await supabase
                .from('invoices')
                .select('id, amount, created_at, invoice_status, client_id, due_date, issued_date')
                .eq('client_id', client.id)
                .order('created_at', { ascending: false });

            if (invoicesError) throw invoicesError;

            setInvoices(invoicesData || []);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load client invoices';
            console.error('Error fetching client invoices:', err);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [client.id]);

    useEffect(() => {
        fetchClientInvoices();
    }, [fetchClientInvoices]);

    const invoiceChartData = useMemo(() => calculateInvoiceChartData(invoices), [invoices]);
    const totalInvoiceAmount = useMemo(() => calculateTotalAmount(invoices), [invoices]);

    const renderCustomLabel = ({
        cx,
        cy,
        midAngle,
        innerRadius,
        outerRadius,
        percent,
    }: {
        cx: number;
        cy: number;
        midAngle: number;
        innerRadius: number;
        outerRadius: number;
        percent: number;
    }): React.ReactElement | null => {
        if (percent < 0.05) return null;
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text
                x={x}
                y={y}
                fill="#ffffff"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={12}
                fontWeight={600}
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="client-detail-page">
            <div className="detail-header">
                <button className="back-btn" onClick={onBack}>
                    ← Back to Clients
                </button>
                <h1>Client Details</h1>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                    <button
                        className="dismiss-error-btn"
                        onClick={() => setError(null)}
                        aria-label="Dismiss error"
                    >
                        ×
                    </button>
                </div>
            )}

            <div className="detail-content">
                {/* Client Info Card */}
                <div className="detail-sidebar">
                    <div className="client-info-card">
                        <div className="client-avatar-large">
                            {client.name.charAt(0).toUpperCase()}
                        </div>
                        <h2>{client.name}</h2>
                        {client.company && <p className="client-company">{client.company}</p>}

                        <div className="client-contact-info">
                            <div className="contact-item">
                                <span className="contact-label">Email</span>
                                <span className="contact-value">{client.email}</span>
                            </div>
                            {client.phone && (
                                <div className="contact-item">
                                    <span className="contact-label">Phone</span>
                                    <span className="contact-value">{client.phone}</span>
                                </div>
                            )}
                            <div className="contact-item">
                                <span className="contact-label">Client Since</span>
                                <span className="contact-value">{formatDate(client.created_at)}</span>
                            </div>
                        </div>

                        <div className="client-stats">
                            <div className="stat-item">
                                <span className="stat-value outstanding">
                                    {client.outstanding_invoice_count}
                                </span>
                                <span className="stat-label">Outstanding</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value paid">{client.paid_invoice_count}</span>
                                <span className="stat-label">Paid</span>
                            </div>
                        </div>

                        <div className="client-balance">
                            <span className="balance-label">Outstanding Balance</span>
                            <span
                                className={`balance-value ${
                                    client.outstanding_amount > 0 ? 'has-balance' : ''
                                }`}
                            >
                                {formatCurrency(client.outstanding_amount)}
                            </span>
                        </div>
                    </div>

                    {/* Invoice Chart */}
                    {invoiceChartData.length > 0 && (
                        <div className="chart-card">
                            <h3>Invoice Breakdown</h3>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={invoiceChartData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={renderCustomLabel}
                                            outerRadius={80}
                                            dataKey="value"
                                        >
                                            {invoiceChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number) => formatCurrency(value)}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="chart-total">
                                <span>Total Invoiced:</span>
                                <strong>{formatCurrency(totalInvoiceAmount)}</strong>
                            </div>
                        </div>
                    )}
                </div>

                {/* Invoices List */}
                <div className="detail-main">
                    <div className="section-header">
                        <h3>Invoice History</h3>
                        <span className="invoice-count">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</span>
                    </div>

                    {loading ? (
                        <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>Loading invoices...</p>
                        </div>
                    ) : (
                        <div className="tab-content">
                            <div className="invoices-list">
                                {invoices.length === 0 ? (
                                    <div className="empty-list">
                                        <p>No invoices found for this client.</p>
                                    </div>
                                ) : (
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Invoice #</th>
                                                <th>Issue Date</th>
                                                <th>Due Date</th>
                                                <th>Amount</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {invoices.map((invoice) => (
                                                <tr key={invoice.id}>
                                                    <td>#{invoice.id}</td>
                                                    <td>{formatDate(invoice.issued_date)}</td>
                                                    <td>{formatDate(invoice.due_date)}</td>
                                                    <td className="amount-cell">
                                                        {formatCurrency(invoice.amount)}
                                                    </td>
                                                    <td>
                                                        <span
                                                            className={`status-badge ${getStatusClass(
                                                                invoice.invoice_status
                                                            )}`}
                                                        >
                                                            {invoice.invoice_status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td colSpan={3}>
                                                    <strong>Total</strong>
                                                </td>
                                                <td className="amount-cell">
                                                    <strong>
                                                        {formatCurrency(totalInvoiceAmount)}
                                                    </strong>
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientDetailPage;
