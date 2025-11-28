import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { MenuOverlay } from '@/components/mobile/MenuOverlay';

export default function ArchiveScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        <MobileHeader
          onMenuPress={() => setMenuVisible(true)}
          transparent
          darkText
        />
        <MenuOverlay
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
        />

        <ScrollView>
          {/* Page Title */}
          <View className="px-6 pt-8">
            <Text
              className="text-ink-900 text-center"
              style={{
                fontFamily: 'Trajan',
                fontSize: 48,
                letterSpacing: 8,
                fontWeight: '400',
              }}
            >
              ARCHIVE
            </Text>
          </View>

          <View className="px-6 pt-6 pb-8">
        {user ? (
          <View>
            {/* Avatar Placeholder */}
            <View className="w-24 h-24 bg-klein rounded-full items-center justify-center mb-4">
              <Text className="text-white text-2xl font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </Text>
            </View>

            <Text className="text-ink-900 font-bold text-xl mb-2">
              {user.email}
            </Text>
            <View className="flex-row items-center mb-6">
              <Text className="text-accent text-sm mr-2">★★★★☆</Text>
              <View className="bg-ink-900 px-3 py-1 rounded-full">
                <Text className="text-offwhite text-xs font-semibold">SUBSCRIBED</Text>
              </View>
            </View>

            {/* Tabs */}
            <View className="flex-row border-b border-ink-200 mb-6">
              <TouchableOpacity className="px-4 py-3 border-b-2 border-ink-900">
                <Text className="text-ink-900 font-semibold">DESIGN</Text>
              </TouchableOpacity>
              <TouchableOpacity className="px-4 py-3">
                <Text className="text-ink-400 font-semibold">SETTING</Text>
              </TouchableOpacity>
            </View>

            {/* Sub Tabs */}
            <View className="flex-row mb-6">
              <TouchableOpacity className="px-3 py-2 bg-ink-900 rounded-lg mr-2">
                <Text className="text-offwhite text-sm font-medium">Publish</Text>
              </TouchableOpacity>
              <TouchableOpacity className="px-3 py-2 bg-white rounded-lg mr-2">
                <Text className="text-ink-700 text-sm font-medium">Drafts</Text>
              </TouchableOpacity>
              <TouchableOpacity className="px-3 py-2 bg-white rounded-lg">
                <Text className="text-ink-700 text-sm font-medium">Collections</Text>
              </TouchableOpacity>
            </View>

            {/* Empty State */}
            <View className="items-center py-20">
              <Text className="text-ink-400 text-center">
                No published designs yet.
              </Text>
            </View>

            {/* Sign Out Button */}
            <TouchableOpacity
              className="mt-8 bg-ink-200 rounded-xl py-4 items-center"
              onPress={signOut}
              activeOpacity={0.8}
            >
              <Text className="text-ink-700 font-semibold">Sign Out</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="px-6 items-center py-20">
            <Text className="text-ink-700 text-center text-lg mb-4">
              サインインしてアーカイブにアクセス
            </Text>
            <Text className="text-ink-400 text-center mb-8">
              作成したデザインを保存・管理できます
            </Text>

            {/* Login Button */}
            <TouchableOpacity
              className="bg-darkTeal rounded-xl py-4 px-8"
              onPress={() => router.push('/login')}
              activeOpacity={0.8}
            >
              <Text className="text-offwhite font-bold text-base tracking-widest" style={{ fontFamily: 'System' }}>
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
