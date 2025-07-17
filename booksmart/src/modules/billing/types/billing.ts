export interface PricingPlan {
    id: string;
    name: 'Free' | 'Pro' | 'Expert';
    description: string;
    features: string[];
    monthlyPrice: number;
    yearlyPrice: number;
    stripePriceIdMonthly?: string;
    stripePriceIdYearly?: string;
}

export interface UserSubscription {
    id: string;
    userId: string;
    planName: string;
    status: 'active' | 'canceled' | 'past_due' | 'trialing';
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    paymentMethod?: {
        last4: string;
        brand: string;
        expiryMonth: number;
        expiryYear: number;
    };
}

export type BillingPeriod = 'monthly' | 'yearly';