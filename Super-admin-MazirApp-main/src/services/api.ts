import { API_URL } from '@/src/lib/config';

/**
 * Base API client for making requests
 */
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Make a GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log('🌐 [API] GET', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('📬 [API] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [API] Error response:', errorText);
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ [API] Success, got', Array.isArray(data) ? data.length : 1, 'items');
    return data;
  }

  /**
   * Make a POST request
   */
  async post<T>(endpoint: string, data: unknown): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log('🌐 [API] POST', url, 'with data:', data);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log('📬 [API] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [API] Error response:', errorText);
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log('✅ [API] Success, got response:', responseData);
    return responseData;
  }

  /**
   * Make a PUT request
   */
  async put<T>(endpoint: string, data: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();
