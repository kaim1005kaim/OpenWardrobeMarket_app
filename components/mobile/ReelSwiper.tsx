import React, { useRef, useState } from 'react';
import {
  View,
  FlatList,
  Image,
  Dimensions,
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewToken,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { PublishedItem } from '@/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ReelSwiperProps {
  items: PublishedItem[];
}

export const ReelSwiper: React.FC<ReelSwiperProps> = ({ items }) => {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setCurrentIndex(viewableItems[0].index || 0);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderItem = ({ item, index }: { item: PublishedItem; index: number }) => (
    <View style={styles.reelContainer}>
      {/* Full-screen Image - Tappable */}
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => router.push(`/item/${item.id}`)}
        style={styles.imageContainer}
      >
        <Image
          source={{ uri: item.image_url }}
          style={styles.fullImage}
          resizeMode="cover"
        />
      </TouchableOpacity>

      {/* Gradient Overlays - Using View with opacity for compatibility */}
      <View style={styles.topGradient} />
      <View style={styles.bottomGradient} />

      {/* Top UI - Minimal */}
      <View style={styles.topUI}>
        <Text style={styles.studioTitle}>STUDIO</Text>
      </View>

      {/* Bottom UI - Info Only */}
      <View style={styles.bottomUI}>
        {/* Design Info */}
        <View style={styles.infoSection}>
          <Text style={styles.designTitle} numberOfLines={2}>
            {item.title || 'Untitled Design'}
          </Text>
          {item.metadata?.design_tokens?.tags && (
            <View style={styles.tagsContainer}>
              {item.metadata.design_tokens.tags.slice(0, 3).map((tag, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Swipe Indicator */}
        {index < items.length - 1 && (
          <View style={styles.swipeIndicator}>
            <FontAwesome name="angle-up" size={20} color="rgba(255,255,255,0.5)" />
            <Text style={styles.swipeText}>Swipe up</Text>
          </View>
        )}
      </View>

      {/* Progress Dots - Top Right */}
      <View style={styles.progressDots}>
        {items.slice(0, 5).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === index && styles.activeDot,
              i > index && styles.inactiveDot,
            ]}
          />
        ))}
        {items.length > 5 && (
          <Text style={styles.dotCount}>+{items.length - 5}</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  reelContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'relative',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 1,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 1,
  },
  topUI: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  studioTitle: {
    fontFamily: 'Trajan',
    fontSize: 16,
    letterSpacing: 4,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  bottomUI: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
    zIndex: 2,
  },
  infoSection: {
    marginBottom: 24,
  },
  designTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  tagText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  swipeIndicator: {
    alignItems: 'center',
    marginTop: 24,
    opacity: 0.6,
  },
  swipeText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 4,
    letterSpacing: 1,
  },
  progressDots: {
    position: 'absolute',
    top: 110,
    right: 16,
    alignItems: 'center',
    gap: 6,
    zIndex: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
    height: 12,
  },
  inactiveDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotCount: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  },
});
