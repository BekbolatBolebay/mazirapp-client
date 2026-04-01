import { apiClient } from './api';

export interface Cafe {
  id: string; // Changed from number to string (UUID)
  name: string;
  logo: string;
  city: string;
  address: string;
  description?: string;
  workHours?: string;
  plan: string;
  status: 'active' | 'warning' | 'expired' | 'blocked';
  expiry: string;
  blockUntil?: string | null;
  blockReason?: string | null;
  notifications?: {
    subject: string;
    message: string;
    createdAt: string;
  }[];
}



/**
 * Cafes API Service
 */
export const cafesService = {
  /**
   * Fetch all cafes
   */
  async getCafes(): Promise<Cafe[]> {
    try {
      return await apiClient.get<Cafe[]>('/cafes');
    } catch (error) {
      console.error('Failed to fetch cafes:', error);
      throw error;
    }
  },

  /**
   * Get a single cafe by ID
   */
  async getCafeById(id: string): Promise<Cafe> {
    try {
      return await apiClient.get<Cafe>(`/cafes/${id}`);
    } catch (error) {
      console.error(`Failed to fetch cafe ${id}:`, error);
      throw error;
    }
  },

  /**
   * Block a cafe
   */
  async blockCafe(
    id: string,
    blockDays: number,
    blockReason: string
  ): Promise<Cafe> {
    try {
      return await apiClient.post<Cafe>(`/cafes/${id}/block`, {
        blockDays,
        blockReason,
      });
    } catch (error) {
      console.error(`Failed to block cafe ${id}:`, error);
      throw error;
    }
  },

  /**
   * Unblock a cafe
   */
  async unblockCafe(id: string): Promise<Cafe> {
    try {
      return await apiClient.post<Cafe>(`/cafes/${id}/unblock`, {});
    } catch (error) {
      console.error(`Failed to unblock cafe ${id}:`, error);
      throw error;
    }
  },

  /**
   * Update cafe plan
   */
  async updateCafePlan(id: string, planId: string): Promise<Cafe> {
    try {
      return await apiClient.put<Cafe>(`/cafes/${id}/plan`, { planId });
    } catch (error) {
      console.error(`Failed to update cafe ${id} plan:`, error);
      throw error;
    }
  },

  /**
   * Send notification to cafe
   */
  async notifyCafe(
    id: string,
    subject: string,
    message: string
  ): Promise<{ success: boolean }> {
    try {
      return await apiClient.post<{ success: boolean }>(`/cafes/${id}/notify`, {
        subject,
        message,
      });
    } catch (error) {
      console.error(`Failed to notify cafe ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a cafe
   */
  async deleteCafe(id: string): Promise<{ success: boolean }> {
    try {
      return await apiClient.delete<{ success: boolean }>(`/cafes/${id}`);
    } catch (error) {
      console.error(`Failed to delete cafe ${id}:`, error);
      throw error;
    }
  },
};
