/**
 * Simplified plan configuration - gets plan details from Stripe
 * Only defines plan types and feature flags for the frontend
 */

export type PlanType = 'free' | 'basic' | 'pro';

export interface PlanFeatures {
    transactions: number | 'unlimited';
    invoices: number | 'unlimited';
    clients: number | 'unlimited';
    teamMembers: number | 'unlimited';
    bankSync: boolean;
    advancedReporting: boolean;
    apiAccess: boolean;
    prioritySupport: boolean;
    customBranding: boolean;
}

// Feature definitions based on plan type
export const PLAN_FEATURES: Record<PlanType, PlanFeatures> = {
    free: {
        transactions: 50,
        invoices: 10,
        clients: 5,
        teamMembers: 1,
        bankSync: false,
        advancedReporting: false,
        apiAccess: false,
        prioritySupport: false,
        customBranding: false,
    },
    basic: {
        transactions: 500,
        invoices: 'unlimited',
        clients: 25,
        teamMembers: 3,
        bankSync: true,
        advancedReporting: true,
        apiAccess: false,
        prioritySupport: true,
        customBranding: false,
    },
    pro: {
        transactions: 'unlimited',
        invoices: 'unlimited',
        clients: 'unlimited',
        teamMembers: 'unlimited',
        bankSync: true,
        advancedReporting: true,
        apiAccess: true,
        prioritySupport: true,
        customBranding: true,
    },
};

/**
 * Get plan type from Stripe price ID
 */
export const getPlanTypeFromPriceId = (priceId: string): PlanType => {
    if (!priceId) return 'free';

    if (priceId.includes('basic')) return 'basic';
    if (priceId.includes('pro')) return 'pro';

    return 'free';
};

/**
 * Check if user has access to a feature based on their plan
 */
export const hasFeature = (planType: PlanType, feature: keyof PlanFeatures): boolean => {
    return !!PLAN_FEATURES[planType][feature];
};

/**
 * Get feature limit for a plan
 */
export const getFeatureLimit = (planType: PlanType, feature: keyof PlanFeatures): number | 'unlimited' => {
    return PLAN_FEATURES[planType][feature] as number | 'unlimited';
};

/**
 * Check if user is within feature limit
 */
export const isWithinLimit = (planType: PlanType, feature: keyof PlanFeatures, currentUsage: number): boolean => {
    const limit = getFeatureLimit(planType, feature);
    if (limit === 'unlimited') return true;
    return currentUsage < (limit as number);
};

/**
 * Stripe price IDs - these should be set in environment variables
 */
export const STRIPE_PRICE_IDS = {
    basic: {
        monthly: import.meta.env.VITE_STRIPE_BASIC_MONTHLY_PRICE_ID,
        yearly: import.meta.env.VITE_STRIPE_BASIC_YEARLY_PRICE_ID,
    },
    pro: {
        monthly: import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID,
        yearly: import.meta.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID,
    },
};

export const TRIAL_DURATION_DAYS = 30;
