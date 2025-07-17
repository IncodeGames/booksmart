import React, { useState, useEffect } from 'react';
import { Typography, Table, Tag, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { supabase } from '../../../lib/supabase';

const { Title, Text } = Typography;

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
            // In a real app, you would fetch this from your Stripe integration
            // This is a placeholder for demonstration
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
        // This would typically generate or fetch a PDF invoice from Stripe
        console.log(`Downloading invoice: ${invoiceId}`);
    };

    const columns = [
        {
            title: 'Date',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (text: string) => new Date(text).toLocaleDateString(),
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: number) => `$${(amount / 100).toFixed(2)}`,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={status === 'paid' ? 'green' : 'volcano'}>
                    {status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Invoice',
            key: 'invoice',
            render: (_: any, record: any) => (
                <Button
                    type="link"
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownloadInvoice(record.id)}
                >
                    PDF
                </Button>
            ),
        },
    ];

    // Provide sample data if no invoices exist
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
            <Title level={4}>Billing History</Title>

            <Table
                columns={columns}
                dataSource={displayInvoices}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 5 }}
            />
        </div>
    );
};

export default BillingHistory;