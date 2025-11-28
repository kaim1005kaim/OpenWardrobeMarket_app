import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

interface MenuOverlayProps {
  visible: boolean;
  onClose: () => void;
}

export function MenuOverlay({ visible, onClose }: MenuOverlayProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleNavigate = (route: string) => {
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 300);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-ink-900" edges={['top']}>
        <View className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 py-4">
            <Text
              className="text-white font-bold tracking-widest"
              style={{ fontFamily: 'System', fontSize: 18 }}
            >
              MENU
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 items-center justify-center"
              activeOpacity={0.7}
            >
              <FontAwesome name="close" size={28} color="white" />
            </TouchableOpacity>
          </View>

          {/* Navigation Links */}
          <View className="flex-1 px-6 pt-12">
            <TouchableOpacity
              className="py-6 border-b border-white/10"
              onPress={() => handleNavigate('/')}
              activeOpacity={0.7}
            >
              <Text
                className="text-white text-3xl font-bold tracking-widest"
                style={{ fontFamily: 'System' }}
              >
                STUDIO
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="py-6 border-b border-white/10"
              onPress={() => handleNavigate('/showcase')}
              activeOpacity={0.7}
            >
              <Text
                className="text-white text-3xl font-bold tracking-widest"
                style={{ fontFamily: 'System' }}
              >
                SHOWCASE
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="py-6 border-b border-white/10"
              onPress={() => handleNavigate('/create')}
              activeOpacity={0.7}
            >
              <Text
                className="text-white text-3xl font-bold tracking-widest"
                style={{ fontFamily: 'System' }}
              >
                CREATE
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="py-6 border-b border-white/10"
              onPress={() => handleNavigate('/archive')}
              activeOpacity={0.7}
            >
              <Text
                className="text-white text-3xl font-bold tracking-widest"
                style={{ fontFamily: 'System' }}
              >
                ARCHIVE
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="px-6 pb-8">
            {user && (
              <TouchableOpacity
                className="py-4 mb-4"
                onPress={() => {
                  signOut();
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Text className="text-white/60 text-sm">Logout</Text>
              </TouchableOpacity>
            )}

            <View className="flex-row space-x-6">
              <TouchableOpacity activeOpacity={0.7}>
                <Text className="text-white/40 text-xs">FAQ</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7}>
                <Text className="text-white/40 text-xs">Privacy</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7}>
                <Text className="text-white/40 text-xs">Contact</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-white/20 text-xs mt-6">
              © 2024 Open Wardrobe Market
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
