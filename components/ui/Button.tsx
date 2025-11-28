import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
} from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const baseClasses = 'rounded-xl items-center justify-center';

  const variantClasses = {
    primary: 'bg-ink-900 active:opacity-80',
    secondary: 'bg-accent active:opacity-80',
    outline: 'border-2 border-ink-900 bg-transparent active:bg-ink-900/5',
  };

  const sizeClasses = {
    sm: 'px-4 py-2',
    md: 'px-6 py-3',
    lg: 'px-8 py-4',
  };

  const textVariantClasses = {
    primary: 'text-offwhite',
    secondary: 'text-offwhite',
    outline: 'text-ink-900',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const disabledClasses = disabled || loading ? 'opacity-50' : '';
  const widthClasses = fullWidth ? 'w-full' : '';

  return (
    <TouchableOpacity
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${widthClasses} ${className || ''}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' ? '#111111' : '#F4F4F0'}
        />
      ) : (
        <Text
          className={`font-semibold ${textVariantClasses[variant]} ${textSizeClasses[size]}`}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
