import React, { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
import useSubscriptionStore from './stores/subscriptionStore';
import { supabase } from '../../lib/supabase';
import PlanCard from './components/PlanCard';
import PaymentDetails from './components/PaymentDetails';
import BillingHistory from './components/BillingHistory';
import './BillingPage.css';

const Billing = () => {
    // const navigate = useNavigate();
    const { currentPlan, setCurrentPlan, fetchSubscriptionData, isLoading } = useSubscriptionStore();
    const [yearlyBilling, setYearlyBilling] = useState(false);
    const [user, setUser] = useState<any>(null);

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
    }, [/*navigate,*/ fetchSubscriptionData]);

    const handlePlanChange = async (planId: string) => {
        // This would typically redirect to Stripe Checkout or show a modal
        console.log(`Upgrading to plan: ${planId}`);
        // Implementation will depend on your Stripe integration
    };

    const handleBillingCycleChange = (checked: boolean) => {
        setYearlyBilling(checked);
    };

    if (isLoading) {
        return (
            <div className="billing-loading-container">
                <div className="loading-spinner"></div>
                <span className="loading-text">Loading subscription information...</span>
            </div>
        );
    }

    const plans = [
        {
            id: 'free',
            name: 'Free',
            description: 'Basic bookkeeping features for individuals',
            price: yearlyBilling ? 0 : 0,
            interval: yearlyBilling ? 'year' : 'month',
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
        </div>
    );
};

export default Billing;