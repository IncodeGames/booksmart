export interface PricingPlan {
    id: string;
    name: 'Free' | 'Basic' | 'Pro';
    description: string;
    features: string[];
    monthlyPrice: number;
    yearlyPrice: number;
    stripePriceIdMonthly?: string;
    stripePriceIdYearly?: string;
    isPopular?: boolean;
}

export interface UserSubscription {
    id: string;
    userId: string;
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
    planName: string;
    status: 'trialing' | 'active' | 'canceled' | 'past_due' | 'unpaid';
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    trialEnd?: Date;
    cancelAtPeriodEnd: boolean;
    paymentMethod?: {
        last4: string;
        brand: string;
        expiryMonth: number;
        expiryYear: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface TrialStatus {
    isTrialing: boolean;
    trialEndDate?: Date;
    daysRemaining?: number;
    hasTrialExpired: boolean;
}

export interface BillingInvoice {
    id: string;
    invoiceId: string;
    amount: number;
    currency: string;
    status: 'paid' | 'open' | 'void' | 'uncollectible';
    invoiceUrl?: string;
    createdAt: Date;
    paidAt?: Date;
}

export type BillingPeriod = 'monthly' | 'yearly';

export type SubscriptionStatus = 'trialing' | 'active' | 'canceled' | 'past_due' | 'unpaid';

export interface PlanFeature {
    name: string;
    included: boolean;
    limit?: number;
}

// Constants for subscription plans
export const PLAN_LIMITS = {
    free: {
        transactions: 50,
        invoices: 10,
        clients: 5,
        teamMembers: 1,
    },
    basic: {
        transactions: 500,
        invoices: 50,
        clients: 25,
        teamMembers: 3,
    },
    pro: {
        transactions: -1, // unlimited
        invoices: -1,
        clients: -1,
        teamMembers: -1,
    },
};

export const TRIAL_DURATION_DAYS = 30;
