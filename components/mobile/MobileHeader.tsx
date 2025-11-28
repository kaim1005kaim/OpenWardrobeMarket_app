import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface MobileHeaderProps {
  onMenuPress: () => void;
  transparent?: boolean;
  darkText?: boolean;
}

export function MobileHeader({ onMenuPress, transparent = false, darkText = false }: MobileHeaderProps) {
  return (
    <View
      className={`flex-row items-center justify-center px-4 py-4 ${
        transparent ? 'bg-transparent' : 'bg-darkTeal'
      }`}
      style={{ height: 60 }}
    >
      <Text
        className={darkText ? 'text-ink-900 tracking-widest' : 'text-white tracking-widest'}
        style={{ fontFamily: 'Trajan', fontSize: 18, letterSpacing: 2 }}
      >
        OWM
      </Text>
    </View>
  );
}
