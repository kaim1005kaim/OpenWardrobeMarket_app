import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ReelSwiper } from '@/components/mobile/ReelSwiper';
import { MenuOverlay } from '@/components/mobile/MenuOverlay';
import { useAuth } from '@/contexts/AuthContext';
import { useStudioData } from '@/contexts/StudioContext';
import { useSplashReady } from '@/contexts/SplashContext';
import { supabase } from '@/lib/supabase';

export default function StudioScreen() {
  const { user } = useAuth();
  const { items, loading } = useStudioData();
  const { setAppReady } = useSplashReady();
  const [menuVisible, setMenuVisible] = useState(false);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [processingLikes, setProcessingLikes] = useState<Set<string>>(new Set());
  const [isContentReady, setIsContentReady] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchLikedItems();
    }
  }, [user?.id]);

  // Signal app ready when items are loaded
  useEffect(() => {
    if (items.length > 0 && !loading) {
      console.log('[StudioScreen] Items loaded, signaling app ready');
      setAppReady();
    }
  }, [items.length, loading, setAppReady]);

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
      console.error('[studio] Failed to fetch liked items:', error);
    }
  };

  const toggleLike = async (itemId: string) => {
    if (!user?.id) {
      console.log('[studio] User not logged in');
      return;
    }

    // Prevent multiple simultaneous likes on same item
    if (processingLikes.has(itemId)) {
      console.log('[studio] Already processing like for:', itemId);
      return;
    }

    const isLiked = likedItems.has(itemId);
    const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://open-wardrobe-market.com';
    const url = `${API_URL}/api/collections/${itemId}`;

    console.log('[studio] Toggling like (optimistic):', { itemId, isLiked, url });

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

    try {
      const response = await fetch(url, {
        method: isLiked ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[studio] Failed to toggle like, reverting:', {
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
        return;
      }

      console.log('[studio] Successfully toggled like:', { itemId, isLiked: !isLiked });
    } catch (error) {
      console.error('[studio] Failed to toggle like, reverting:', error);

      // Revert optimistic update on error
      const revertedLikedItems = new Set(likedItems);
      if (!isLiked) {
        revertedLikedItems.delete(itemId);
      } else {
        revertedLikedItems.add(itemId);
      }
      setLikedItems(revertedLikedItems);
    } finally {
      // Remove from processing
      setProcessingLikes(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  // Only show loading screen if data is empty AND loading
  if (loading && items.length === 0) {
    return <View style={{ flex: 1, backgroundColor: '#EDEBE5' }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: isContentReady ? '#000000' : '#EDEBE5' }}>
      <MenuOverlay visible={menuVisible} onClose={() => setMenuVisible(false)} />
      <ReelSwiper
        items={items}
        likedItems={likedItems}
        onLikePress={user ? toggleLike : undefined}
        onLayout={() => {
          requestAnimationFrame(() => {
            console.log('[StudioScreen] Content ready, signaling splash');
            setIsContentReady(true);
            setAppReady();
          });
        }}
      />
    </View>
  );
}
