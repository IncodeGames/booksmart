import { create } from 'zustand';
import { supabase } from '../../../lib/supabase';

interface Plan {
    id: string;
    name: string;
    description: string;
    price: number;
    interval: string;
}

interface SubscriptionState {
    currentPlan: Plan | null;
    isLoading: boolean;
    error: string | null;
    setCurrentPlan: (plan: Plan | null) => void;
    fetchSubscriptionData: (userId: string) => Promise<void>;
}

const useSubscriptionStore = create<SubscriptionState>((set) => ({
    currentPlan: null,
    isLoading: false,
    error: null,

    setCurrentPlan: (plan) => set({ currentPlan: plan }),

    fetchSubscriptionData: async (userId) => {
        set({ isLoading: true, error: null });
        try {
            // In a real app, you would fetch this from your database or Stripe
            // This is a placeholder for demonstration
            const { data, error } = await supabase
                .from('subscriptions')
                .select('*, plans(*)')
                .eq('user_id', userId)
                .single();

            if (error) throw error;

            if (data) {
                set({
                    currentPlan: {
                        id: data.plans.id,
                        name: data.plans.name,
                        description: data.plans.description,
                        price: data.plans.price,
                        interval: data.plans.interval,
                    }
                });
            } else {
                set({
                    currentPlan: {
                        id: 'free',
                        name: 'Free',
                        description: 'Basic bookkeeping features',
                        price: 0,
                        interval: 'month',
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching subscription:', error);
            set({
                error: 'Failed to fetch subscription data',
                currentPlan: {
                    id: 'free',
                    name: 'Free',
                    description: 'Basic bookkeeping features',
                    price: 0,
                    interval: 'month',
                }
            });
        } finally {
            set({ isLoading: false });
        }
    },
}));

export default useSubscriptionStore;