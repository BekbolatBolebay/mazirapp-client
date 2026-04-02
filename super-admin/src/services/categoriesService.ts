import { apiClient } from './api';

export interface Category {
    id: string;
    name_kk: string;
    name_ru: string;
    name_en?: string;
    icon_url: string;
    sort_order: number;
    is_active: boolean;
    cafe_id: string | null;
    created_at?: string;
}

export type CategoryFormData = Omit<Category, 'id' | 'cafe_id' | 'created_at'>;

/**
 * Categories API Service for Super Admin
 */
export const categoriesService = {
    /**
     * Fetch all standard (global) categories
     */
    async getStandardCategories(): Promise<Category[]> {
        try {
            return await apiClient.get<Category[]>('/categories/standard');
        } catch (error) {
            console.error('Failed to fetch standard categories:', error);
            throw error;
        }
    },

    /**
     * Create a new standard category
     */
    async createStandardCategory(data: CategoryFormData): Promise<Category> {
        try {
            return await apiClient.post<Category>('/categories/standard', data);
        } catch (error) {
            console.error('Failed to create standard category:', error);
            throw error;
        }
    },

    /**
     * Update a standard category
     */
    async updateStandardCategory(id: string, data: Partial<CategoryFormData>): Promise<Category> {
        try {
            return await apiClient.put<Category>(`/categories/standard/${id}`, data);
        } catch (error) {
            console.error(`Failed to update category ${id}:`, error);
            throw error;
        }
    },

    /**
     * Delete a standard category
     */
    async deleteStandardCategory(id: string): Promise<{ success: boolean }> {
        try {
            return await apiClient.delete<{ success: boolean }>(`/categories/standard/${id}`);
        } catch (error) {
            console.error(`Failed to delete category ${id}:`, error);
            throw error;
        }
    },

    /**
     * Assign standard categories to a cafe
     */
    async assignToCafe(cafeId: string, categoryIds: string[]): Promise<{ success: boolean }> {
        try {
            return await apiClient.post<{ success: boolean }>(`/cafes/${cafeId}/categories`, { categoryIds });
        } catch (error) {
            console.error(`Failed to assign categories to cafe ${cafeId}:`, error);
            throw error;
        }
    }
};
