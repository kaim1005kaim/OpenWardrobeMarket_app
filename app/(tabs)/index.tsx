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
      const response = await apiClient.get<{ images: any[] }>(
        '/api/catalog'
      );
      // Convert catalog format to PublishedItem format
      const catalogItems: PublishedItem[] = (response.images || []).map((img: any) => ({
        id: img.id,
        user_id: '',
        title: img.title,
        category: 'FUSION' as const,
        image_url: img.src,
        thumbnail_url: img.src,
        metadata: { tags: img.tags },
        created_at: img.createdAt,
        updated_at: img.createdAt,
        is_public: true,
      }));
      setItems(catalogItems);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading designs..." />;
  }

  return (
    <View className="flex-1 bg-darkTeal">
      <SafeAreaView className="flex-1" edges={['top']}>
        <MobileHeader onMenuPress={() => setMenuVisible(true)} />
        <MenuOverlay visible={menuVisible} onClose={() => setMenuVisible(false)} />

        <ScrollView className="flex-1">
          {/* Hero Section with Title Behind Cards */}
          <View className="relative pt-20" style={{ minHeight: 620 }}>
            {/* Background Title - Behind Cards - Slightly overlapping */}
            <View className="absolute top-32 left-0 right-0 items-center z-0" style={{ paddingTop: 20 }}>
              <Text
                className="text-white"
                style={{
                  fontFamily: 'Trajan',
                  fontSize: 64,
                  fontWeight: '400',
                  letterSpacing: 8,
                }}
              >
                STUDIO
              </Text>
            </View>

            {/* 3D Card Swiper - Above Title */}
            <View className="z-10" style={{ marginTop: 20 }}>
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
          <View className="items-center -mt-8 pb-16">
            <TouchableOpacity
              className="border border-white/40 rounded py-4 px-12"
              activeOpacity={0.8}
              onPress={() => router.push('/create')}
              style={{ maxWidth: 280 }}
            >
              <Text
                className="text-white text-sm tracking-wider text-center"
                style={{
                  textDecorationLine: 'underline',
                  textDecorationColor: 'rgba(255, 255, 255, 0.6)',
                }}
              >
                その感性を、かたちに。
              </Text>
            </TouchableOpacity>
          </View>

          {/* Gallery Link - Underline Style */}
          <View className="px-6 pb-8 items-center">
            <TouchableOpacity
              onPress={() => router.push('/showcase')}
              activeOpacity={0.8}
            >
              <Text
                className="text-white text-sm"
                style={{
                  textDecorationLine: 'underline',
                  textDecorationColor: 'rgba(255, 255, 255, 0.6)',
                }}
              >
                ショーケースを見る
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="px-6 pb-20">
            <View className="flex-row justify-center space-x-6 mb-6">
              <TouchableOpacity activeOpacity={0.7}>
                <Text className="text-white/40 text-xs">About</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7}>
                <Text className="text-white/40 text-xs">FAQ</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7}>
                <Text className="text-white/40 text-xs">Contact</Text>
              </TouchableOpacity>
            </View>
            <Text className="text-white/20 text-xs text-center">
              © 2024 Open Wardrobe Market
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
