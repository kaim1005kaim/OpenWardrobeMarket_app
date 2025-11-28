import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  message?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({
  size = 'large',
  message,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const containerClasses = fullScreen
    ? 'flex-1 items-center justify-center bg-offwhite'
    : 'items-center justify-center p-8';

  return (
    <View className={containerClasses}>
      <ActivityIndicator size={size} color="#111111" />
      {message && (
        <Text className="mt-4 text-ink-700 text-center">{message}</Text>
      )}
    </View>
  );
}
