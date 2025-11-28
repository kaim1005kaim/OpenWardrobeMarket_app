import React from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated';
}

export function Card({
  variant = 'default',
  className,
  children,
  ...props
}: CardProps) {
  const baseClasses = 'bg-offwhite rounded-2xl overflow-hidden';
  const variantClasses = variant === 'elevated' ? 'shadow-lg' : '';

  return (
    <View className={`${baseClasses} ${variantClasses} ${className || ''}`} {...props}>
      {children}
    </View>
  );
}
