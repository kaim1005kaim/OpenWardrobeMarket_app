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
        <ModePicker
          visible={modePickerVisible}
          onClose={() => setModePickerVisible(false)}
          onSelect={handleModeSelect}
        />

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
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
              CREATE
            </Text>
          </View>

          {/* Urula Hero Section */}
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <UrulaHero />

            <Text
              style={{
                color: '#3A3A3A',
                textAlign: 'center',
                marginTop: 32,
                paddingHorizontal: 24,
                fontSize: 16,
                lineHeight: 24,
                maxWidth: 320,
              }}
            >
              あなたの創造性を解き放つ{'\n'}
              Urulaと一緒にデザインを生み出そう
            </Text>
          </View>

          {/* CTA Buttons */}
          <View style={{ paddingHorizontal: 24, paddingBottom: 48 }}>
            {/* Primary CTA */}
            <TouchableOpacity
              style={{
                backgroundColor: '#1a3d3d',
                borderRadius: 16,
                paddingVertical: 20,
                alignItems: 'center',
                marginBottom: 16,
                ...styles.primaryButton,
              }}
              activeOpacity={0.8}
              onPress={handleStartDesigning}
            >
              <Text
                style={{
                  color: '#F4F4F0',
                  letterSpacing: 2,
                  fontSize: 18,
                  fontFamily: 'Trajan',
                }}
              >
                START DESIGNING
              </Text>
            </TouchableOpacity>

            {/* Secondary Link */}
            <TouchableOpacity
              style={{ paddingVertical: 16, alignItems: 'center' }}
              activeOpacity={0.7}
              onPress={() => setModePickerVisible(true)}
            >
              <Text
                style={{
                  color: '#5A5A5A',
                  fontSize: 14,
                  letterSpacing: 1,
                  textDecorationLine: 'underline',
                }}
              >
                CHOOSE A METHOD
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info Section */}
          <View style={{ paddingHorizontal: 24, paddingBottom: 64 }}>
            <View style={{ backgroundColor: '#F8F7F4', borderRadius: 16, padding: 24 }}>
              <Text
                style={{
                  color: '#1A1A1A',
                  fontSize: 14,
                  marginBottom: 12,
                  letterSpacing: 1,
                  fontFamily: 'Trajan',
                }}
              >
                AVAILABLE MODES
              </Text>
              <View style={{ gap: 12 }}>
                <View>
                  <Text style={{ color: '#1A1A1A', fontWeight: '600', marginBottom: 4 }}>
                    FUSION
                  </Text>
                  <Text style={{ color: '#5A5A5A', fontSize: 14, lineHeight: 20 }}>
                    2つの画像を融合させて新しいデザインを生成
                  </Text>
                </View>
                <View>
                  <Text style={{ color: '#1A1A1A', fontWeight: '600', marginBottom: 4 }}>
                    COMPOSER
                  </Text>
                  <Text style={{ color: '#5A5A5A', fontSize: 14, lineHeight: 20 }}>
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
