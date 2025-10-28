import { supabase } from '../lib/supabase';

export interface StripeSubscriptionData {
  subscriptionId: string;
  customerId: string;
  status: 'trialing' | 'active' | 'canceled' | 'past_due';
  currentPeriodEnd: string;
  trialEnd?: string;
}

/**
 * Simplified Stripe service - all operations go through Supabase Edge Functions
 * Stripe is the source of truth, database only stores minimal sync data
 */
export class StripeService {
  /**
   * Create a subscription (handles both trials and paid subscriptions)
   */
  static async createSubscription(params: {
    priceId: string;
    userId: string;
    trialDays?: number;
  }): Promise<{ clientSecret: string; subscription: StripeSubscriptionData }> {
    const { data, error } = await supabase.functions.invoke('create-subscription', {
      body: {
        priceId: params.priceId,
        userId: params.userId,
        trialDays: params.trialDays || 0,
      }
    });

    if (error) {
      throw new Error(error.message || 'Failed to create subscription');
    }

    return data;
  }

  /**
   * Start a free trial (creates a trial subscription without payment method)
   */
  static async startFreeTrial(userId: string, priceId: string, trialDays: number): Promise<void> {
    const { error } = await supabase.functions.invoke('start-free-trial', {
      body: {
        userId,
        priceId,
        trialDays,
      }
    });

    if (error) {
      throw new Error(error.message || 'Failed to start free trial');
    }
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<void> {
    const { error } = await supabase.functions.invoke('cancel-subscription', {
      body: {
        subscriptionId,
        cancelAtPeriodEnd,
      }
    });

    if (error) {
      throw new Error(error.message || 'Failed to cancel subscription');
    }
  }

  /**
   * Get Stripe billing portal URL
   */
  static async createBillingPortalSession(customerId: string, returnUrl: string): Promise<{ url: string }> {
    const { data, error } = await supabase.functions.invoke('create-billing-portal-session', {
      body: {
        customerId,
        returnUrl,
      }
    });

    if (error) {
      throw new Error(error.message || 'Failed to create billing portal session');
    }

    return data;
  }

  /**
   * Get pricing information from Stripe (cached)
   */
  static async getPricing(): Promise<any[]> {
    const { data, error } = await supabase.functions.invoke('get-pricing', {
      body: {}
    });

    if (error) {
      throw new Error(error.message || 'Failed to fetch pricing');
    }

    return data.prices || [];
  }

  /**
   * Sync user subscription from Stripe (for admin/debugging)
   */
  static async syncSubscription(userId: string): Promise<void> {
    const { error } = await supabase.functions.invoke('sync-subscription', {
      body: { userId }
    });

    if (error) {
      throw new Error(error.message || 'Failed to sync subscription');
    }
  }
}
