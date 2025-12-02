import { apiClient } from './api-client';

export interface SimilarItem {
  id: string;
  image_id: string;
  title: string;
  similarity_score?: number;
  overlapping_tags?: string[];
}

export interface SimilaritySearchResult {
  similar_items: SimilarItem[];
  algorithm: 'auto_tags_jaccard' | 'vector_cosine' | 'vector_hybrid' | 'category_fallback';
  params?: {
    vector_weight?: number;
    tag_weight?: number;
    threshold?: number;
  };
}

/**
 * Find similar items using tag-based search (Jaccard similarity)
 */
export async function findSimilarByTags(
  itemId: string,
  limit: number = 10
): Promise<SimilaritySearchResult> {
  try {
    console.log('[similarity-api] Finding similar items by tags for:', itemId);

    const response = await apiClient.post<SimilaritySearchResult>(
      '/api/similar-items',
      {
        itemId,
        limit,
      }
    );

    console.log('[similarity-api] Tag search result:', response.algorithm, response.similar_items.length, 'items');

    return response;
  } catch (error) {
    console.error('[similarity-api] Tag search error:', error);
    return {
      similar_items: [],
      algorithm: 'category_fallback',
    };
  }
}

/**
 * Find similar items using vector search (CLIP embeddings)
 * Falls back to tag search if no embedding is available
 */
export async function findSimilarByVector(
  itemId: string,
  limit: number = 10,
  mode: 'vector' | 'hybrid' | 'auto' = 'auto'
): Promise<SimilaritySearchResult> {
  try {
    console.log('[similarity-api] Finding similar items by vector for:', itemId);

    const response = await apiClient.post<SimilaritySearchResult>(
      '/api/vector-search',
      {
        itemId,
        limit,
        mode,
        threshold: 0.7,
        vectorWeight: 0.7,
        tagWeight: 0.3,
      }
    );

    console.log('[similarity-api] Vector search result:', response.algorithm, response.similar_items.length, 'items');

    return response;
  } catch (error: any) {
    console.warn('[similarity-api] Vector search failed:', error);

    // If vector search fails due to missing embedding, fallback to tag search
    if (error?.response?.data?.hasTags) {
      console.log('[similarity-api] Falling back to tag search');
      return findSimilarByTags(itemId, limit);
    }

    return {
      similar_items: [],
      algorithm: 'category_fallback',
    };
  }
}

/**
 * Smart similarity search that tries vector first, then falls back to tags
 */
export async function findSimilarItems(
  itemId: string,
  limit: number = 10
): Promise<SimilaritySearchResult> {
  // Try vector search first (it will auto-fallback to tags if needed)
  const vectorResult = await findSimilarByVector(itemId, limit, 'auto');

  // If vector search returned no results, try pure tag search
  if (vectorResult.similar_items.length === 0) {
    console.log('[similarity-api] No vector results, trying tag search');
    return findSimilarByTags(itemId, limit);
  }

  return vectorResult;
}
