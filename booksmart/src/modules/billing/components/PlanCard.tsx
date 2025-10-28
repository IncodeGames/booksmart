import React from 'react';

interface Plan {
    id: string;
    name: string;
    description: string;
    price: number;
    interval: string;
    features: string[];
    isPopular?: boolean;
    priceId?: string;
}

interface PlanCardProps {
    plan: Plan;
    isCurrentPlan: boolean;
    onSelect: (planId: string) => void;
    loading?: boolean;
    trialAvailable?: boolean;
}

/**
 * Enhanced PlanCard component with support for trials and improved UX
 * Displays pricing plans with features, trial availability, and subscription actions
 */
const PlanCard = ({ plan, isCurrentPlan, onSelect, loading = false, trialAvailable = false }: PlanCardProps) => {
    const getButtonText = () => {
        if (isCurrentPlan) {
            return 'Current Plan';
        }
        
        if (plan.id === 'free') {
            return 'Downgrade to Free';
        }
        
        if (trialAvailable) {
            return `Start Free Trial`;
        }
        
        return `Upgrade to ${plan.name}`;
    };

    const getButtonClass = () => {
        if (isCurrentPlan) return 'plan-button current';
        if (plan.id === 'free') return 'plan-button downgrade';
        if (trialAvailable) return 'plan-button trial';
        return 'plan-button upgrade';
    };

    return (
        <div className={`plan-card ${isCurrentPlan ? 'current' : ''} ${plan.isPopular ? 'popular' : ''}`}>
            {plan.isPopular && <div className="popular-badge">Most Popular</div>}
            
            {trialAvailable && plan.id !== 'free' && (
                <div className="trial-badge">30-Day Free Trial</div>
            )}

            <div className="plan-header">
                <h3 className="plan-name">{plan.name}</h3>
                <p className="plan-description">{plan.description}</p>
            </div>

            <div className="plan-pricing">
                <span className="price-amount">
                    ${plan.price.toFixed(2)}
                </span>
                <span className="price-interval">/{plan.interval}</span>
                {plan.interval === 'year' && plan.price > 0 && (
                    <div className="yearly-note">
                        ${(plan.price / 12).toFixed(2)}/month billed annually
                    </div>
                )}
            </div>

            <ul className="plan-features">
                {plan.features.map((feature, index) => (
                    <li key={index}>
                        <svg className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                    </li>
                ))}
            </ul>

            <button
                className={getButtonClass()}
                onClick={() => onSelect(plan.id)}
                disabled={isCurrentPlan || loading}
            >
                {loading ? (
                    <div className="button-spinner">
                        <div className="loading-spinner small"></div>
                    </div>
                ) : (
                    getButtonText()
                )}
            </button>
        </div>
    );
};

export default PlanCard;
