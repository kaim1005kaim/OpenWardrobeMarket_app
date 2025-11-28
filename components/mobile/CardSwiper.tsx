import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Animated,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
} from 'react-native';
import { Image } from 'expo-image';
import { PublishedItem } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = 300;
const CARD_HEIGHT = 490;
const SWIPE_THRESHOLD = 50;

interface CardSwiperProps {
  items: PublishedItem[];
  onCardPress?: (item: PublishedItem) => void;
}

export function CardSwiper({ items, onCardPress }: CardSwiperProps) {
  // Limit to first 5 items
  const displayItems = items.slice(0, 5);
  const itemCount = displayItems.length;

  // Start at item count to allow seamless previous item display
  const [currentIndex, setCurrentIndex] = useState(itemCount);
  const animatedValue = useRef(new Animated.Value(itemCount)).current;
  const autoAdvanceInterval = useRef<NodeJS.Timeout | null>(null);

  const startAutoAdvance = () => {
    if (autoAdvanceInterval.current) {
      clearInterval(autoAdvanceInterval.current);
    }
    autoAdvanceInterval.current = setInterval(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 6000);
  };

  const stopAutoAdvance = () => {
    if (autoAdvanceInterval.current) {
      clearInterval(autoAdvanceInterval.current);
      autoAdvanceInterval.current = null;
    }
  };

  useEffect(() => {
    if (itemCount === 0) return;

    startAutoAdvance();

    return () => {
      stopAutoAdvance();
    };
  }, [itemCount]);

  useEffect(() => {
    // Animate the transition
    Animated.spring(animatedValue, {
      toValue: currentIndex,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start(() => {
      // Reset to the equivalent position without animation when reaching boundaries
      // This creates an infinite loop effect
      if (currentIndex >= itemCount * 2) {
        const newIndex = itemCount;
        setCurrentIndex(newIndex);
        animatedValue.setValue(newIndex);
      } else if (currentIndex <= 0) {
        const newIndex = itemCount;
        setCurrentIndex(newIndex);
        animatedValue.setValue(newIndex);
      }
    });
  }, [currentIndex, animatedValue, itemCount]);

  // PanResponder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes (more than vertical)
        const isHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
        const isSignificant = Math.abs(gestureState.dx) > 10;
        return isHorizontal && isSignificant;
      },
      onPanResponderGrant: () => {
        stopAutoAdvance();
      },
      onPanResponderMove: (_, gestureState) => {
        // Update animated value based on gesture
        const newValue = currentIndex - gestureState.dx / SCREEN_WIDTH;
        animatedValue.setValue(newValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > SWIPE_THRESHOLD) {
          // Swipe detected
          if (gestureState.dx > 0) {
            // Swipe right - go to next
            setCurrentIndex((prev) => prev + 1);
          } else {
            // Swipe left - go to previous
            setCurrentIndex((prev) => prev - 1);
          }
        } else {
          // Snap back to current
          Animated.spring(animatedValue, {
            toValue: currentIndex,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start();
        }
        // Restart auto-advance after swipe
        startAutoAdvance();
      },
      onPanResponderTerminate: () => {
        // Snap back to current if gesture is cancelled
        Animated.spring(animatedValue, {
          toValue: currentIndex,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }).start();
        startAutoAdvance();
      },
    })
  ).current;

  if (itemCount === 0) {
    return null;
  }

  const renderCard = (item: PublishedItem, virtualIndex: number) => {
    const translateX = animatedValue.interpolate({
      inputRange: [virtualIndex - 1, virtualIndex, virtualIndex + 1],
      outputRange: [
        -SCREEN_WIDTH / 2,
        0,
        SCREEN_WIDTH / 2,
      ],
      extrapolate: 'clamp',
    });

    const scale = animatedValue.interpolate({
      inputRange: [virtualIndex - 1, virtualIndex, virtualIndex + 1],
      outputRange: [0.85, 1, 0.85],
      extrapolate: 'clamp',
    });

    const rotateY = animatedValue.interpolate({
      inputRange: [virtualIndex - 1, virtualIndex, virtualIndex + 1],
      outputRange: ['25deg', '0deg', '-25deg'],
      extrapolate: 'clamp',
    });

    const opacity = animatedValue.interpolate({
      inputRange: [virtualIndex - 1, virtualIndex, virtualIndex + 1],
      outputRange: [0.5, 1, 0.5],
      extrapolate: 'clamp',
    });

    const position = virtualIndex - currentIndex;
    const isVisible = Math.abs(position) <= 1;

    if (!isVisible) {
      return null;
    }

    return (
      <Animated.View
        key={`${item.id}-${virtualIndex}`}
        style={[
          styles.cardContainer,
          {
            transform: [
              { translateX },
              { scale },
              { perspective: 1000 },
              { rotateY },
            ],
            opacity,
            zIndex: position === 0 ? 2 : 1,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => onCardPress?.(item)}
          style={styles.card}
        >
          <Image
            source={{ uri: item.thumbnail_url || item.image_url }}
            style={styles.cardImage}
            contentFit="cover"
            transition={300}
          />
          <View style={styles.cardGradient} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Create triple array: [...items, ...items, ...items] for infinite loop
  // This allows smooth transition from end to beginning
  const tripleItems: Array<{ item: PublishedItem; virtualIndex: number }> = [];
  for (let set = 0; set < 3; set++) {
    displayItems.forEach((item, idx) => {
      tripleItems.push({
        item,
        virtualIndex: set * itemCount + idx,
      });
    });
  }

  // Get actual index for pagination dots
  const actualIndex = ((currentIndex % itemCount) + itemCount) % itemCount;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {tripleItems.map(({ item, virtualIndex }) => renderCard(item, virtualIndex))}

      {/* Pagination dots - only show for displayed items */}
      <View style={styles.pagination}>
        {displayItems.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              stopAutoAdvance();
              // Jump to the middle set + target index
              setCurrentIndex(itemCount + index);
              startAutoAdvance();
            }}
            style={[
              styles.dot,
              index === actualIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: CARD_HEIGHT + 80,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cardContainer: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1a3d3d',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'transparent',
  },
  pagination: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 24,
  },
});
