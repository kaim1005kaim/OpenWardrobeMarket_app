import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { MenuOverlay } from '@/components/mobile/MenuOverlay';
import { UrulaHero } from '@/components/mobile/UrulaHero';
import { ModePicker, CreateMode } from '@/components/mobile/ModePicker';

export default function CreateScreen() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [modePickerVisible, setModePickerVisible] = useState(false);

  const handleModeSelect = (mode: CreateMode) => {
    console.log('Selected mode:', mode);

    if (mode === 'fusion') {
      router.push('/fusion');
    } else if (mode === 'composer') {
      // TODO: Implement COMPOSER mode
      console.log('COMPOSER mode not yet implemented');
    } else {
      console.log(`Mode ${mode} not yet implemented`);
    }
  };

  const handleStartDesigning = () => {
    // Default to FUSION mode
    handleModeSelect('fusion');
  };

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
        <ModePicker
          visible={modePickerVisible}
          onClose={() => setModePickerVisible(false)}
          onSelect={handleModeSelect}
        />

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
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
              CREATE
            </Text>
          </View>

          {/* Urula Hero Section */}
          <View className="items-center py-12">
            <UrulaHero />

            <Text
              className="text-ink-700 text-center mt-8 px-6 text-base leading-6"
              style={{ maxWidth: 320 }}
            >
              あなたの創造性を解き放つ{'\n'}
              Urulaと一緒にデザインを生み出そう
            </Text>
          </View>

          {/* CTA Buttons */}
          <View className="px-6 pb-12">
            {/* Primary CTA */}
            <TouchableOpacity
              className="bg-darkTeal rounded-2xl py-5 items-center mb-4"
              activeOpacity={0.8}
              onPress={handleStartDesigning}
              style={styles.primaryButton}
            >
              <Text
                className="text-offwhite tracking-wider text-lg"
                style={{ fontFamily: 'Trajan', letterSpacing: 2 }}
              >
                START DESIGNING
              </Text>
            </TouchableOpacity>

            {/* Secondary Link */}
            <TouchableOpacity
              className="py-4 items-center"
              activeOpacity={0.7}
              onPress={() => setModePickerVisible(true)}
            >
              <Text
                className="text-ink-600 text-sm tracking-wider underline"
                style={{ letterSpacing: 1 }}
              >
                CHOOSE A METHOD
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info Section */}
          <View className="px-6 pb-16">
            <View className="bg-ink-50 rounded-2xl p-6">
              <Text
                className="text-ink-900 text-sm mb-3 tracking-wider"
                style={{ fontFamily: 'Trajan', letterSpacing: 1 }}
              >
                AVAILABLE MODES
              </Text>
              <View className="space-y-3">
                <View>
                  <Text className="text-ink-900 font-semibold mb-1">
                    FUSION
                  </Text>
                  <Text className="text-ink-600 text-sm leading-5">
                    2つの画像を融合させて新しいデザインを生成
                  </Text>
                </View>
                <View>
                  <Text className="text-ink-900 font-semibold mb-1">
                    COMPOSER
                  </Text>
                  <Text className="text-ink-600 text-sm leading-5">
                    6つの質問からあなただけのデザインを作成
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  primaryButton: {
    shadowColor: '#1a3d3d',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
