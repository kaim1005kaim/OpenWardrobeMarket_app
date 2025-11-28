import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { FusionSpec } from '@/types/fusion';

interface AnalyzingViewProps {
  imageA: string;
  imageB: string;
  fusionSpec?: FusionSpec | null;
}

// Placeholder keywords that appear during analysis (before API returns)
const PLACEHOLDER_KEYWORDS = [
  'structured', 'fluid', 'elegant', 'urban',
  'serene', 'dynamic', 'balanced', 'ethereal'
];

interface FloatingKeyword {
  text: string;
  x: number;
  y: number;
  delay: number;
  opacity: Animated.Value;
  translateY: Animated.Value;
}

export function AnalyzingView({ imageA, imageB, fusionSpec }: AnalyzingViewProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const centerGlowAnim = useRef(new Animated.Value(0)).current;

  const [keywords, setKeywords] = useState<FloatingKeyword[]>([]);
  const { width, height } = Dimensions.get('window');

  // Generate floating keywords
  useEffect(() => {
    const displayKeywords = fusionSpec?.emotional_keywords || PLACEHOLDER_KEYWORDS.slice(0, 6);

    const keywordObjects: FloatingKeyword[] = displayKeywords.map((text, index) => {
      const isLeftSide = index % 2 === 0;
      const baseX = isLeftSide ? width * 0.15 : width * 0.65;
      const randomX = baseX + (Math.random() - 0.5) * 60;
      const randomY = height * 0.25 + Math.random() * 100;

      return {
        text,
        x: randomX,
        y: randomY,
        delay: index * 300,
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(20),
      };
    });

    setKeywords(keywordObjects);
  }, [fusionSpec, width, height]);

  useEffect(() => {
    // Pulsing animation for the analyzing icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Center glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(centerGlowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(centerGlowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim, rotateAnim, centerGlowAnim]);

  // Animate keywords floating in
  useEffect(() => {
    keywords.forEach((keyword) => {
      Animated.sequence([
        Animated.delay(keyword.delay),
        Animated.parallel([
          Animated.timing(keyword.opacity, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(keyword.translateY, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });
  }, [keywords]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowScale = centerGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });

  const glowOpacity = centerGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View className="flex-1 items-center justify-center px-6" style={{ position: 'relative' }}>
      {/* Floating Keywords (v2.0: Emotional interpretation visualization) */}
      {keywords.map((keyword, index) => (
        <Animated.View
          key={`${keyword.text}-${index}`}
          style={{
            position: 'absolute',
            left: keyword.x,
            top: keyword.y,
            opacity: keyword.opacity,
            transform: [{ translateY: keyword.translateY }],
          }}
        >
          <View style={styles.keywordBubble}>
            <Text style={styles.keywordText}>{keyword.text}</Text>
          </View>
        </Animated.View>
      ))}

      {/* Image Previews */}
      <View className="flex-row items-center justify-center mb-12">
        <View style={styles.imagePreview}>
          <Animated.Image
            source={{ uri: imageA }}
            style={[
              styles.previewImage,
              {
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.2],
                  outputRange: [0.8, 1],
                }),
              },
            ]}
          />
        </View>

        {/* Center Fusion Icon with Glow Effect */}
        <Animated.View
          style={{
            marginHorizontal: 20,
            transform: [{ rotate }, { scale: glowScale }],
          }}
        >
          {/* Glow background */}
          <Animated.View
            style={[
              styles.glowCircle,
              {
                opacity: glowOpacity,
              },
            ]}
          />
          <FontAwesome name="magic" size={32} color="#5B7DB1" style={{ zIndex: 2 }} />
        </Animated.View>

        <View style={styles.imagePreview}>
          <Animated.Image
            source={{ uri: imageB }}
            style={[
              styles.previewImage,
              {
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.2],
                  outputRange: [0.8, 1],
                }),
              },
            ]}
          />
        </View>
      </View>

      {/* Status Text */}
      <Text
        className="text-ink-900 text-center mb-3"
        style={{
          fontFamily: 'Trajan',
          fontSize: 24,
          letterSpacing: 4,
          fontWeight: '400',
        }}
      >
        ANALYZING
      </Text>

      <Text className="text-ink-600 text-center text-base leading-6 max-w-xs">
        AIが情緒的な解釈を実行中...{'\n'}
        デザインの本質と感情を抽出しています
      </Text>

      {/* Fusion Concept Preview (if available) */}
      {fusionSpec?.fusion_concept && (
        <Animated.View
          className="mt-8 px-6 py-4 bg-darkTeal/10 rounded-2xl max-w-md"
          style={{
            opacity: pulseAnim.interpolate({
              inputRange: [1, 1.2],
              outputRange: [0.85, 1],
            }),
          }}
        >
          <Text className="text-darkTeal text-center text-sm italic leading-5">
            "{fusionSpec.fusion_concept}"
          </Text>
        </Animated.View>
      )}

      {/* Progress Steps */}
      <View className="mt-12 w-full max-w-xs">
        {[
          '感情とムードの読み取り',
          'デザイン哲学の抽出',
          'FUSION戦略の構築',
          '抽象化パラメータの生成',
        ].map((step, index) => (
          <Animated.View
            key={index}
            className="flex-row items-center py-3"
            style={{
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.2],
                outputRange: [0.5 + index * 0.1, 1],
              }),
            }}
          >
            <View
              className="w-2 h-2 rounded-full bg-darkTeal mr-3"
              style={{ opacity: 0.6 + index * 0.1 }}
            />
            <Text className="text-ink-600 text-sm flex-1">{step}</Text>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  imagePreview: {
    width: 100,
    height: 133,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F5F5F3',
    borderWidth: 2,
    borderColor: '#5B7DB1',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  keywordBubble: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(91, 125, 177, 0.15)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(91, 125, 177, 0.3)',
  },
  keywordText: {
    fontSize: 12,
    color: '#5B7DB1',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  glowCircle: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#5B7DB1',
    top: -16,
    left: -16,
    zIndex: 1,
  },
});
