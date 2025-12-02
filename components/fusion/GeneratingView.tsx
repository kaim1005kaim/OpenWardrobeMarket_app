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
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
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
        style={{
          fontFamily: 'Trajan',
          fontSize: 28,
          letterSpacing: 4,
          fontWeight: '400',
          color: '#1A1A1A',
          textAlign: 'center',
          marginBottom: 12,
        }}
      >
        GENERATING
      </Text>

      <Text style={{ color: '#777777', textAlign: 'center', fontSize: 16, lineHeight: 24, marginBottom: 48, maxWidth: 320 }}>
        4面のデザインを生成しています...{'\n'}
        これには40〜60秒かかります
      </Text>

      {/* Progress Bar */}
      <View style={{ width: '100%', maxWidth: 384, marginBottom: 32 }}>
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
      <View style={{ width: '100%', maxWidth: 320 }}>
        {[
          { icon: 'image', label: 'デザインコンセプトの構築' },
          { icon: 'adjust', label: '色とテクスチャの適用' },
          { icon: 'object-group', label: 'シルエットの形成' },
          { icon: 'check-circle', label: '最終調整' },
        ].map((step, index) => (
          <Animated.View
            key={index}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
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
            <Text style={{ color: '#777777', fontSize: 14, flex: 1 }}>{step.label}</Text>
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
      <View style={{ marginTop: 48, backgroundColor: '#F5F5F3', borderRadius: 16, padding: 16, width: '100%', maxWidth: 320 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <FontAwesome
            name="info-circle"
            size={16}
            color="#777777"
            style={{ marginRight: 8, marginTop: 2 }}
          />
          <Text style={{ color: '#777777', fontSize: 12, lineHeight: 20, flex: 1 }}>
            MAIN + FRONT/SIDE/BACKの4面を同時生成します
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
