import { useState, useEffect } from 'react';
import {
  subscriptionsService,
  Subscription,
  SubscriptionFormData,
  SubscriptionPeriod,
} from '@/src/services/subscriptionsService';

export type { SubscriptionPeriod, Subscription, SubscriptionFormData };

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Fetch subscriptions from API
   */
  useEffect(() => {
    const fetchSubscriptions = async () => {
      setIsLoading(true);
      try {
        const data = await subscriptionsService.getSubscriptions();
        setSubscriptions(data);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load subscriptions';
        console.error('Failed to fetch subscriptions:', message);
        setError(message);
      } finally {
        setIsLoading(false);
        setIsLoaded(true);
      }
    };

    fetchSubscriptions();
  }, []);

  const addSubscription = async (data: SubscriptionFormData) => {
    try {
      setIsLoading(true);
      console.log('📝 [useSubscriptions] Creating subscription:', data);
      const newSub = await subscriptionsService.createSubscription(data);
      console.log('✅ [useSubscriptions] Subscription created:', newSub);
      setSubscriptions(prev => [...prev, newSub]);
      setError(null);
      return newSub;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add subscription';
      console.error('❌ [useSubscriptions] Failed to add subscription:', message);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateSubscription = async (id: string, data: SubscriptionFormData) => {
    try {
      setIsLoading(true);
      const updated = await subscriptionsService.updateSubscription(id, data);
      setSubscriptions(prev =>
        prev.map(sub => (sub.id === id ? updated : sub))
      );
      setError(null);
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update subscription';
      console.error('Failed to update subscription:', message);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSubscription = async (id: string) => {
    try {
      setIsLoading(true);
      await subscriptionsService.deleteSubscription(id);
      setSubscriptions(prev => prev.filter(sub => sub.id !== id));
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete subscription';
      console.error('Failed to delete subscription:', message);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    subscriptions,
    isLoaded,
    isLoading,
    error,
    addSubscription,
    updateSubscription,
    deleteSubscription,
  };
}
