import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import useSubscriptionStore from './stores/subscriptionStore';
import { supabase } from '../../lib/supabase';
import PlanCard from './components/PlanCard';
import PaymentDetails from './components/PaymentDetails';
import BillingHistory from './components/BillingHistory';
import SubscriptionCheckout from './SubscriptionCheckout';
import './BillingPage.css';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_TEST_KEY);

interface Plan {
    id: string;
    name: string;
    description: string;
    price: number;
    interval: string;
    features: string[];
    priceId?: string; // Stripe price ID
}

const Billing = () => {
    const { currentPlan, setCurrentPlan, fetchSubscriptionData, isLoading } = useSubscriptionStore();
    const [yearlyBilling, setYearlyBilling] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [showCheckout, setShowCheckout] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [clientSecret, setClientSecret] = useState<string>('');
    const [checkoutLoading, setCheckoutLoading] = useState(false);

    useEffect(() => {
        const getUser = async () => {
            const { data } = await supabase.auth.getUser();
            if (data?.user) {
                setUser(data.user);
                // fetchSubscriptionData(data.user.id);
            } else {
                // navigate('/login');
            }
        };

        getUser();
    }, [fetchSubscriptionData]);

    const createSubscriptionIntent = async (planId: string, priceId: string) => {
        try {
            setCheckoutLoading(true);

            const { data, error } = await supabase.functions.invoke('create-subscription-intent', {
                body: {
                    priceId,
                    userId: user.id,
                    currentSubscriptionId: currentPlan?.id
                }
            });

            if (error) throw error;

            return data.clientSecret;
        } catch (error) {
            console.error('Error creating subscription intent:', error);
            throw error;
        } finally {
            setCheckoutLoading(false);
        }
    };

    const handlePlanChange = async (planId: string) => {
        const plan = plans.find(p => p.id === planId);
        if (!plan || !user) return;

        // If selecting free plan, handle subscription cancellation
        if (planId === 'free') {
            // Handle downgrade to free plan
            console.log('Downgrading to free plan');
            // You might want to show a confirmation modal here
            return;
        }

        try {
            setSelectedPlan(plan);

            // Get the appropriate price ID based on billing cycle
            const priceId = plan.priceId;
            if (!priceId) {
                throw new Error('Price ID not found for selected plan');
            }

            // Create subscription intent
            const secret = await createSubscriptionIntent(planId, priceId);
            setClientSecret(secret);
            setShowCheckout(true);
        } catch (error) {
            console.error('Error initiating subscription change:', error);
            // Show error message to user
        }
    };

    const handleBillingCycleChange = (checked: boolean) => {
        setYearlyBilling(checked);
    };

    const handleCheckoutClose = () => {
        setShowCheckout(false);
        setSelectedPlan(null);
        setClientSecret('');
    };

    const handleSubscriptionSuccess = (subscriptionData: any) => {
        // Update the current plan in the store
        setCurrentPlan(subscriptionData);
        setShowCheckout(false);
        setSelectedPlan(null);
        setClientSecret('');

        // Optionally show success message
        console.log('Subscription updated successfully!');
    };

    if (isLoading) {
        return (
            <div className="billing-loading-container">
                <div className="loading-spinner"></div>
                <span className="loading-text">Loading subscription information...</span>
            </div>
        );
    }

    const plans: Plan[] = [
        {
            id: 'free',
            name: 'Free',
            description: 'Basic bookkeeping features for individuals',
            price: 0,
            interval: 'month',
            features: [
                'Up to 50 transactions per month',
                'Basic reporting',
                'Single user access',
            ],
        },
        {
            id: 'pro',
            name: 'Pro',
            description: 'Advanced features for small businesses',
            price: yearlyBilling ? 108 : 9.99,
            interval: yearlyBilling ? 'year' : 'month',
            priceId: "REPLACE_THIS_ID",
            features: [
                'Unlimited transactions',
                'Advanced reporting',
                'Up to 3 team members',
                'Invoice generation',
                'Bank account sync',
            ],
        },
        {
            id: 'expert',
            name: 'Expert',
            description: 'Complete solution for growing businesses',
            price: yearlyBilling ? 288 : 29.99,
            interval: yearlyBilling ? 'year' : 'month',
            priceId: "REPLACE_THIS_ID",
            features: [
                'Everything in Pro',
                'Unlimited team members',
                'Tax preparation assistance',
                'Custom financial reports',
                'Dedicated support',
                'API access',
            ],
        },
    ];

    return (
        <div className="billing-page">
            <div className="billing-header">
                <h1 className="page-title">Subscription & Billing</h1>
                <p className="page-subtitle">Manage your subscription and payment methods</p>
            </div>

            <div className="current-plan-section">
                <div className="section-header">
                    <h2>Current Plan</h2>
                </div>
                <div className="current-plan-card">
                    <div className="current-plan-info">
                        <div className="plan-status">
                            <h3>{currentPlan?.name || 'Free'}</h3>
                            {currentPlan?.id !== 'free' ? (
                                <span className="status-badge active">Active</span>
                            ) : (
                                <span className="status-badge">Free tier</span>
                            )}
                        </div>
                        {currentPlan?.id !== 'free' && (
                            <button className="btn-secondary">
                                Manage Subscription
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="plans-section">
                <div className="billing-cycle-toggle">
                    <span className={!yearlyBilling ? 'active' : ''}>Monthly</span>
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={yearlyBilling}
                            onChange={(e) => handleBillingCycleChange(e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                    <span className={yearlyBilling ? 'active' : ''}>Yearly</span>
                    {yearlyBilling && <span className="save-badge">Save up to 25%</span>}
                </div>

                <div className="plans-grid">
                    {plans.map((plan) => (
                        <PlanCard
                            key={plan.id}
                            plan={plan}
                            isCurrentPlan={currentPlan?.id === plan.id}
                            onSelect={handlePlanChange}
                        />
                    ))}
                </div>
            </div>

            <div className="payment-billing-section">
                <PaymentDetails user={user} />
                <BillingHistory user={user} />
            </div>

            {/* Stripe Checkout Modal */}
            {showCheckout && clientSecret && selectedPlan && (
                <div className="checkout-overlay">
                    <div className="checkout-modal">
                        <div className="checkout-header">
                            <h3>Subscribe to {selectedPlan.name}</h3>
                            <button
                                className="close-button"
                                onClick={handleCheckoutClose}
                                disabled={checkoutLoading}
                            >
                                ×
                            </button>
                        </div>

                        <Elements
                            stripe={stripePromise}
                            options={{
                                clientSecret,
                                appearance: {
                                    theme: 'stripe',
                                    variables: {
                                        colorPrimary: '#0570de',
                                        colorBackground: '#ffffff',
                                        colorText: '#30313d',
                                        colorDanger: '#df1b41',
                                        fontFamily: 'Inter, system-ui, sans-serif',
                                        spacingUnit: '4px',
                                        borderRadius: '8px',
                                    }
                                }
                            }}
                        >
                            <SubscriptionCheckout
                                plan={selectedPlan}
                                onSuccess={handleSubscriptionSuccess}
                                onCancel={handleCheckoutClose}
                                loading={checkoutLoading}
                            />
                        </Elements>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Billing;