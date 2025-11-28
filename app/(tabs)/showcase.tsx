import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
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
      const response = await apiClient.get<{ images: any[] }>(
        '/api/catalog'
      );
      const catalogItems = response.images || [];
      setItems(catalogItems);
      setFilteredItems(catalogItems);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading gallery..." />;
  }

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <MobileHeader onMenuPress={() => setMenuVisible(true)} transparent darkText />
        <MenuOverlay visible={menuVisible} onClose={() => setMenuVisible(false)} />
        <SearchModal
          visible={searchVisible}
          onClose={() => setSearchVisible(false)}
          onSearch={handleSearch}
        />

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Search Bar */}
          <View className="px-6 pb-4" style={{ paddingTop: 32 }}>
            <TouchableOpacity
              className="flex-row items-center justify-center py-3 border-b border-ink-200"
              onPress={() => setSearchVisible(true)}
              activeOpacity={0.7}
            >
              <FontAwesome name="search" size={16} color="#777777" />
              <Text className="text-ink-400 ml-2 text-sm uppercase tracking-wider">
                {searchQuery || 'SEARCH'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Masonry Grid with Overlapping Title */}
          <View className="relative">
            {/* SHOWCASE Title - Behind Grid */}
            <View className="absolute top-8 left-0 right-0 items-center z-0" style={{ pointerEvents: 'none' }}>
              <Text
                className="text-ink-900"
                style={{
                  fontFamily: 'Trajan',
                  fontSize: 56,
                  letterSpacing: 6,
                  fontWeight: '400',
                }}
              >
                SHOWCASE
              </Text>
            </View>

            {/* Masonry Grid - Above Title */}
            {filteredItems.length > 0 ? (
              <View className="pb-24 z-10" style={{ paddingTop: 35 }}>
                <MasonryGrid
                  items={filteredItems}
                  onItemPress={(item) => {
                    console.log('Item pressed:', item.id);
                  }}
                />
              </View>
            ) : (
              <View className="items-center justify-center py-20 px-6">
                <FontAwesome name="search" size={48} color="#EAEAEA" />
                <Text className="text-ink-400 text-center mt-4 text-base">
                  {searchQuery
                    ? `「${searchQuery}」に一致するデザインが見つかりませんでした`
                    : 'まだデザインがありません'}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
