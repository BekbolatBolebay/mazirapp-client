import { apiClient } from './api';

export type SubscriptionPeriod = 'month' | 'year';

export interface Subscription {
  id: string;
  name: string;
  description: string;
  price: number;
  period: SubscriptionPeriod;
  status: boolean;
  createdAt: string;
}

export type SubscriptionFormData = Omit<Subscription, 'id' | 'createdAt'>;



/**
 * Subscriptions API Service
 */
export const subscriptionsService = {
  /**
   * Fetch all subscriptions
   */
  async getSubscriptions(): Promise<Subscription[]> {
    try {
      return await apiClient.get<Subscription[]>('/subscriptions');
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
      throw error;
    }
  },

  /**
   * Get a single subscription
   */
  async getSubscriptionById(id: string): Promise<Subscription> {
    try {
      return await apiClient.get<Subscription>(`/subscriptions/${id}`);
    } catch (error) {
      console.error(`Failed to fetch subscription ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new subscription
   */
  async createSubscription(data: SubscriptionFormData): Promise<Subscription> {
    try {
      console.log('🚀 [subscriptionsService] POST /subscriptions - Creating:', data);
      const result = await apiClient.post<Subscription>('/subscriptions', data);
      console.log('✅ [subscriptionsService] Created subscription:', result);
      return result;
    } catch (error) {
      console.error('❌ [subscriptionsService] Failed to create subscription:', error);
      throw error;
    }
  },

  /**
   * Update a subscription
   */
  async updateSubscription(
    id: string,
    data: SubscriptionFormData
  ): Promise<Subscription> {
    try {
      return await apiClient.put<Subscription>(`/subscriptions/${id}`, data);
    } catch (error) {
      console.error(`Failed to update subscription ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a subscription
   */
  async deleteSubscription(id: string): Promise<{ success: boolean }> {
    try {
      return await apiClient.delete<{ success: boolean }>(`/subscriptions/${id}`);
    } catch (error) {
      console.error(`Failed to delete subscription ${id}:`, error);
      throw error;
    }
  },
};
