import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 56) / 2; // 2 columns with gaps (narrower cards)
const IMAGE_HEIGHT = CARD_WIDTH * 1.4; // Vertical aspect ratio

interface GalleryCardProps {
  imageUrl: string;
  title?: string;
  tags?: string[];
  userName?: string;
  userAvatar?: string;
  createdAt?: string;
  metadata?: {
    silhouette?: string;
    materials?: string[];
    palette?: any[];
  };
  likes?: number;
  isLiked?: boolean;
  onPress: () => void;
  onLikePress?: (e: any) => void;
  showLikeButton?: boolean;
}

export function GalleryCard({
  imageUrl,
  title,
  userName,
  likes,
  isLiked = false,
  onPress,
  onLikePress,
  showLikeButton = false,
}: GalleryCardProps) {
  // Log image URL for debugging
  if (!imageUrl) {
    console.warn('[GalleryCard] Missing imageUrl for item:', { title, userName });
  }

  // Use placeholder if no image URL
  const displayImageUrl = imageUrl || 'https://via.placeholder.com/400x560/1A1A1A/FFFFFF?text=No+Image';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.95}
    >
      {/* Main Image - Optimized with expo-image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: displayImageUrl }}
          style={styles.image}
          contentFit="cover"
          placeholder="L6Pj42%L~q%2"
          placeholderContentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          recyclingKey={imageUrl}
          onError={(error) => {
            console.error('[GalleryCard] Image load error:', {
              url: displayImageUrl,
              originalUrl: imageUrl,
              title,
              error,
            });
          }}
        />
      </View>

      {/* Minimal Info Tab */}
      <View style={styles.infoTab}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title || 'UNTITLED'}
          </Text>
          {/* Like Button and Count */}
          {showLikeButton && onLikePress && (
            <TouchableOpacity
              style={styles.likeButton}
              onPress={(e) => {
                e.stopPropagation();
                onLikePress(e);
              }}
              activeOpacity={0.7}
            >
              <FontAwesome
                name={isLiked ? "heart" : "heart-o"}
                size={10}
                color="#666666"
              />
              {(typeof likes === 'number' && likes > 0) && (
                <Text style={styles.likeText}>{likes}</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.creator} numberOfLines={1}>
          {userName || 'Anonymous'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    marginBottom: 16,
    backgroundColor: 'transparent',
    borderRadius: 0,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: IMAGE_HEIGHT,
  },
  image: {
    width: '100%',
    height: IMAGE_HEIGHT,
    backgroundColor: '#000000',
  },
  infoTab: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: {
    fontFamily: 'System',
    fontSize: 10,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: 0.2,
    flex: 1,
    marginRight: 8,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666666',
  },
  creator: {
    fontFamily: 'System',
    fontSize: 8,
    color: '#666666',
    letterSpacing: 0.1,
  },
});
