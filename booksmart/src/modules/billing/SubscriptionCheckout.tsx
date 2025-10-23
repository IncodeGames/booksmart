import React, { useState, useEffect } from 'react';
import {
    useStripe,
    useElements,
    PaymentElement,
    AddressElement
} from '@stripe/react-stripe-js';
import { supabase } from "../../lib/supabase";

interface Plan {
    id: string;
    name: string;
    description: string;
    price: number;
    interval: string;
    features: string[];
}

interface SubscriptionCheckoutProps {
    plan: Plan;
    onSuccess: (subscriptionData: any) => void;
    onCancel: () => void;
    loading: boolean;
}

const SubscriptionCheckout: React.FC<SubscriptionCheckoutProps> = ({
    plan,
    onSuccess,
    onCancel,
    loading: externalLoading
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (stripe && elements) {
            setIsReady(true);
        }
    }, [stripe, elements]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements || !isReady) {
            return;
        }

        setIsProcessing(true);
        setErrorMessage('');

        try {
            // Confirm the subscription
            const { error: submitError } = await elements.submit();
            if (submitError) {
                setErrorMessage(submitError.message || 'An error occurred');
                setIsProcessing(false);
                return;
            }

            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                redirect: 'if_required',
                confirmParams: {
                    return_url: `${window.location.origin}/billing?success=true`,
                },
            });

            if (error) {
                setErrorMessage(error.message || 'Payment failed');
                setIsProcessing(false);
            } else {
                // Payment succeeded
                console.log('Subscription confirmed:', paymentIntent.status === "succeeded");

                // Update subscription status in your database
                const { data: user } = await supabase.auth.getUser();
                if (user.user) {
                    await updateSubscriptionInDatabase(user.user.id, plan.id, paymentIntent.status);
                }

                onSuccess({
                    id: plan.id,
                    name: plan.name,
                    subscriptionId: subscription?.id,
                    status: 'active'
                });
            }
        } catch (err) {
            console.error('Subscription error:', err);
            setErrorMessage('An unexpected error occurred. Please try again.');
            setIsProcessing(false);
        }
    };

    const updateSubscriptionInDatabase = async (userId: string, planId: string, subscription: any) => {
        try {
            const { error } = await supabase.functions.invoke('update-subscription-status', {
                body: {
                    userId,
                    planId,
                    subscriptionId: subscription?.id,
                    status: subscription?.status || 'active'
                }
            });

            if (error) {
                console.error('Error updating subscription in database:', error);
            }
        } catch (err) {
            console.error('Database update error:', err);
        }
    };

    if (!isReady) {
        return (
            <div className="checkout-loading">
                <div className="loading-spinner"></div>
                <p>Loading payment form...</p>
            </div>
        );
    }

    return (
        <div className="subscription-checkout">
            <div className="plan-summary">
                <h4>{plan.name} Plan</h4>
                <p className="plan-description">{plan.description}</p>
                <div className="price-summary">
                    <span className="price">
                        ${plan.price}
                        <span className="interval">/{plan.interval}</span>
                    </span>
                </div>

                <div className="features-summary">
                    <h5>What's included:</h5>
                    <ul>
                        {plan.features.slice(0, 3).map((feature, index) => (
                            <li key={index}>{feature}</li>
                        ))}
                        {plan.features.length > 3 && (
                            <li>+ {plan.features.length - 3} more features</li>
                        )}
                    </ul>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="checkout-form">
                <div className="payment-section">
                    <h4>Payment Information</h4>
                    <PaymentElement
                        options={{
                            layout: 'tabs'
                        }}
                    />
                </div>

                <div className="address-section">
                    <h4>Billing Address</h4>
                    <AddressElement
                        options={{
                            mode: 'billing',
                            allowedCountries: ['US', 'CA', 'GB', 'AU']
                        }}
                    />
                </div>

                {errorMessage && (
                    <div className="error-message">
                        <span className="error-icon">⚠️</span>
                        {errorMessage}
                    </div>
                )}

                <div className="checkout-actions">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="btn-secondary"
                        disabled={isProcessing || externalLoading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={!stripe || !elements || isProcessing || externalLoading}
                    >
                        {isProcessing ? (
                            <>
                                <span className="processing-spinner"></span>
                                Processing...
                            </>
                        ) : (
                            `Subscribe to ${plan.name}`
                        )}
                    </button>
                </div>

                <div className="checkout-footer">
                    <p className="terms-text">
                        By subscribing, you agree to our{' '}
                        <a href="/terms" target="_blank" rel="noopener noreferrer">
                            Terms of Service
                        </a>{' '}
                        and understand that your subscription will automatically renew.
                    </p>
                </div>
            </form>
        </div>
    );
};

export default SubscriptionCheckout;