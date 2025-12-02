import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { MenuOverlay } from '@/components/mobile/MenuOverlay';
import { CardSwiper } from '@/components/mobile/CardSwiper';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { PublishedItem } from '@/types';

export default function StudioScreen() {
  const router = useRouter();
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
      const catalogItems: PublishedItem[] = (catalogResponse.images || []).map((img: any) => ({
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
      const publishedItems: PublishedItem[] = (showcaseResponse.items || []).map((item: any) => ({
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
    <View style={{ flex: 1, backgroundColor: '#1a3d3d' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <MobileHeader onMenuPress={() => setMenuVisible(true)} />
        <MenuOverlay visible={menuVisible} onClose={() => setMenuVisible(false)} />

        <ScrollView style={{ flex: 1 }}>
          {/* Page Title */}
          <View style={{ paddingHorizontal: 24, paddingTop: 32 }}>
            <Text
              style={{
                color: '#FFFFFF',
                textAlign: 'center',
                fontFamily: 'Trajan',
                fontSize: 40,
                letterSpacing: 8,
                fontWeight: '400',
              }}
            >
              STUDIO
            </Text>
          </View>

          {/* Hero Section with Cards */}
          <View style={{ position: 'relative', paddingTop: 48, minHeight: 580 }}>
            {/* 3D Card Swiper */}
            <View style={{ zIndex: 10 }}>
              <CardSwiper
                items={items}
                onCardPress={(item) => {
                  // Navigate to detail view
                  console.log('Card pressed:', item.id);
                }}
              />
            </View>
          </View>

          {/* CTA Section - Minimal Border Style with Narrower Width */}
          <View style={{ alignItems: 'center', marginTop: 16, paddingBottom: 64 }}>
            <TouchableOpacity
              style={{
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.4)',
                borderRadius: 4,
                paddingVertical: 16,
                paddingHorizontal: 48,
                maxWidth: 280,
              }}
              activeOpacity={0.8}
              onPress={() => router.push('/create')}
            >
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 14,
                  letterSpacing: 1,
                  textAlign: 'center',
                  textDecorationLine: 'underline',
                  textDecorationColor: 'rgba(255, 255, 255, 0.6)',
                }}
              >
                その感性を、かたちに。
              </Text>
            </TouchableOpacity>
          </View>

          {/* Gallery Link - Underline Style */}
          <View style={{ paddingHorizontal: 24, paddingBottom: 32, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => router.push('/showcase')}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 14,
                  textDecorationLine: 'underline',
                  textDecorationColor: 'rgba(255, 255, 255, 0.6)',
                }}
              >
                ショーケースを見る
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={{ paddingHorizontal: 24, paddingBottom: 80 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 24 }}>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: 12 }}>About</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: 12 }}>FAQ</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: 12 }}>Contact</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: 'rgba(255, 255, 255, 0.2)', fontSize: 12, textAlign: 'center' }}>
              © 2024 Open Wardrobe Market
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
