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
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// Memoized card component for better performance
const MemoizedGalleryCard = memo(GalleryCard);

export default function ShowcaseScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [processingLikes, setProcessingLikes] = useState<Set<string>>(new Set());

  const ITEMS_PER_PAGE = 20;

  const fetchItems = async (loadMore = false) => {
    if (loadMore && (loadingMore || !hasMore)) return;

    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setOffset(0);
        setHasMore(true);
      }

      const currentOffset = loadMore ? offset : 0;

      // Temporary: Use old /api/showcase + /api/recommend until showcase-feed is deployed
      const [showcaseRes, recommendRes] = await Promise.all([
        apiClient.get<{ success: boolean; items: any[] }>('/api/showcase').catch(() => ({ success: false, items: [] })),
        apiClient.get<{ success: boolean; recommendations: any[] }>('/api/recommend').catch(() => ({ success: false, recommendations: [] })),
      ]);

      // Filter and normalize catalog items (same filtering as published items)
      const catalogItems = (showcaseRes.items || []).filter((item: any) => {
        const imageUrl = item.poster_url || item.original_url || item.image_url;
        if (!imageUrl) {
          console.log('[showcase] Filtering out catalog item without image:', item.title);
          return false;
        }
        if (imageUrl.includes('.r2.dev/')) {
          console.log('[showcase] Filtering out catalog R2 direct URL:', item.title);
          return false;
        }
        return true;
      }).map((item: any) => ({
        ...item,
        src: item.poster_url || item.original_url || item.image_url,
        userName: 'OpenDesign', // Set OpenDesign for all catalog items
      }));

      // Filter out R2 direct URLs (unauthorized access) and items without images
      const publishedItems = (recommendRes.recommendations || []).filter((item: any) => {
        const imageUrl = item.src || item.image_url || item.poster_url;
        if (!imageUrl) {
          console.log('[showcase] Filtering out item without image:', item.title);
          return false;
        }
        if (imageUrl.includes('.r2.dev/')) {
          console.log('[showcase] Filtering out R2 direct URL:', item.title);
          return false;
        }
        return true;
      }).map((item: any) => ({
        ...item,
        src: item.src || item.image_url || item.poster_url,
      }));

      // Sort published by date (newest first), shuffle catalog
      const sortedPublished = [...publishedItems].sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      // Simple shuffle for catalog
      const shuffledCatalog = [...catalogItems].sort(() => Math.random() - 0.5);

      // Interleave: 70% published, 30% catalog
      const merged: any[] = [];
      let pubIndex = 0;
      let catIndex = 0;

      while (pubIndex < sortedPublished.length || catIndex < shuffledCatalog.length) {
        // Add published items (70% probability)
        if (pubIndex < sortedPublished.length && (Math.random() < 0.7 || catIndex >= shuffledCatalog.length)) {
          merged.push(sortedPublished[pubIndex++]);
        }
        // Add catalog items (30% probability)
        else if (catIndex < shuffledCatalog.length) {
          merged.push(shuffledCatalog[catIndex++]);
        }
      }

      // Apply pagination client-side
      const newItems = merged.slice(currentOffset, currentOffset + ITEMS_PER_PAGE);

      console.log('[showcase] Fetched and merged (client-side):', {
        offset: currentOffset,
        received: newItems.length,
        total: merged.length,
        catalog: catalogItems.length,
        published: publishedItems.length,
      });

      if (loadMore) {
        setItems((prev) => [...prev, ...newItems]);
        setFilteredItems((prev) => [...prev, ...newItems]);
        setOffset(currentOffset + newItems.length);
      } else {
        setItems(newItems);
        setFilteredItems(newItems);
        setOffset(newItems.length);
      }

      // Check if there are more items to load
      setHasMore(newItems.length === ITEMS_PER_PAGE);
    } catch (error) {
      console.error('[showcase] Failed to fetch items:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };


  useEffect(() => {
    fetchItems();
    if (user?.id) {
      fetchLikedItems();
    }
  }, [user?.id]);

  const fetchLikedItems = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('collections')
        .select('item_id')
        .eq('user_id', user.id);

      if (!error && data) {
        setLikedItems(new Set(data.map(item => item.item_id)));
      }
    } catch (error) {
      console.error('[showcase] Failed to fetch liked items:', error);
    }
  };

  const toggleLike = async (itemId: string) => {
    if (!user?.id) {
      console.log('[showcase] User not logged in');
      return;
    }

    // Prevent multiple simultaneous likes on same item
    if (processingLikes.has(itemId)) {
      console.log('[showcase] Already processing like for:', itemId);
      return;
    }

    const isLiked = likedItems.has(itemId);
    const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://open-wardrobe-market.com';
    const url = `${API_URL}/api/collections/${itemId}`;

    console.log('[showcase] Toggling like (optimistic):', { itemId, isLiked, url });

    // Mark as processing
    setProcessingLikes(prev => new Set(prev).add(itemId));

    // Optimistic UI update - instant feedback
    const newLikedItems = new Set(likedItems);
    if (isLiked) {
      newLikedItems.delete(itemId);
    } else {
      newLikedItems.add(itemId);
    }
    setLikedItems(newLikedItems);

    // Update items array optimistically
    const updateItems = (items: any[]) => items.map(item =>
      item.id === itemId
        ? { ...item, likes: (item.likes || 0) + (isLiked ? -1 : 1) }
        : item
    );
    setItems(prevItems => updateItems(prevItems));
    setFilteredItems(prevItems => updateItems(prevItems));

    try {
      const response = await fetch(url, {
        method: isLiked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[showcase] Failed to toggle like, reverting:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          itemId,
        });

        // Revert optimistic update on error
        const revertedLikedItems = new Set(likedItems);
        if (!isLiked) {
          revertedLikedItems.delete(itemId);
        } else {
          revertedLikedItems.add(itemId);
        }
        setLikedItems(revertedLikedItems);

        const revertItems = (items: any[]) => items.map(item =>
          item.id === itemId
            ? { ...item, likes: (item.likes || 0) + (isLiked ? 1 : -1) }
            : item
        );
        setItems(prevItems => revertItems(prevItems));
        setFilteredItems(prevItems => revertItems(prevItems));
        return;
      }

      console.log('[showcase] Successfully toggled like:', { itemId, isLiked: !isLiked });
    } catch (error) {
      console.error('[showcase] Failed to toggle like, reverting:', error);

      // Revert optimistic update on error
      const revertedLikedItems = new Set(likedItems);
      if (!isLiked) {
        revertedLikedItems.delete(itemId);
      } else {
        revertedLikedItems.add(itemId);
      }
      setLikedItems(revertedLikedItems);

      const revertItems = (items: any[]) => items.map(item =>
        item.id === itemId
          ? { ...item, likes: (item.likes || 0) + (isLiked ? 1 : -1) }
          : item
      );
      setItems(prevItems => revertItems(prevItems));
      setFilteredItems(prevItems => revertItems(prevItems));
    } finally {
      // Remove from processing
      setProcessingLikes(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
    if (user?.id) {
      fetchLikedItems();
    }
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
      likes={item.likes}
      isLiked={likedItems.has(item.id)}
      showLikeButton={!!user}
      onLikePress={() => toggleLike(item.id)}
      metadata={{
        silhouette: item.metadata?.silhouette || item.metadata?.garment_style,
        materials: item.metadata?.materials || item.metadata?.fabrics,
        palette: item.metadata?.palette || item.colors,
      }}
      onPress={() => router.push(`/item/${item.id}`)}
    />
  ), [router, likedItems, user, toggleLike]);

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
          onEndReached={() => fetchItems(true)}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListFooterComponent={
            (loadingMore && !loading) ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#1a3d3d" />
              </View>
            ) : null
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
