import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface BillingHistoryProps {
    user: any;
}

const BillingHistory = ({ user }: BillingHistoryProps) => {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            // fetchInvoices();
        }
    }, [user]);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (data) {
                setInvoices(data);
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadInvoice = (invoiceId: string) => {
        console.log(`Downloading invoice: ${invoiceId}`);
    };

    // Sample data for demonstration
    const sampleInvoices = [
        {
            id: 'inv_sample1',
            created_at: new Date().toISOString(),
            description: 'Pro Plan Subscription',
            amount: 999,
            status: 'paid',
        },
        {
            id: 'inv_sample2',
            created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Pro Plan Subscription',
            amount: 999,
            status: 'paid',
        },
    ];

    const displayInvoices = invoices.length > 0 ? invoices : sampleInvoices;

    return (
        <div className="billing-history-section">
            <div className="section-header">
                <h2>Billing History</h2>
            </div>

            <div className="invoices-table">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Invoice</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="loading-cell">
                                    <div className="loading-spinner small"></div>
                                </td>
                            </tr>
                        ) : (
                            displayInvoices.map((invoice) => (
                                <tr key={invoice.id}>
                                    <td>{new Date(invoice.created_at).toLocaleDateString()}</td>
                                    <td>{invoice.description}</td>
                                    <td>${(invoice.amount / 100).toFixed(2)}</td>
                                    <td>
                                        <span className={`status-badge ${invoice.status}`}>
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="btn-text"
                                            onClick={() => handleDownloadInvoice(invoice.id)}
                                        >
                                            <svg className="download-icon" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                            PDF
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BillingHistory;