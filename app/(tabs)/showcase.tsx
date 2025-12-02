import React, { useEffect, useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { MenuOverlay } from '@/components/mobile/MenuOverlay';
import { SearchModal } from '@/components/mobile/SearchModal';
import { GalleryCard } from '@/components/mobile/GalleryCard';
import { apiClient } from '@/lib/api-client';

// Memoized card component for better performance
const MemoizedGalleryCard = memo(GalleryCard);

export default function ShowcaseScreen() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchItems = async () => {
    try {
      // Fetch both catalog and published items in parallel
      const [catalogResponse, showcaseResponse] = await Promise.all([
        apiClient.get<{ images: any[] }>('/api/catalog')
          .catch((error) => {
            console.warn('[showcase] /api/catalog failed:', error);
            return { images: [] };
          }),
        apiClient.get<{ success: boolean; items: any[]; total: number }>('/api/showcase?limit=100')
          .catch((error) => {
            console.warn('[showcase] /api/showcase failed:', error);
            return { success: false, items: [], total: 0 };
          })
      ]);

      const catalogItems = (catalogResponse.images || []).map((item: any) => {
        // Catalog items should already have 'src' field, but ensure it exists
        const imageUrl = item.src || item.image_url || item.url;
        if (!imageUrl) {
          console.warn('[showcase] Catalog item missing image URL:', {
            id: item.id,
            title: item.title,
            availableFields: Object.keys(item),
          });
        }
        return {
          ...item,
          src: imageUrl,
          isUserGenerated: false,
        };
      }).filter((item) => item.src); // Filter out catalog items without images

      // Map published items from showcase API
      const publishedItems = (showcaseResponse.items || []).map((item: any) => {
        // Try multiple fields to get image URL
        // Priority: original_url > poster_url > quadtych_urls.main > image_url
        let imageUrl = item.original_url || item.poster_url || item.image_url;

        // Check if quadtych_urls exists (both in metadata and at top level)
        const quadtychUrls = item.metadata?.quadtych_urls || item.quadtych_urls;
        if (!imageUrl && quadtychUrls?.main) {
          imageUrl = quadtychUrls.main;
        }

        // Also check if variants exist and use first variant's image
        if (!imageUrl && item.metadata?.variants && item.metadata.variants.length > 0) {
          const firstVariant = item.metadata.variants[0];
          imageUrl = firstVariant.url || firstVariant.image_url;
        }

        if (!imageUrl) {
          console.warn('[showcase] Item missing image URL:', {
            id: item.id,
            title: item.title,
            availableFields: Object.keys(item),
          });
        }
        return {
          id: item.id,
          src: imageUrl,
          title: item.title || 'Untitled Design',
          tags: item.tags || [],
          colors: item.colors || [],
          price: item.price,
          likes: item.likes || 0,
          isUserGenerated: true,
          createdAt: item.created_at,
          userName: item.user_name,
          userAvatar: item.user_avatar,
          metadata: item.metadata || item.fusion_spec,
        };
      }).filter((item) => {
        // Filter out items without images
        if (!item.src) return false;

        // Filter out R2 direct URLs (unauthorized access)
        // These URLs start with https://pub-*.r2.dev
        if (item.src.includes('.r2.dev/')) {
          console.log('[showcase] Filtering out R2 direct URL:', item.title, item.src);
          return false;
        }

        return true;
      });

      console.log('[showcase] Fetched items:', {
        catalog: catalogItems.length,
        published: publishedItems.length,
        publishedWithImages: publishedItems.filter(i => i.src).length,
      });

      // Sort published items by created_at (newest first)
      const sortedPublished = [...publishedItems].sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA; // Descending order (newest first)
      });

      // Catalog items can stay in original order or be shuffled
      const shuffledCatalog = shuffleArray([...catalogItems]);

      // Merge with published items taking priority (70% published, 30% catalog ratio)
      // Published items will maintain their chronological order
      const allItems = interleaveArrays(sortedPublished, shuffledCatalog, 0.7);

      console.log('[showcase] Total items after merge:', allItems.length);
      console.log('[showcase] First 5 items:', allItems.slice(0, 5).map(i => ({ title: i.title, createdAt: i.createdAt, isUserGenerated: i.isUserGenerated })));

      setItems(allItems);
      setFilteredItems(allItems);
    } catch (error) {
      console.error('[showcase] Failed to fetch items:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredItems(items);
      return;
    }

    const filtered = items.filter((item) => {
      const searchLower = query.toLowerCase();
      const titleMatch = item.title?.toLowerCase().includes(searchLower);
      const tagsMatch = item.tags?.some((tag: string) =>
        tag.toLowerCase().includes(searchLower)
      );
      return titleMatch || tagsMatch;
    });

    setFilteredItems(filtered);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFilteredItems(items);
  };

  // Optimized render function for FlatList
  const renderItem = useCallback(({ item }: { item: any }) => (
    <MemoizedGalleryCard
      imageUrl={item.src}
      title={item.title}
      tags={item.tags}
      userName={item.userName}
      userAvatar={item.userAvatar}
      createdAt={item.createdAt}
      metadata={{
        silhouette: item.metadata?.silhouette || item.metadata?.garment_style,
        materials: item.metadata?.materials || item.metadata?.fabrics,
        palette: item.metadata?.palette || item.colors,
      }}
      onPress={() => router.push(`/item/${item.id}`)}
    />
  ), [router]);

  const keyExtractor = useCallback((item: any) => item.id, []);

  const getItemLayout = useCallback((data: any, index: number) => {
    const CARD_WIDTH = (390 - 48) / 2; // Approximate screen width
    const CARD_HEIGHT = CARD_WIDTH * 1.4 + 50; // Image height + metadata height
    return {
      length: CARD_HEIGHT,
      offset: CARD_HEIGHT * Math.floor(index / 2),
      index,
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F0E9' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <MobileHeader onMenuPress={() => setMenuVisible(true)} transparent darkText />
        <MenuOverlay visible={menuVisible} onClose={() => setMenuVisible(false)} />
        <SearchModal
          visible={searchVisible}
          onClose={() => setSearchVisible(false)}
          onSearch={handleSearch}
        />

        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={2}
          columnWrapperStyle={{
            paddingHorizontal: 16,
            gap: 16,
            justifyContent: 'space-between',
          }}
          contentContainerStyle={{
            paddingTop: 16,
            paddingBottom: 96,
          }}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <>
              {/* Page Title */}
              <View style={{ paddingHorizontal: 24, paddingTop: 32 }}>
                <Text
                  style={{
                    color: '#1A1A1A',
                    textAlign: 'center',
                    fontFamily: 'Trajan',
                    fontSize: 40,
                    letterSpacing: 8,
                    fontWeight: '400',
                  }}
                >
                  SHOWCASE
                </Text>
              </View>

              {/* Search Bar */}
              <View style={{ paddingHorizontal: 24, paddingBottom: 16, paddingTop: 24 }}>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: '#DCDCDC',
                  }}
                  onPress={() => setSearchVisible(true)}
                  activeOpacity={0.7}
                >
                  <FontAwesome name="search" size={16} color="#777777" />
                  <Text
                    style={{
                      color: '#777777',
                      marginLeft: 8,
                      fontSize: 14,
                      textTransform: 'uppercase',
                      letterSpacing: 1.5,
                    }}
                  >
                    {searchQuery || 'SEARCH'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          }
          ListEmptyComponent={
            loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 120 }}>
                <ActivityIndicator size="large" color="#1a3d3d" />
                <Text style={{ color: '#777777', marginTop: 16 }}>
                  Loading gallery...
                </Text>
              </View>
            ) : (
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 80,
                  paddingHorizontal: 24,
                }}
              >
                <FontAwesome name="search" size={48} color="#EAEAEA" />
                <Text
                  style={{
                    color: '#777777',
                    textAlign: 'center',
                    marginTop: 16,
                    fontSize: 16,
                  }}
                >
                  {searchQuery
                    ? `「${searchQuery}」に一致するデザインが見つかりませんでした`
                    : 'まだデザインがありません'}
                </Text>
              </View>
            )
          }
        />
      </SafeAreaView>
    </View>
  );
}
