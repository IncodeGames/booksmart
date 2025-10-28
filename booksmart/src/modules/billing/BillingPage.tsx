import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import useSubscriptionStore from './stores/subscriptionStore';
import { supabase } from '../../lib/supabase';
import Sidebar from '../../components/Sidebar';
import TrialBanner from './components/TrialBanner';
import SubscriptionCheckout from './SubscriptionCheckout';
import { StripeService } from '../../services/stripeService';
import { STRIPE_PRICE_IDS, PLAN_FEATURES, type PlanType } from './config/plans';
import './BillingPage.css';
import './BillingPageExtensions.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Plan display data (gets pricing from Stripe)
const PLAN_DISPLAY_INFO = {
    free: {
        name: 'Free',
        description: 'Perfect for freelancers getting started',
        price: { monthly: 0, yearly: 0 }
    },
    basic: {
        name: 'Basic',
        description: 'Great for small businesses',
        price: { monthly: 15, yearly: 144 } // Will be fetched from Stripe
    },
    pro: {
        name: 'Pro',
        description: 'Complete solution for growing businesses',
        price: { monthly: 39, yearly: 372 } // Will be fetched from Stripe
    }
};

const Billing = () => {
    const {
        isActive,
        planType,
        isTrialing,
        trialDaysRemaining,
        hasTrialExpired,
        stripeCustomerId,
        currentPeriodEnd,
        fetchSubscriptionData,
        startFreeTrial,
        createSubscription,
        cancelSubscription,
        isLoading,
        error,
        clearError
    } = useSubscriptionStore();

    const [user, setUser] = useState<any>(null);
    const [yearlyBilling, setYearlyBilling] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<{ type: PlanType; priceId: string } | null>(null);
    const [clientSecret, setClientSecret] = useState<string>('');

    useEffect(() => {
        const getUser = async () => {
            const { data } = await supabase.auth.getUser();
            if (data?.user) {
                setUser(data.user);
                fetchSubscriptionData(data.user.id);
            }
        };
        getUser();
    }, [fetchSubscriptionData]);

    const handlePlanSelect = async (targetPlanType: PlanType) => {
        if (!user) return;

        // Handle free plan (cancellation)
        if (targetPlanType === 'free') {
            const confirm = window.confirm('Are you sure you want to cancel your subscription?');
            if (confirm) {
                await cancelSubscription();
            }
            return;
        }

        const priceId = yearlyBilling
            ? STRIPE_PRICE_IDS[targetPlanType]?.yearly
            : STRIPE_PRICE_IDS[targetPlanType]?.monthly;

        if (!priceId) {
            console.error('Price ID not found for plan:', targetPlanType);
            return;
        }

        // Check if user can start free trial
        if (!isActive && !hasTrialExpired && targetPlanType !== 'free') {
            const shouldTrial = window.confirm(`Start your 30-day free trial of ${PLAN_DISPLAY_INFO[targetPlanType].name}?`);
            if (shouldTrial) {
                await startFreeTrial(user.id, priceId);
                return;
            }
        }

        // Handle paid subscription
        try {
            const result = await createSubscription(user.id, priceId);
            setSelectedPlan({ type: targetPlanType, priceId });
            setClientSecret(result.clientSecret);
            setShowCheckout(true);
        } catch (error) {
            console.error('Error creating subscription:', error);
        }
    };

    const handleManageSubscription = async () => {
        if (!stripeCustomerId) return;

        try {
            const { url } = await StripeService.createBillingPortalSession(
                stripeCustomerId,
                window.location.href
            );
            window.location.href = url;
        } catch (error) {
            console.error('Error opening billing portal:', error);
        }
    };

    const handleCheckoutSuccess = () => {
        setShowCheckout(false);
        setSelectedPlan(null);
        setClientSecret('');
        if (user) {
            fetchSubscriptionData(user.id);
        }
    };

    const scrollToPlans = () => {
        document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    if (isLoading) {
        return (
            <div className="app-container">
                <Sidebar />
                <div className="main-content">
                    <div className="billing-loading-container">
                        <div className="loading-spinner"></div>
                        <span className="loading-text">Loading subscription...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="app-container">
            <Sidebar />
            <div className="main-content">
                <div className="billing-page">
                    <div className="billing-header">
                        <h1 className="page-title">Subscription & Billing</h1>
                        <p className="page-subtitle">Manage your subscription and access premium features</p>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="error-banner">
                            <div className="error-content">
                                <span className="error-text">{error}</span>
                                <button className="error-close" onClick={clearError}>×</button>
                            </div>
                        </div>
                    )}

                    {/* Trial Banner */}
                    {(isTrialing || hasTrialExpired) && (
                        <TrialBanner
                            trialStatus={{
                                isTrialing,
                                trialEndDate: undefined,
                                daysRemaining: trialDaysRemaining,
                                hasTrialExpired,
                            }}
                            onUpgrade={scrollToPlans}
                        />
                    )}

                    {/* Current Subscription Status */}
                    <div className="current-plan-section">
                        <div className="section-header">
                            <h2>Current Plan</h2>
                        </div>
                        <div className="current-plan-card">
                            <div className="current-plan-info">
                                <div className="plan-status">
                                    <h3>{PLAN_DISPLAY_INFO[planType].name}</h3>
                                    {isTrialing && (
                                        <span className="status-badge trial">Free Trial - {trialDaysRemaining} days left</span>
                                    )}
                                    {isActive && !isTrialing && (
                                        <span className="status-badge active">Active</span>
                                    )}
                                    {!isActive && planType === 'free' && (
                                        <span className="status-badge">Free Plan</span>
                                    )}
                                </div>

                                {currentPeriodEnd && (
                                    <div className="subscription-details">
                                        <p className="renewal-date">
                                            Next renewal: {currentPeriodEnd.toLocaleDateString()}
                                        </p>
                                    </div>
                                )}

                                {isActive && stripeCustomerId && (
                                    <button className="btn-secondary" onClick={handleManageSubscription}>
                                        Manage Subscription
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Pricing Plans */}
                    <div className="plans-section" id="pricing-section">
                        <div className="section-header">
                            <h2>Choose Your Plan</h2>
                            <p>Upgrade or change your subscription at any time</p>
                        </div>

                        {/* Billing Toggle */}
                        <div className="billing-cycle-toggle">
                            <span className={!yearlyBilling ? 'active' : ''}>Monthly</span>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={yearlyBilling}
                                    onChange={(e) => setYearlyBilling(e.target.checked)}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                            <span className={yearlyBilling ? 'active' : ''}>Yearly</span>
                            {yearlyBilling && <span className="save-badge">Save 20%</span>}
                        </div>

                        {/* Plans Grid */}
                        <div className="plans-grid">
                            {(Object.keys(PLAN_DISPLAY_INFO) as PlanType[]).map((plan) => {
                                const planInfo = PLAN_DISPLAY_INFO[plan];
                                const features = PLAN_FEATURES[plan];
                                const isCurrentPlan = planType === plan;
                                const price = yearlyBilling ? planInfo.price.yearly / 12 : planInfo.price.monthly;

                                return (
                                    <div key={plan} className={`plan-card ${isCurrentPlan ? 'current' : ''} ${plan === 'basic' ? 'popular' : ''}`}>
                                        {plan === 'basic' && <div className="popular-badge">Most Popular</div>}

                                        {!isActive && !hasTrialExpired && plan !== 'free' && (
                                            <div className="trial-badge">30-Day Free Trial</div>
                                        )}

                                        <div className="plan-header">
                                            <h3 className="plan-name">{planInfo.name}</h3>
                                            <p className="plan-description">{planInfo.description}</p>
                                        </div>

                                        <div className="plan-pricing">
                                            <span className="price-amount">${price.toFixed(2)}</span>
                                            <span className="price-interval">/month</span>
                                            {yearlyBilling && plan !== 'free' && (
                                                <div className="yearly-note">Billed annually</div>
                                            )}
                                        </div>

                                        <ul className="plan-features">
                                            <li>
                                                <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                {features.transactions === 'unlimited' ? 'Unlimited' : features.transactions} transactions/month
                                            </li>
                                            <li>
                                                <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                {features.invoices === 'unlimited' ? 'Unlimited' : features.invoices} invoices
                                            </li>
                                            <li>
                                                <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                {features.clients === 'unlimited' ? 'Unlimited' : features.clients} clients
                                            </li>
                                            {features.bankSync && (
                                                <li>
                                                    <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                    Bank account sync
                                                </li>
                                            )}
                                            {features.advancedReporting && (
                                                <li>
                                                    <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                    Advanced reporting
                                                </li>
                                            )}
                                            {features.apiAccess && (
                                                <li>
                                                    <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                    API access
                                                </li>
                                            )}
                                        </ul>

                                        <button
                                            className={`plan-button ${isCurrentPlan ? 'current' : plan === 'free' ? 'downgrade' : (!isActive && !hasTrialExpired) ? 'trial' : 'upgrade'}`}
                                            onClick={() => handlePlanSelect(plan)}
                                            disabled={isCurrentPlan}
                                        >
                                            {isCurrentPlan
                                                ? 'Current Plan'
                                                : plan === 'free'
                                                    ? 'Downgrade to Free'
                                                    : (!isActive && !hasTrialExpired)
                                                        ? 'Start Free Trial'
                                                        : `Upgrade to ${planInfo.name}`
                                            }
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Stripe Checkout Modal */}
                    {showCheckout && clientSecret && selectedPlan && (
                        <div className="checkout-overlay">
                            <div className="checkout-modal">
                                <div className="checkout-header">
                                    <h3>Subscribe to {PLAN_DISPLAY_INFO[selectedPlan.type].name}</h3>
                                    <button
                                        className="close-button"
                                        onClick={() => setShowCheckout(false)}
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
                                            }
                                        }
                                    }}
                                >
                                    <SubscriptionCheckout
                                        plan={selectedPlan}
                                        onSuccess={handleCheckoutSuccess}
                                        onCancel={() => setShowCheckout(false)}
                                    />
                                </Elements>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Billing;
