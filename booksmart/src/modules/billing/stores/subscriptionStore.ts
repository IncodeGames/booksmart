import { create } from 'zustand';
import { supabase } from '../../../lib/supabase';
import { StripeService } from '../../../services/stripeService';
import { getPlanTypeFromPriceId, type PlanType } from '../config/plans';

interface SubscriptionState {
    // Core subscription data
    isActive: boolean;
    planType: PlanType;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    currentPeriodEnd: Date | null;
    trialEnd: Date | null;

    // UI state
    isLoading: boolean;
    error: string | null;

    // Computed properties
    isTrialing: boolean;
    trialDaysRemaining: number;
    hasTrialExpired: boolean;

    // Actions
    fetchSubscriptionData: (userId: string) => Promise<void>;
    updateSubscriptionState: (subscriptionData: any) => void;
    startFreeTrial: (userId: string, priceId: string) => Promise<void>;
    createSubscription: (userId: string, priceId: string) => Promise<{ clientSecret: string }>;
    cancelSubscription: () => Promise<void>;
    clearError: () => void;
}

const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
    // Initial state
    isActive: false,
    planType: 'free',
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    currentPeriodEnd: null,
    trialEnd: null,
    isLoading: false,
    error: null,
    isTrialing: false,
    trialDaysRemaining: 0,
    hasTrialExpired: false,

    fetchSubscriptionData: async (userId: string) => {
        set({ isLoading: true, error: null });

        try {
            const { data, error } = await supabase
                .from('user_subscriptions')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
                throw error;
            }

            if (data) {
                get().updateSubscriptionState(data);
            } else {
                // No subscription found, user is on free plan
                set({
                    isActive: false,
                    planType: 'free',
                    stripeCustomerId: null,
                    stripeSubscriptionId: null,
                    currentPeriodEnd: null,
                    trialEnd: null,
                    isTrialing: false,
                    trialDaysRemaining: 0,
                    hasTrialExpired: false,
                });
            }
        } catch (error) {
            console.error('Error fetching subscription:', error);
            set({ error: 'Failed to fetch subscription data' });
        } finally {
            set({ isLoading: false });
        }
    },

    updateSubscriptionState: (data) => {
        const planType = getPlanTypeFromPriceId(data.plan_id);
        const now = new Date();
        const trialEnd = data.trial_end ? new Date(data.trial_end) : null;
        const currentPeriodEnd = data.current_period_end ? new Date(data.current_period_end) : null;

        let isTrialing = false;
        let trialDaysRemaining = 0;
        let hasTrialExpired = false;

        if (trialEnd) {
            isTrialing = data.status === 'trialing' && now < trialEnd;
            hasTrialExpired = now >= trialEnd;
            if (isTrialing) {
                trialDaysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            }
        }

        set({
            isActive: data.status === 'active' || data.status === 'trialing',
            planType,
            stripeCustomerId: data.stripe_customer_id,
            stripeSubscriptionId: data.stripe_subscription_id,
            currentPeriodEnd,
            trialEnd,
            isTrialing,
            trialDaysRemaining,
            hasTrialExpired,
        });
    },

    startFreeTrial: async (userId: string, priceId: string) => {
        set({ isLoading: true, error: null });

        try {
            await StripeService.startFreeTrial(userId, priceId, 30);
            await get().fetchSubscriptionData(userId);
        } catch (error) {
            console.error('Error starting free trial:', error);
            set({ error: error instanceof Error ? error.message : 'Failed to start free trial' });
        } finally {
            set({ isLoading: false });
        }
    },

    createSubscription: async (userId: string, priceId: string) => {
        set({ isLoading: true, error: null });

        try {
            const result = await StripeService.createSubscription({
                priceId,
                userId,
                trialDays: get().hasTrialExpired ? 0 : 30,
            });

            return result;
        } catch (error) {
            console.error('Error creating subscription:', error);
            set({ error: error instanceof Error ? error.message : 'Failed to create subscription' });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    cancelSubscription: async () => {
        const { stripeSubscriptionId } = get();
        if (!stripeSubscriptionId) return;

        set({ isLoading: true, error: null });

        try {
            await StripeService.cancelSubscription(stripeSubscriptionId, true);
            // Subscription will be updated via webhook, but we can optimistically update
            set({ isActive: false, planType: 'free' });
        } catch (error) {
            console.error('Error canceling subscription:', error);
            set({ error: error instanceof Error ? error.message : 'Failed to cancel subscription' });
        } finally {
            set({ isLoading: false });
        }
    },

    clearError: () => set({ error: null }),
}));

export default useSubscriptionStore;
