import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { supabase } from './supabase';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://open-wardrobe-market.com';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // Direct access to axios instance for advanced usage
  getClient(): AxiosInstance {
    return this.client;
  }

  /**
   * Fetch similar items using vector search with tag-based fallback
   * @param itemId - The item ID to find similar items for
   * @param limit - Maximum number of similar items to return (default: 6)
   * @returns Array of similar items
   */
  async getSimilarItems(itemId: string, limit: number = 6) {
    try {
      // Try vector search first (auto mode with hybrid if tags available)
      const vectorResponse = await this.post<{ similar_items: any[] }>('/api/vector-search', {
        itemId,
        limit,
        mode: 'auto',
        threshold: 0.6,
        vectorWeight: 0.7,
        tagWeight: 0.3,
      });

      return vectorResponse.similar_items || [];
    } catch (vectorError) {
      console.warn('[api-client] Vector search failed, falling back to tag-based search:', vectorError);

      try {
        // Fallback to tag-based similarity search
        const tagResponse = await this.post<{ similar_items: any[] }>('/api/similar-items', {
          itemId,
          limit,
        });

        return tagResponse.similar_items || [];
      } catch (tagError) {
        console.error('[api-client] Both vector and tag-based search failed:', tagError);
        return [];
      }
    }
  }
}

export const apiClient = new APIClient();
