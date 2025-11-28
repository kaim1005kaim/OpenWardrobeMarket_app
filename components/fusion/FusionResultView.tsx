import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Image, Animated, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { FusionSpec, TriptychUrls } from '@/types/fusion';

interface FusionResultViewProps {
  imageUrl: string;
  fusionSpec: FusionSpec | null;
  triptychUrls?: TriptychUrls | null;
  onClose?: () => void;
  onSaveToWardrobe?: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_WIDTH = SCREEN_WIDTH - 48; // Padding: 24px on each side

export function FusionResultView({ imageUrl, fusionSpec, triptychUrls, onClose, onSaveToWardrobe }: FusionResultViewProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const [activeView, setActiveView] = useState<'front' | 'side' | 'back'>('front');
  const [imageAspectRatio, setImageAspectRatio] = useState<number | undefined>(undefined);
  const [previousAspectRatio, setPreviousAspectRatio] = useState<number | undefined>(undefined);

  const hasTriptych = !!triptychUrls;
  const currentImageUrl = hasTriptych && triptychUrls
    ? triptychUrls[activeView]
    : imageUrl;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  // When switching views, keep the previous aspect ratio until new image loads
  useEffect(() => {
    if (imageAspectRatio) {
      setPreviousAspectRatio(imageAspectRatio);
    }
  }, [activeView]);

  const handleImageLoad = (event: any) => {
    const { width, height } = event.nativeEvent.source;
    if (width && height) {
      const aspectRatio = width / height;
      setImageAspectRatio(aspectRatio);
      console.log('[FusionResultView] Image loaded:', { width, height, aspectRatio });
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <View className="px-6 pt-6">
        {/* Triptych View Selector (if triptych available) */}
        {hasTriptych && (
          <Animated.View
            style={{ opacity: fadeAnim }}
            className="mb-4"
          >
            <View className="flex-row justify-center gap-3">
              <TouchableOpacity
                className={`px-6 py-3 rounded-full ${activeView === 'front' ? 'bg-darkTeal' : 'bg-ink-200'}`}
                onPress={() => setActiveView('front')}
                activeOpacity={0.7}
              >
                <Text
                  className={activeView === 'front' ? 'text-offwhite' : 'text-ink-600'}
                  style={{ fontFamily: 'Trajan', fontSize: 14, letterSpacing: 1.5 }}
                >
                  FRONT
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`px-6 py-3 rounded-full ${activeView === 'side' ? 'bg-darkTeal' : 'bg-ink-200'}`}
                onPress={() => setActiveView('side')}
                activeOpacity={0.7}
              >
                <Text
                  className={activeView === 'side' ? 'text-offwhite' : 'text-ink-600'}
                  style={{ fontFamily: 'Trajan', fontSize: 14, letterSpacing: 1.5 }}
                >
                  SIDE
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`px-6 py-3 rounded-full ${activeView === 'back' ? 'bg-darkTeal' : 'bg-ink-200'}`}
                onPress={() => setActiveView('back')}
                activeOpacity={0.7}
              >
                <Text
                  className={activeView === 'back' ? 'text-offwhite' : 'text-ink-600'}
                  style={{ fontFamily: 'Trajan', fontSize: 14, letterSpacing: 1.5 }}
                >
                  BACK
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Generated Image */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }}
        >
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: currentImageUrl }}
              style={[
                styles.generatedImage,
                (imageAspectRatio || previousAspectRatio)
                  ? { aspectRatio: imageAspectRatio || previousAspectRatio }
                  : { height: 600 }
              ]}
              resizeMode="contain"
              onLoad={handleImageLoad}
            />
          </View>
        </Animated.View>

        {/* AI Design Note (v2.0: Display fusion_concept) */}
        {fusionSpec?.fusion_concept && (
          <Animated.View
            style={{
              opacity: fadeAnim,
            }}
            className="mb-6"
          >
            <View className="bg-ink-50 rounded-3xl p-6 border border-ink-200">
              <View className="flex-row items-center mb-4">
                <FontAwesome name="pencil" size={18} color="#5B7DB1" />
                <Text
                  className="text-ink-900 ml-2"
                  style={{
                    fontFamily: 'Trajan',
                    fontSize: 16,
                    letterSpacing: 2,
                  }}
                >
                  AI DESIGN NOTE
                </Text>
              </View>

              <Text className="text-ink-700 text-base leading-6 italic mb-4">
                "{fusionSpec.fusion_concept}"
              </Text>

              {/* Emotional Keywords */}
              {fusionSpec.emotional_keywords && fusionSpec.emotional_keywords.length > 0 && (
                <View className="flex-row flex-wrap gap-2 mt-2">
                  {fusionSpec.emotional_keywords.map((keyword, index) => (
                    <View
                      key={index}
                      className="px-3 py-1 bg-darkTeal/10 rounded-full border border-darkTeal/20"
                    >
                      <Text className="text-darkTeal text-xs font-semibold">
                        {keyword}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* Dominant Trait Analysis */}
        {fusionSpec?.dominant_trait_analysis && (
          <Animated.View
            style={{
              opacity: fadeAnim,
            }}
            className="mb-6"
          >
            <View className="bg-ink-50 rounded-3xl p-6 border border-ink-200">
              <View className="flex-row items-center mb-3">
                <FontAwesome name="lightbulb-o" size={18} color="#5B7DB1" />
                <Text
                  className="text-ink-900 ml-2"
                  style={{
                    fontFamily: 'Trajan',
                    fontSize: 14,
                    letterSpacing: 1.5,
                  }}
                >
                  FUSION STRATEGY
                </Text>
              </View>

              <Text className="text-ink-600 text-sm leading-5">
                {fusionSpec.dominant_trait_analysis}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Design Specifications */}
        {fusionSpec && (
          <Animated.View
            style={{
              opacity: fadeAnim,
            }}
            className="mb-6"
          >
            <View className="bg-ink-50 rounded-3xl p-6 border border-ink-200">
              <Text
                className="text-ink-900 mb-4"
                style={{
                  fontFamily: 'Trajan',
                  fontSize: 14,
                  letterSpacing: 1.5,
                }}
              >
                DESIGN SPECIFICATIONS
              </Text>

              {/* Silhouette */}
              <View className="mb-4">
                <Text className="text-ink-600 text-xs uppercase mb-1 font-semibold">
                  Silhouette
                </Text>
                <Text className="text-ink-800 text-base capitalize">
                  {fusionSpec.silhouette}
                </Text>
              </View>

              {/* Color Palette */}
              <View className="mb-4">
                <Text className="text-ink-600 text-xs uppercase mb-2 font-semibold">
                  Color Palette
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {fusionSpec.palette.map((color, index) => (
                    <View key={index} className="flex-row items-center">
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          backgroundColor: color.hex,
                          borderRadius: 12,
                          marginRight: 6,
                          borderWidth: 1,
                          borderColor: '#E5E5E5',
                        }}
                      />
                      <Text className="text-ink-700 text-sm">
                        {color.name} ({Math.round(color.weight * 100)}%)
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Materials */}
              <View className="mb-4">
                <Text className="text-ink-600 text-xs uppercase mb-1 font-semibold">
                  Materials
                </Text>
                <Text className="text-ink-800 text-sm leading-5">
                  {fusionSpec.materials.join(', ')}
                </Text>
              </View>

              {/* Design Details */}
              {fusionSpec.details && fusionSpec.details.length > 0 && (
                <View>
                  <Text className="text-ink-600 text-xs uppercase mb-2 font-semibold">
                    Construction Details
                  </Text>
                  {fusionSpec.details.map((detail, index) => (
                    <View key={index} className="flex-row items-start mb-1">
                      <Text className="text-darkTeal mr-2">•</Text>
                      <Text className="text-ink-700 text-sm flex-1 leading-5">
                        {detail}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* Action Buttons */}
        <View className="gap-3">
          <TouchableOpacity
            className="bg-darkTeal rounded-2xl py-4 items-center"
            activeOpacity={0.8}
            onPress={onSaveToWardrobe}
          >
            <Text
              className="text-offwhite"
              style={{
                fontFamily: 'Trajan',
                fontSize: 16,
                letterSpacing: 2,
              }}
            >
              SAVE TO WARDROBE
            </Text>
          </TouchableOpacity>

          {onClose && (
            <TouchableOpacity
              className="bg-ink-200 rounded-2xl py-4 items-center"
              activeOpacity={0.8}
              onPress={onClose}
            >
              <Text
                className="text-ink-700"
                style={{
                  fontFamily: 'Trajan',
                  fontSize: 16,
                  letterSpacing: 2,
                }}
              >
                CREATE NEW FUSION
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#F5F5F3',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  generatedImage: {
    width: '100%',
  },
});
