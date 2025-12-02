import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Image, Animated, StyleSheet, TouchableOpacity, Dimensions, PanResponder } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { FusionSpec, TriptychUrls, QuadtychUrls } from '@/types/fusion';

interface FusionResultViewProps {
  imageUrl: string;
  fusionSpec: FusionSpec | null;
  triptychUrls?: TriptychUrls | null;
  quadtychUrls?: QuadtychUrls | null; // v4.0: Quadtych support
  onClose?: () => void;
  onSaveToWardrobe?: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_WIDTH = SCREEN_WIDTH - 48; // Padding: 24px on each side

export function FusionResultView({ imageUrl, fusionSpec, triptychUrls, quadtychUrls, onClose, onSaveToWardrobe }: FusionResultViewProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // v4.0: View mode state - 'main' for hero view, 'spec' for 3-view technical specs
  const [viewMode, setViewMode] = useState<'main' | 'spec'>('main');
  const [activeSpecView, setActiveSpecView] = useState<'front' | 'side' | 'back'>('front');
  const [imageAspectRatio, setImageAspectRatio] = useState<number | undefined>(undefined);
  const [previousAspectRatio, setPreviousAspectRatio] = useState<number | undefined>(undefined);

  const hasQuadtych = !!quadtychUrls;
  const hasTriptych = !!triptychUrls;

  // v4.0: Determine current image URL based on view mode
  const currentImageUrl = hasQuadtych && quadtychUrls
    ? (viewMode === 'main' ? quadtychUrls.main : quadtychUrls[activeSpecView])
    : (hasTriptych && triptychUrls
      ? triptychUrls[activeSpecView]
      : imageUrl);

  // Swipe gesture handler for FRONT/SIDE/BACK navigation
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => viewMode === 'spec',
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only activate if horizontal swipe
        return viewMode === 'spec' && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (viewMode !== 'spec') return;

        const SWIPE_THRESHOLD = 50;
        const specViews: Array<'front' | 'side' | 'back'> = ['front', 'side', 'back'];
        const currentIndex = specViews.indexOf(activeSpecView);

        // Swipe left (next view)
        if (gestureState.dx < -SWIPE_THRESHOLD && currentIndex < specViews.length - 1) {
          setActiveSpecView(specViews[currentIndex + 1]);
        }
        // Swipe right (previous view)
        else if (gestureState.dx > SWIPE_THRESHOLD && currentIndex > 0) {
          setActiveSpecView(specViews[currentIndex - 1]);
        }
      },
    })
  ).current;

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
  }, [viewMode, activeSpecView]);

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
      style={{ flex: 1, backgroundColor: '#F2F0E9' }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
        {/* v4.0: Quadtych View Mode Selector (MAIN vs SPEC MODE) - Minimal icon buttons with labels */}
        {hasQuadtych && (
          <Animated.View
            style={{ opacity: fadeAnim, marginBottom: 16, alignItems: 'center' }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
              {/* MAIN / PORTRAIT button */}
              <View style={{ alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={() => setViewMode('main')}
                  activeOpacity={0.7}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: viewMode === 'main' ? '#1a3d3d' : 'transparent',
                    borderWidth: 1.5,
                    borderColor: viewMode === 'main' ? '#1a3d3d' : 'rgba(26, 61, 61, 0.3)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 6,
                  }}
                >
                  <FontAwesome
                    name="camera"
                    size={20}
                    color={viewMode === 'main' ? '#FAFAF7' : 'rgba(119, 119, 119, 0.8)'}
                  />
                </TouchableOpacity>
                <Text
                  style={{
                    fontFamily: 'Trajan',
                    fontSize: 9,
                    letterSpacing: 1,
                    color: viewMode === 'main' ? '#1a3d3d' : 'rgba(119, 119, 119, 0.6)',
                  }}
                >
                  PORTRAIT
                </Text>
              </View>

              {/* SPEC MODE button */}
              <View style={{ alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={() => setViewMode('spec')}
                  activeOpacity={0.7}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: viewMode === 'spec' ? '#1a3d3d' : 'transparent',
                    borderWidth: 1.5,
                    borderColor: viewMode === 'spec' ? '#1a3d3d' : 'rgba(26, 61, 61, 0.3)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 6,
                  }}
                >
                  <FontAwesome
                    name="th-large"
                    size={18}
                    color={viewMode === 'spec' ? '#FAFAF7' : 'rgba(119, 119, 119, 0.8)'}
                  />
                </TouchableOpacity>
                <Text
                  style={{
                    fontFamily: 'Trajan',
                    fontSize: 9,
                    letterSpacing: 1,
                    color: viewMode === 'spec' ? '#1a3d3d' : 'rgba(119, 119, 119, 0.6)',
                  }}
                >
                  SPEC
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* v4.0: Spec View Selector (FRONT/SIDE/BACK) or EDITORIAL label - Always reserve space */}
        {hasQuadtych && (
          <Animated.View
            style={{
              opacity: fadeAnim,
              marginBottom: 24,
              height: 36, // Fixed height to prevent layout shift
            }}
          >
            {viewMode === 'spec' ? (
              // SPEC MODE: Show interactive FRONT/SIDE/BACK tabs
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 32 }}>
                <TouchableOpacity
                  onPress={() => setActiveSpecView('front')}
                  activeOpacity={0.7}
                  style={{
                    paddingBottom: 8,
                    borderBottomWidth: activeSpecView === 'front' ? 2 : 0,
                    borderBottomColor: '#1a3d3d',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'Trajan',
                      fontSize: 12,
                      letterSpacing: 2,
                      color: activeSpecView === 'front' ? '#1a3d3d' : 'rgba(119, 119, 119, 0.6)',
                    }}
                  >
                    FRONT
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setActiveSpecView('side')}
                  activeOpacity={0.7}
                  style={{
                    paddingBottom: 8,
                    borderBottomWidth: activeSpecView === 'side' ? 2 : 0,
                    borderBottomColor: '#1a3d3d',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'Trajan',
                      fontSize: 12,
                      letterSpacing: 2,
                      color: activeSpecView === 'side' ? '#1a3d3d' : 'rgba(119, 119, 119, 0.6)',
                    }}
                  >
                    SIDE
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setActiveSpecView('back')}
                  activeOpacity={0.7}
                  style={{
                    paddingBottom: 8,
                    borderBottomWidth: activeSpecView === 'back' ? 2 : 0,
                    borderBottomColor: '#1a3d3d',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'Trajan',
                      fontSize: 12,
                      letterSpacing: 2,
                      color: activeSpecView === 'back' ? '#1a3d3d' : 'rgba(119, 119, 119, 0.6)',
                    }}
                  >
                    BACK
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              // MAIN MODE: Show EDITORIAL label
              <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                <View
                  style={{
                    paddingBottom: 8,
                    borderBottomWidth: 2,
                    borderBottomColor: '#1a3d3d',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'Trajan',
                      fontSize: 12,
                      letterSpacing: 2,
                      color: '#1a3d3d',
                    }}
                  >
                    EDITORIAL
                  </Text>
                </View>
              </View>
            )}
          </Animated.View>
        )}

        {/* v3.0: Triptych View Selector (deprecated, fallback) */}
        {!hasQuadtych && hasTriptych && (
          <Animated.View
            style={{ opacity: fadeAnim, marginBottom: 24 }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 32 }}>
              <TouchableOpacity
                onPress={() => setActiveSpecView('front')}
                activeOpacity={0.7}
                style={{
                  paddingBottom: 8,
                  borderBottomWidth: activeSpecView === 'front' ? 2 : 0,
                  borderBottomColor: '#1a3d3d',
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Trajan',
                    fontSize: 12,
                    letterSpacing: 2,
                    color: activeSpecView === 'front' ? '#1a3d3d' : 'rgba(119, 119, 119, 0.6)',
                  }}
                >
                  FRONT
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveSpecView('side')}
                activeOpacity={0.7}
                style={{
                  paddingBottom: 8,
                  borderBottomWidth: activeSpecView === 'side' ? 2 : 0,
                  borderBottomColor: '#1a3d3d',
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Trajan',
                    fontSize: 12,
                    letterSpacing: 2,
                    color: activeSpecView === 'side' ? '#1a3d3d' : 'rgba(119, 119, 119, 0.6)',
                  }}
                >
                  SIDE
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveSpecView('back')}
                activeOpacity={0.7}
                style={{
                  paddingBottom: 8,
                  borderBottomWidth: activeSpecView === 'back' ? 2 : 0,
                  borderBottomColor: '#1a3d3d',
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Trajan',
                    fontSize: 12,
                    letterSpacing: 2,
                    color: activeSpecView === 'back' ? '#1a3d3d' : 'rgba(119, 119, 119, 0.6)',
                  }}
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
            alignItems: 'center',
            marginBottom: 32, // Increased gap between image and DESIGN SPECIFICATIONS
          }}
          {...panResponder.panHandlers}
        >
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: currentImageUrl }}
              style={styles.generatedImage}
              resizeMode="cover"
              onLoad={handleImageLoad}
            />
          </View>
        </Animated.View>

        {/* AI Design Note (v2.0: Display fusion_concept) - Paper Texture */}
        {fusionSpec?.fusion_concept && (
          <Animated.View
            style={[
              styles.contentContainer,
              {
                opacity: fadeAnim,
                marginBottom: 24,
              }
            ]}
          >
            <View style={{ borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#E5E5E5', backgroundColor: '#F8F7F4' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <FontAwesome name="pencil" size={18} color="#5B7DB1" />
                <Text
                  style={{
                    fontFamily: 'Trajan',
                    fontSize: 14,
                    letterSpacing: 2,
                    color: '#1A1A1A',
                    marginLeft: 8,
                  }}
                >
                  AI DESIGN NOTE
                </Text>
              </View>

              <Text style={{ color: '#777777', fontSize: 16, lineHeight: 24, fontStyle: 'italic', marginBottom: 16 }}>
                "{fusionSpec.fusion_concept}"
              </Text>

              {/* Emotional Keywords */}
              {fusionSpec.emotional_keywords && fusionSpec.emotional_keywords.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {fusionSpec.emotional_keywords.map((keyword, index) => (
                    <View
                      key={index}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        backgroundColor: 'rgba(26, 61, 61, 0.1)',
                        borderRadius: 9999,
                        borderWidth: 1,
                        borderColor: 'rgba(26, 61, 61, 0.2)',
                      }}
                    >
                      <Text style={{ color: '#1a3d3d', fontSize: 12, fontWeight: '600' }}>
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
            style={[
              styles.contentContainer,
              {
                opacity: fadeAnim,
                marginBottom: 24,
              }
            ]}
          >
            <View style={{ borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#E5E5E5', backgroundColor: '#F8F7F4' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <FontAwesome name="lightbulb-o" size={18} color="#5B7DB1" />
                <Text
                  style={{
                    fontFamily: 'Trajan',
                    fontSize: 14,
                    letterSpacing: 1.5,
                    color: '#1A1A1A',
                    marginLeft: 8,
                  }}
                >
                  FUSION STRATEGY
                </Text>
              </View>

              <Text style={{ color: '#777777', fontSize: 14, lineHeight: 20 }}>
                {fusionSpec.dominant_trait_analysis}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Design Specifications */}
        {fusionSpec && (
          <Animated.View
            style={[
              styles.contentContainer,
              {
                opacity: fadeAnim,
                marginBottom: 24,
              }
            ]}
          >
            <View style={{ borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#E5E5E5', backgroundColor: '#F8F7F4' }}>
              <Text
                style={{
                  fontFamily: 'Trajan',
                  fontSize: 14,
                  letterSpacing: 1.5,
                  color: '#1A1A1A',
                  marginBottom: 16,
                }}
              >
                DESIGN SPECIFICATIONS
              </Text>

              {/* Silhouette */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: '#777777', fontSize: 12, textTransform: 'uppercase', marginBottom: 4, fontWeight: '600' }}>
                  Silhouette
                </Text>
                <Text style={{ color: '#2A2A2A', fontSize: 16, textTransform: 'capitalize' }}>
                  {fusionSpec.silhouette}
                </Text>
              </View>

              {/* Color Palette */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: '#777777', fontSize: 12, textTransform: 'uppercase', marginBottom: 8, fontWeight: '600' }}>
                  Color Palette
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {fusionSpec.palette.map((color, index) => (
                    <View key={index} style={{ flexDirection: 'row', alignItems: 'center' }}>
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
                      <Text style={{ color: '#3A3A3A', fontSize: 14 }}>
                        {color.name} ({Math.round(color.weight * 100)}%)
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Materials */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: '#777777', fontSize: 12, textTransform: 'uppercase', marginBottom: 4, fontWeight: '600' }}>
                  Materials
                </Text>
                <Text style={{ color: '#2A2A2A', fontSize: 14, lineHeight: 20 }}>
                  {fusionSpec.materials.join(', ')}
                </Text>
              </View>

              {/* Design Details */}
              {fusionSpec.details && fusionSpec.details.length > 0 && (
                <View>
                  <Text style={{ color: '#777777', fontSize: 12, textTransform: 'uppercase', marginBottom: 8, fontWeight: '600' }}>
                    Construction Details
                  </Text>
                  {fusionSpec.details.map((detail, index) => (
                    <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 }}>
                      <Text style={{ color: '#1a3d3d', marginRight: 8 }}>•</Text>
                      <Text style={{ color: '#3A3A3A', fontSize: 14, flex: 1, lineHeight: 20 }}>
                        {detail}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* Action Buttons - Outline Style */}
        <View style={[styles.contentContainer, { gap: 16 }]}>
          <TouchableOpacity
            style={{
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: 'center',
              backgroundColor: '#2D7A4F',
            }}
            activeOpacity={0.8}
            onPress={onSaveToWardrobe}
          >
            <Text
              style={{
                fontFamily: 'Trajan',
                fontSize: 14,
                letterSpacing: 2,
                color: '#FAFAF7',
              }}
            >
              SAVE TO WARDROBE
            </Text>
          </TouchableOpacity>

          {onClose && (
            <TouchableOpacity
              style={{
                borderWidth: 1,
                borderColor: '#E5E5E5',
                borderRadius: 16,
                paddingVertical: 16,
                alignItems: 'center',
                backgroundColor: 'transparent',
              }}
              activeOpacity={0.8}
              onPress={onClose}
            >
              <Text
                style={{
                  fontFamily: 'Trajan',
                  fontSize: 14,
                  letterSpacing: 2,
                  color: '#777777',
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
    width: '90%',
    maxWidth: 360,
    height: 600,
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
    height: '100%',
  },
  contentContainer: {
    width: '90%',
    maxWidth: 360,
    alignSelf: 'center',
  },
});
