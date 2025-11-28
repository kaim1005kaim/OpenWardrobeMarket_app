import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export function GeneratingView() {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Progress bar animation (0 to 1 over 40 seconds)
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 40000,
      useNativeDriver: false,
    }).start();

    // Pulse animation for icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [progressAnim, pulseAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View className="flex-1 items-center justify-center px-6">
      {/* Generating Icon */}
      <Animated.View
        style={{
          marginBottom: 32,
          transform: [{ scale: pulseAnim }],
        }}
      >
        <View style={styles.generateIcon}>
          <FontAwesome name="paint-brush" size={48} color="#FAFAF7" />
        </View>
      </Animated.View>

      {/* Status Text */}
      <Text
        className="text-ink-900 text-center mb-3"
        style={{
          fontFamily: 'Trajan',
          fontSize: 28,
          letterSpacing: 4,
          fontWeight: '400',
        }}
      >
        GENERATING
      </Text>

      <Text className="text-ink-600 text-center text-base leading-6 mb-12 max-w-xs">
        Imagen 3.0がデザインを生成しています...{'\n'}
        これには40〜60秒かかります
      </Text>

      {/* Progress Bar */}
      <View className="w-full max-w-sm mb-8">
        <View
          style={styles.progressTrack}
        >
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressWidth,
              },
            ]}
          />
        </View>
      </View>

      {/* Generation Steps */}
      <View className="w-full max-w-xs">
        {[
          { icon: 'image', label: 'デザインコンセプトの構築' },
          { icon: 'adjust', label: '色とテクスチャの適用' },
          { icon: 'object-group', label: 'シルエットの形成' },
          { icon: 'check-circle', label: '最終調整' },
        ].map((step, index) => (
          <Animated.View
            key={index}
            className="flex-row items-center py-3"
            style={{
              opacity: progressAnim.interpolate({
                inputRange: [index * 0.25, (index + 1) * 0.25],
                outputRange: [0.3, 1],
                extrapolate: 'clamp',
              }),
            }}
          >
            <FontAwesome
              name={step.icon as any}
              size={18}
              color="#5B7DB1"
              style={{ marginRight: 12, width: 20 }}
            />
            <Text className="text-ink-600 text-sm flex-1">{step.label}</Text>
            <Animated.View
              style={{
                opacity: progressAnim.interpolate({
                  inputRange: [index * 0.25, (index + 1) * 0.25],
                  outputRange: [0, 1],
                  extrapolate: 'clamp',
                }),
              }}
            >
              <FontAwesome name="check" size={16} color="#5B7DB1" />
            </Animated.View>
          </Animated.View>
        ))}
      </View>

      {/* Info */}
      <View className="mt-12 bg-ink-50 rounded-2xl p-4 w-full max-w-xs">
        <View className="flex-row items-start">
          <FontAwesome
            name="info-circle"
            size={16}
            color="#777777"
            style={{ marginRight: 8, marginTop: 2 }}
          />
          <Text className="text-ink-600 text-xs leading-5 flex-1">
            生成後、自動的にSIDEとBACKビューも作成されます
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  generateIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#5B7DB1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#5B7DB1',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#EAEAEA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#5B7DB1',
    borderRadius: 4,
  },
});
