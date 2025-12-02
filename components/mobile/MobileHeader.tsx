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
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        height: 60,
        backgroundColor: transparent ? 'transparent' : '#1a3d3d',
      }}
    >
      <Text
        style={{
          color: darkText ? '#1A1A1A' : '#FFFFFF',
          fontFamily: 'Trajan',
          fontSize: 18,
          letterSpacing: 2,
        }}
      >
        OWM
      </Text>
    </View>
  );
}
