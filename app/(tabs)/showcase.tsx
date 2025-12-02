import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { MenuOverlay } from '@/components/mobile/MenuOverlay';
import { SearchModal } from '@/components/mobile/SearchModal';
import { MasonryGrid } from '@/components/mobile/MasonryGrid';
import { apiClient } from '@/lib/api-client';

export default function ShowcaseScreen() {
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

      const catalogItems = (catalogResponse.images || []).map((item: any) => ({
        ...item,
        isUserGenerated: false,
      }));

      // Map published items from showcase API
      const publishedItems = (showcaseResponse.items || []).map((item: any) => ({
        id: item.id,
        src: item.original_url || item.poster_url || item.image_url,
        title: item.title || 'Untitled Design',
        tags: item.tags || [],
        colors: item.colors || [],
        price: item.price,
        likes: item.likes || 0,
        isUserGenerated: true,
        createdAt: item.created_at,
      }));

      console.log('[showcase] Fetched items:', {
        catalog: catalogItems.length,
        published: publishedItems.length,
      });

      // Shuffle both arrays separately
      const shuffledPublished = shuffleArray([...publishedItems]);
      const shuffledCatalog = shuffleArray([...catalogItems]);

      // Merge with published items taking priority (70% published, 30% catalog ratio)
      const allItems = interleaveArrays(shuffledPublished, shuffledCatalog, 0.7);

      console.log('[showcase] Total items after merge:', allItems.length);

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

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
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

          {/* Loading or Content */}
          {loading ? (
            <View style={{ alignItems: 'center', paddingVertical: 120 }}>
              <ActivityIndicator size="large" color="#1a3d3d" />
              <Text style={{ color: '#777777', marginTop: 16 }}>
                Loading gallery...
              </Text>
            </View>
          ) : filteredItems.length > 0 ? (
            <View style={{ paddingBottom: 96, paddingTop: 16 }}>
              <MasonryGrid
                items={filteredItems}
                onItemPress={(item) => {
                  console.log('Item pressed:', item.id);
                }}
              />
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
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
