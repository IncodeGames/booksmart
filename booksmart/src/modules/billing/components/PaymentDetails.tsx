import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface PaymentDetailsProps {
    user: any;
}

const PaymentDetails = ({ user }: PaymentDetailsProps) => {
    const [paymentMethod, setPaymentMethod] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (user) {
            // fetchPaymentMethod();
        }
    }, [user]);

    const fetchPaymentMethod = async () => {
        try {
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

    const handleUpdatePaymentMethod = (e: React.FormEvent) => {
        e.preventDefault();
        // Stripe integration would go here
        setIsModalOpen(false);
    };

    return (
        <div className="payment-details-section">
            <div className="section-header">
                <h2>Payment Method</h2>
            </div>

            <div className="payment-method-card">
                {paymentMethod ? (
                    <div className="payment-method-info">
                        <div className="card-details">
                            <div className="card-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                                    <line x1="1" y1="10" x2="23" y2="10"></line>
                                </svg>
                            </div>
                            <div className="card-info">
                                <span className="card-brand">{paymentMethod.card_brand}</span>
                                <span className="card-number">•••• {paymentMethod.last4}</span>
                                <span className="card-expiry">
                                    Expires {paymentMethod.exp_month}/{paymentMethod.exp_year}
                                </span>
                            </div>
                        </div>
                        <button
                            className="btn-text"
                            onClick={() => setIsModalOpen(true)}
                        >
                            Update
                        </button>
                    </div>
                ) : (
                    <div className="no-payment-method">
                        <p>No payment method on file</p>
                        <button
                            className="btn-primary"
                            onClick={() => setIsModalOpen(true)}
                        >
                            Add Payment Method
                        </button>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Update Payment Method</h3>
                            <button
                                className="modal-close"
                                onClick={() => setIsModalOpen(false)}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleUpdatePaymentMethod} className="payment-form">
                            <div className="form-group">
                                <label>Cardholder Name</label>
                                <input type="text" placeholder="John Doe" required />
                            </div>

                            <div className="form-group">
                                <label>Card Number</label>
                                <input type="text" placeholder="1234 5678 9012 3456" required />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Expiry Date</label>
                                    <input type="text" placeholder="MM/YY" required />
                                </div>

                                <div className="form-group">
                                    <label>CVC</label>
                                    <input type="text" placeholder="123" required />
                                </div>
                            </div>

                            <button type="submit" className="btn-primary full-width">
                                Save Payment Method
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentDetails;