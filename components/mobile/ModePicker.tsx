import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export type CreateMode =
  | 'fusion'
  | 'composer'
  | 'heritage'
  | 'zero'
  | 'mutation'
  | 'evolution'
  | 'remix';

interface ModeOption {
  id: CreateMode;
  title: string;
  description: string;
  icon: keyof typeof FontAwesome.glyphMap;
  available: boolean;
}

const modeOptions: ModeOption[] = [
  {
    id: 'fusion',
    title: 'FUSION',
    description: '2つの画像を融合させて新しいデザインを生成',
    icon: 'random',
    available: true,
  },
  {
    id: 'composer',
    title: 'COMPOSER',
    description: '6つの質問からあなただけのデザインを作成',
    icon: 'magic',
    available: true,
  },
  {
    id: 'heritage',
    title: 'HERITAGE',
    description: '伝統的な要素を融合させたデザイン',
    icon: 'book',
    available: false,
  },
  {
    id: 'zero',
    title: 'ZERO',
    description: 'ゼロからデザインを構築',
    icon: 'plus-circle',
    available: false,
  },
  {
    id: 'mutation',
    title: 'MUTATION',
    description: '既存デザインを変異させる',
    icon: 'flask',
    available: false,
  },
  {
    id: 'evolution',
    title: 'EVOLUTION',
    description: 'デザインを進化させる',
    icon: 'line-chart',
    available: false,
  },
  {
    id: 'remix',
    title: 'REMIX',
    description: 'デザイン要素を再構成',
    icon: 'refresh',
    available: false,
  },
];

interface ModePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (mode: CreateMode) => void;
}

export function ModePicker({ visible, onClose, onSelect }: ModePickerProps) {
  const handleSelect = (mode: CreateMode, available: boolean) => {
    if (!available) return;
    onSelect(mode);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-ink-200">
          <Text
            className="text-ink-900"
            style={{ fontFamily: 'Trajan', fontSize: 18, letterSpacing: 2 }}
          >
            CHOOSE A METHOD
          </Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <FontAwesome name="close" size={24} color="#1a3d3d" />
          </TouchableOpacity>
        </View>

        {/* Mode Options */}
        <View className="flex-1 px-6 py-8">
          <View className="space-y-4">
            {modeOptions.map((mode) => (
              <TouchableOpacity
                key={mode.id}
                onPress={() => handleSelect(mode.id, mode.available)}
                activeOpacity={mode.available ? 0.7 : 1}
                className={`rounded-2xl p-6 ${
                  mode.available
                    ? 'bg-darkTeal'
                    : 'bg-ink-100 opacity-50'
                }`}
                style={[
                  styles.modeCard,
                  mode.available && styles.modeCardActive,
                ]}
              >
                <View className="flex-row items-start">
                  <View
                    className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
                      mode.available ? 'bg-white/20' : 'bg-ink-200'
                    }`}
                  >
                    <FontAwesome
                      name={mode.icon}
                      size={20}
                      color={mode.available ? '#FAFAF7' : '#777777'}
                    />
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text
                        className={`text-lg tracking-wider ${
                          mode.available ? 'text-offwhite' : 'text-ink-400'
                        }`}
                        style={{ fontFamily: 'Trajan', letterSpacing: 2 }}
                      >
                        {mode.title}
                      </Text>
                      {!mode.available && (
                        <View className="ml-2 px-2 py-1 bg-ink-200 rounded">
                          <Text className="text-ink-600 text-xs">
                            COMING SOON
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      className={`mt-2 text-sm leading-5 ${
                        mode.available ? 'text-offwhite/80' : 'text-ink-400'
                      }`}
                    >
                      {mode.description}
                    </Text>
                  </View>

                  {mode.available && (
                    <FontAwesome name="chevron-right" size={16} color="#FAFAF7" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modeCard: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modeCardActive: {
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
});
