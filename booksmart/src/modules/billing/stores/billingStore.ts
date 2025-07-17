import { create } from 'zustand';
import { supabase } from '../../../lib/supabase';
import { PricingPlan, UserSubscription, BillingPeriod } from '../types/billing';

interface BillingStore {
    currentSubscription: UserSubscription | null;
    billingPeriod: BillingPeriod;
    isLoading: boolean;
    error: string | null;

    setBillingPeriod: (period: BillingPeriod) => void;
    fetchSubscription: () => Promise<void>;
    createCheckoutSession: (priceId: string) => Promise<void>;
    cancelSubscription: () => Promise<void>;
    updatePaymentMethod: () => Promise<void>;
}

export const useBillingStore = create<BillingStore>((set, get) => ({
    currentSubscription: null,
    billingPeriod: 'monthly',
    isLoading: false,
    error: null,

    setBillingPeriod: (period) => set({ billingPeriod: period }),

    fetchSubscription: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            const { data, error } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error) throw error;

            set({ currentSubscription: data, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    createCheckoutSession: async (priceId: string) => {
        set({ isLoading: true, error: null });
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    priceId,
                    userId: user.id,
                    userEmail: user.email,
                }),
            });

            const { sessionUrl } = await response.json();
            window.location.href = sessionUrl;
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    cancelSubscription: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            const response = await fetch('/api/cancel-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id }),
            });

            if (!response.ok) throw new Error('Failed to cancel subscription');

            await get().fetchSubscription();
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    updatePaymentMethod: async () => {
        set({ isLoading: true, error: null });
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user found');

            const response = await fetch('/api/create-portal-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id }),
            });

            const { portalUrl } = await response.json();
            window.location.href = portalUrl;
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },
}));