import { useState, useEffect } from 'react';
import {
    categoriesService,
    Category,
    CategoryFormData,
} from '@/src/services/categoriesService';

export type { Category, CategoryFormData };

export function useCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Fetch standard categories from API
     */
    useEffect(() => {
        const fetchCategories = async () => {
            setIsLoading(true);
            try {
                const data = await categoriesService.getStandardCategories();
                setCategories(data);
                setError(null);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to load categories';
                console.error('Failed to fetch categories:', message);
                setError(message);
            } finally {
                setIsLoading(false);
                setIsLoaded(true);
            }
        };

        fetchCategories();
    }, []);

    const addCategory = async (data: CategoryFormData) => {
        try {
            setIsLoading(true);
            const newCategory = await categoriesService.createStandardCategory(data);
            setCategories(prev => [...prev, newCategory]);
            setError(null);
            return newCategory;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to add category';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const updateCategory = async (id: string, data: Partial<CategoryFormData>) => {
        try {
            setIsLoading(true);
            const updated = await categoriesService.updateStandardCategory(id, data);
            setCategories(prev =>
                prev.map(cat => (cat.id === id ? updated : cat))
            );
            setError(null);
            return updated;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update category';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const deleteCategory = async (id: string) => {
        try {
            setIsLoading(true);
            await categoriesService.deleteStandardCategory(id);
            setCategories(prev => prev.filter(cat => cat.id !== id));
            setError(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete category';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        categories,
        isLoaded,
        isLoading,
        error,
        addCategory,
        updateCategory,
        deleteCategory,
    };
}
