
import React from 'react';

interface Plan {
    id: string;
    name: string;
    description: string;
    price: number;
    interval: string;
    features: string[];
    popular?: boolean;
}

interface PlanCardProps {
    plan: Plan;
    isCurrentPlan: boolean;
    onSelect: (planId: string) => void;
}

const PlanCard = ({ plan, isCurrentPlan, onSelect }: PlanCardProps) => {
    return (
        <div className={`plan-card ${isCurrentPlan ? 'current' : ''} ${plan.popular ? 'popular' : ''}`}>
            {plan.popular && <div className="popular-badge">Most Popular</div>}

            <div className="plan-header">
                <h3 className="plan-name">{plan.name}</h3>
                <p className="plan-description">{plan.description}</p>
            </div>

            <div className="plan-pricing">
                <span className="price-amount">${plan.price.toFixed(2)}</span>
                <span className="price-interval">/{plan.interval}</span>
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
                className={`plan-button ${isCurrentPlan ? 'current' : 'upgrade'}`}
                onClick={() => onSelect(plan.id)}
                disabled={isCurrentPlan}
            >
                {isCurrentPlan ? 'Current Plan' : `Upgrade to ${plan.name}`}
            </button>
        </div>
    );
};

export default PlanCard;