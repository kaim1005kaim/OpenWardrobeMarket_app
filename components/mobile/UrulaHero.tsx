import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const URULA_SIZE = SCREEN_WIDTH * 0.6;

interface UrulaHeroProps {
  size?: number;
}

export function UrulaHero({ size = URULA_SIZE }: UrulaHeroProps) {
  const breatheAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Breathing animation - gentle pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1.08,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [breatheAnim]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Placeholder for Urula metaballs - will be implemented with three.js or react-three-fiber */}
      <Animated.View
        style={[
          styles.placeholder,
          {
            transform: [{ scale: breatheAnim }],
          },
        ]}
      >
        {/* Outer glow ring */}
        <View style={styles.glowOuter} />

        {/* Middle glow ring */}
        <View style={styles.glowMiddle} />

        {/* Core blob */}
        <View style={styles.core} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowOuter: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 9999,
    backgroundColor: 'rgba(91, 125, 177, 0.15)',
  },
  glowMiddle: {
    position: 'absolute',
    width: '80%',
    height: '80%',
    borderRadius: 9999,
    backgroundColor: 'rgba(91, 125, 177, 0.25)',
  },
  core: {
    position: 'absolute',
    width: '60%',
    height: '60%',
    borderRadius: 9999,
    backgroundColor: '#5B7DB1',
    shadowColor: '#5B7DB1',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
});
