import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ReelSwiper } from '@/components/mobile/ReelSwiper';
import { MenuOverlay } from '@/components/mobile/MenuOverlay';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { PublishedItem } from '@/types';

export default function StudioScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<PublishedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);

  const fetchItems = async () => {
    try {
      // Fetch from multiple sources in parallel
      const [catalogResponse, showcaseResponse] = await Promise.all([
        apiClient.get<{ images: any[] }>('/api/catalog')
          .catch((error) => {
            console.warn('[studio] /api/catalog failed:', error);
            return { images: [] };
          }),
        apiClient.get<{ success: boolean; items: any[]; total: number }>('/api/showcase?limit=50')
          .catch((error) => {
            console.warn('[studio] /api/showcase failed:', error);
            return { success: false, items: [], total: 0 };
          })
      ]);

      // Convert catalog items
      const catalogItems: PublishedItem[] = (catalogResponse.images || [])
        .filter((img: any) => {
          // Filter out watercolor_blend items
          if (img.title?.includes('watercolor_blend')) {
            console.log('[studio] Filtering out watercolor_blend item:', img.title);
            return false;
          }
          // Filter out items without image URLs
          if (!img.src) {
            console.warn('[studio] Catalog item missing image URL:', img.title);
            return false;
          }
          // Filter out R2 direct URLs (unauthorized access)
          if (img.src.includes('.r2.dev/')) {
            console.log('[studio] Filtering out R2 direct URL:', img.title);
            return false;
          }
          return true;
        })
        .map((img: any) => ({
          id: img.id,
          user_id: '',
          title: img.title,
          category: 'FUSION' as const,
          image_url: img.src,
          thumbnail_url: img.src,
          metadata: img.tags ? { design_tokens: { tags: img.tags } } : undefined,
          created_at: img.createdAt,
          updated_at: img.createdAt,
          is_public: true,
        }));

      // Convert published items
      const publishedItems: PublishedItem[] = (showcaseResponse.items || [])
        .filter((item: any) => {
          // Filter out watercolor_blend items
          if (item.title?.includes('watercolor_blend')) {
            console.log('[studio] Filtering out watercolor_blend item:', item.title);
            return false;
          }

          // Get image URL
          const imageUrl = item.original_url || item.poster_url || item.image_url;

          // Filter out items without image URLs
          if (!imageUrl) {
            console.warn('[studio] Published item missing image URL:', item.title);
            return false;
          }

          // Filter out R2 direct URLs (unauthorized access)
          if (imageUrl.includes('.r2.dev/')) {
            console.log('[studio] Filtering out R2 direct URL:', item.title);
            return false;
          }

          return true;
        })
        .map((item: any) => ({
          id: item.id,
          user_id: item.user_id || '',
          title: item.title || 'Untitled Design',
          category: 'FUSION' as const,
          image_url: item.original_url || item.poster_url || item.image_url,
          thumbnail_url: item.original_url || item.poster_url || item.image_url,
          metadata: item.tags ? { design_tokens: { tags: item.tags } } : undefined,
          created_at: item.created_at,
          updated_at: item.created_at,
          is_public: true,
        }));

      console.log('[studio] Fetched items:', {
        catalog: catalogItems.length,
        published: publishedItems.length,
      });

      // Shuffle and merge arrays
      const shuffledPublished = shuffleArray([...publishedItems]);
      const shuffledCatalog = shuffleArray([...catalogItems]);

      // Mix with 60% published, 40% catalog ratio for variety
      const allItems = interleaveArrays(shuffledPublished, shuffledCatalog, 0.6);

      console.log('[studio] Total items after merge:', allItems.length);
      setItems(allItems);
    } catch (error) {
      console.error('[studio] Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fisher-Yates shuffle algorithm
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Interleave two arrays with priority ratio
  const interleaveArrays = <T,>(primary: T[], secondary: T[], primaryRatio: number): T[] => {
    const result: T[] = [];
    let primaryIndex = 0;
    let secondaryIndex = 0;

    while (primaryIndex < primary.length || secondaryIndex < secondary.length) {
      // Add items from primary array based on ratio
      const primaryCount = Math.random() < primaryRatio ? 2 : 1;
      for (let i = 0; i < primaryCount && primaryIndex < primary.length; i++) {
        result.push(primary[primaryIndex++]);
      }

      // Add one item from secondary array
      if (secondaryIndex < secondary.length) {
        result.push(secondary[secondaryIndex++]);
      }
    }

    return result;
  };

  useEffect(() => {
    fetchItems();
  }, []);

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading designs..." />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <MenuOverlay visible={menuVisible} onClose={() => setMenuVisible(false)} />
      <ReelSwiper items={items} />
    </View>
  );
}
