import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Divider, Form, Input, Modal } from 'antd';
import { CreditCardOutlined, EditOutlined } from '@ant-design/icons';
import { supabase } from '../../../lib/supabase';

const { Title, Text } = Typography;

interface PaymentDetailsProps {
    user: any;
}

const PaymentDetails = ({ user }: PaymentDetailsProps) => {
    const [paymentMethod, setPaymentMethod] = useState<any>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        if (user) {
            // fetchPaymentMethod();
        }
    }, [user]);

    const fetchPaymentMethod = async () => {
        try {
            // In a real app, you would fetch this from your Stripe integration
            // This is a placeholder for demonstration
            const { data, error } = await supabase
                .from('payment_methods')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (data) {
                setPaymentMethod(data);
            }
        } catch (error) {
            console.error('Error fetching payment method:', error);
        }
    };

    const showModal = () => {
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const handleUpdatePaymentMethod = (values: any) => {
        // This would typically integrate with Stripe Elements or Stripe.js
        console.log('Updating payment method:', values);
        setIsModalVisible(false);

        // Mock updated payment method
        setPaymentMethod({
            id: 'pm_mock',
            card_brand: 'Visa',
            last4: values.cardNumber.slice(-4),
            exp_month: values.expiry.split('/')[0],
            exp_year: '20' + values.expiry.split('/')[1],
        });
    };

    return (
        <div className="payment-details-section">
            <Title level={4}>Payment Method</Title>

            <Card className="payment-method-card">
                {paymentMethod ? (
                    <div className="payment-method-info">
                        <div className="card-info">
                            <CreditCardOutlined className="card-icon" />
                            <div>
                                <Text strong>{paymentMethod.card_brand}</Text>
                                <Text> •••• {paymentMethod.last4}</Text>
                                <div>
                                    <Text type="secondary">
                                        Expires {paymentMethod.exp_month}/{paymentMethod.exp_year}
                                    </Text>
                                </div>
                            </div>
                        </div>
                        <Button
                            icon={<EditOutlined />}
                            type="link"
                            onClick={showModal}
                        >
                            Update
                        </Button>
                    </div>
                ) : (
                    <div className="no-payment-method">
                        <Text>No payment method on file</Text>
                        <Button type="primary" onClick={showModal}>
                            Add Payment Method
                        </Button>
                    </div>
                )}
            </Card>

            <Modal
                title="Update Payment Method"
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleUpdatePaymentMethod}
                    initialValues={{
                        cardName: '',
                        cardNumber: '',
                        expiry: '',
                        cvc: '',
                    }}
                >
                    <Form.Item
                        name="cardName"
                        label="Cardholder Name"
                        rules={[{ required: true, message: 'Please enter cardholder name' }]}
                    >
                        <Input placeholder="John Doe" />
                    </Form.Item>

                    <Form.Item
                        name="cardNumber"
                        label="Card Number"
                        rules={[{ required: true, message: 'Please enter card number' }]}
                    >
                        <Input placeholder="1234 5678 9012 3456" />
                    </Form.Item>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <Form.Item
                            name="expiry"
                            label="Expiry Date"
                            rules={[{ required: true, message: 'Please enter expiry date' }]}
                            style={{ flex: 1 }}
                        >
                            <Input placeholder="MM/YY" />
                        </Form.Item>

                        <Form.Item
                            name="cvc"
                            label="CVC"
                            rules={[{ required: true, message: 'Please enter CVC' }]}
                            style={{ flex: 1 }}
                        >
                            <Input placeholder="123" />
                        </Form.Item>
                    </div>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" block>
                            Save Payment Method
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default PaymentDetails;