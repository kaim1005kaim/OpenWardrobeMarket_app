import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { MenuOverlay } from '@/components/mobile/MenuOverlay';
import { apiClient } from '@/lib/api-client';

interface UserGeneration {
  id: string;
  user_id?: string;
  image_url?: string;
  src?: string; // user-gallery uses 'src' instead of 'image_url'
  title: string;
  is_public?: boolean;
  is_published?: boolean;
  status?: string;
  type?: 'generated' | 'published' | 'saved';
  created_at: string;
  metadata?: any;
}

export default function ArchiveScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'published' | 'drafts' | 'collections'>('published');
  const [generations, setGenerations] = useState<UserGeneration[]>([]);
  const [allGenerations, setAllGenerations] = useState<UserGeneration[]>([]); // 全データを保持
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchGenerations();
    }
  }, [user, activeTab]);

  // Fetch tab counts on initial mount and when user changes
  useEffect(() => {
    if (user) {
      fetchTabCounts();
    }
  }, [user]);

  const fetchGenerations = async () => {
    if (!user) return;

    try {
      setLoading(true);

      let response: { success?: boolean; images?: UserGeneration[]; items?: UserGeneration[]; total: number };

      // Use different API endpoints based on tab
      if (activeTab === 'collections') {
        // Use /api/saved for collections
        response = await apiClient.get<{ success: boolean; items: UserGeneration[]; total: number }>(
          `/api/saved?user_id=${user.id}`
        );
        // Normalize: /api/saved returns 'items', not 'images'
        response.images = response.items;
      } else {
        // Use /api/user-gallery for published and drafts
        const apiType = activeTab === 'published' ? 'published' : 'drafts';
        response = await apiClient.get<{ success: boolean; images: UserGeneration[]; total: number }>(
          `/api/user-gallery?user_id=${user.id}&type=${apiType}`
        );
      }

      console.log(`[archive] Fetched ${activeTab} items:`, response.images?.length || 0);

      // Normalize the data format (user-gallery uses 'src', we use 'image_url')
      const normalized = (response.images || []).map((item) => ({
        ...item,
        image_url: item.src || item.image_url || '',
        is_public: item.is_published || item.type === 'published',
      }));

      setGenerations(normalized);

      // For tab counts, we'll fetch them separately on mount only
      // (avoiding unnecessary fetches on every tab switch)
    } catch (error) {
      console.error('[archive] Failed to fetch generations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch tab counts only once on mount
  const fetchTabCounts = async () => {
    if (!user) return;

    try {
      const [publishedRes, draftsRes, collectionsRes] = await Promise.all([
        apiClient.get<{ total: number }>(`/api/user-gallery?user_id=${user.id}&type=published&limit=0`),
        apiClient.get<{ total: number }>(`/api/user-gallery?user_id=${user.id}&type=drafts&limit=0`),
        apiClient.get<{ total: number }>(`/api/saved?user_id=${user.id}&limit=0`), // Use /api/saved for collections
      ]);

      console.log('[archive] Tab counts:', {
        published: publishedRes.total,
        drafts: draftsRes.total,
        collections: collectionsRes.total,
      });

      // Update allGenerations with counts for tab badges
      setAllGenerations([
        ...Array(publishedRes.total || 0).fill({ type: 'published' }),
        ...Array(draftsRes.total || 0).fill({ type: 'generated' }),
        ...Array(collectionsRes.total || 0).fill({ type: 'saved' }),
      ] as any);
    } catch (error) {
      console.error('[archive] Failed to fetch tab counts:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchGenerations();
    fetchTabCounts();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F0E9' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <MobileHeader
          onMenuPress={() => setMenuVisible(true)}
          transparent
          darkText
        />
        <MenuOverlay
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
              ARCHIVE
            </Text>
          </View>

          <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 }}>
        {user ? (
          <View style={{ alignItems: 'center' }}>
            {/* Avatar Placeholder */}
            <View
              style={{
                width: 72,
                height: 72,
                backgroundColor: '#002FA7',
                borderRadius: 36,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' }}>
                {user.email?.charAt(0).toUpperCase()}
              </Text>
            </View>

            <Text style={{ color: '#1A1A1A', fontWeight: 'bold', fontSize: 18, marginBottom: 8, textAlign: 'center' }}>
              {user.email}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
              <Text style={{ color: '#FF7A1A', fontSize: 14, marginRight: 8 }}>★★★★☆</Text>
              <View
                style={{
                  backgroundColor: '#1A1A1A',
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 9999,
                }}
              >
                <Text style={{ color: '#F4F4F0', fontSize: 12, fontWeight: '600' }}>
                  SUBSCRIBED
                </Text>
              </View>
            </View>

            {/* Tabs */}
            <View
              style={{
                flexDirection: 'row',
                borderBottomWidth: 1,
                borderBottomColor: '#DCDCDC',
                marginBottom: 24,
                width: '100%',
                justifyContent: 'center',
              }}
            >
              <TouchableOpacity
                style={{
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderBottomWidth: 2,
                  borderBottomColor: '#1A1A1A',
                }}
              >
                <Text style={{ color: '#1A1A1A', fontWeight: '600' }}>DESIGN</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ paddingHorizontal: 24, paddingVertical: 12 }}>
                <Text style={{ color: '#777777', fontWeight: '600' }}>SETTING</Text>
              </TouchableOpacity>
            </View>

            {/* Sub Tabs */}
            <View style={{ flexDirection: 'row', marginBottom: 24, justifyContent: 'center', gap: 8 }}>
              <TouchableOpacity
                onPress={() => setActiveTab('published')}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: activeTab === 'published' ? '#1A1A1A' : '#FFFFFF',
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: activeTab === 'published' ? '#F4F4F0' : '#3A3A3A', fontSize: 14, fontWeight: '500' }}>
                  Publish ({allGenerations.filter((g) => g.type === 'published').length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('drafts')}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: activeTab === 'drafts' ? '#1A1A1A' : '#FFFFFF',
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: activeTab === 'drafts' ? '#F4F4F0' : '#3A3A3A', fontSize: 14, fontWeight: '500' }}>
                  Drafts ({allGenerations.filter((g) => g.type === 'generated').length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('collections')}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: activeTab === 'collections' ? '#1A1A1A' : '#FFFFFF',
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: activeTab === 'collections' ? '#F4F4F0' : '#3A3A3A', fontSize: 14, fontWeight: '500' }}>
                  Collections ({allGenerations.filter((g) => g.type === 'saved').length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            {loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 60, width: '100%' }}>
                <ActivityIndicator size="large" color="#1a3d3d" />
              </View>
            ) : generations.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 60, width: '100%' }}>
                <Text style={{ color: '#777777', textAlign: 'center' }}>
                  {activeTab === 'published' && 'No published designs yet.'}
                  {activeTab === 'drafts' && 'No drafts yet.'}
                  {activeTab === 'collections' && 'No collections yet.'}
                </Text>
              </View>
            ) : (
              <View style={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {generations.map((gen) => (
                  <TouchableOpacity
                    key={gen.id}
                    onPress={() => {
                      router.push(`/item/${gen.id}`);
                    }}
                    activeOpacity={0.8}
                    style={{ width: '31.5%', aspectRatio: 1, borderRadius: 8, overflow: 'hidden', backgroundColor: '#E5E5E5' }}
                  >
                    <Image
                      source={{ uri: gen.image_url }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                      placeholder="L6Pj42%L~q%2"
                      transition={150}
                      cachePolicy="memory-disk"
                      recyclingKey={gen.id}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Sign Out Button */}
            <TouchableOpacity
              style={{
                marginTop: 16,
                backgroundColor: '#DCDCDC',
                borderRadius: 12,
                paddingVertical: 16,
                paddingHorizontal: 48,
                alignItems: 'center',
              }}
              onPress={signOut}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#3A3A3A', fontWeight: '600' }}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 24, alignItems: 'center', paddingVertical: 80 }}>
            <Text
              style={{
                color: '#3A3A3A',
                textAlign: 'center',
                fontSize: 18,
                marginBottom: 16,
              }}
            >
              サインインしてアーカイブにアクセス
            </Text>
            <Text
              style={{
                color: '#777777',
                textAlign: 'center',
                marginBottom: 32,
              }}
            >
              作成したデザインを保存・管理できます
            </Text>

            {/* Login Button */}
            <TouchableOpacity
              style={{
                backgroundColor: '#1a3d3d',
                borderRadius: 12,
                paddingVertical: 16,
                paddingHorizontal: 32,
              }}
              onPress={() => router.push('/login')}
              activeOpacity={0.8}
            >
              <Text
                style={{
                  color: '#F4F4F0',
                  fontWeight: 'bold',
                  fontSize: 16,
                  letterSpacing: 1.5,
                  fontFamily: 'System',
                }}
              >
                LOGIN
              </Text>
            </TouchableOpacity>
          </View>
        )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
