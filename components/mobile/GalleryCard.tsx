import React from 'react';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

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
  onPress: () => void;
}

export function GalleryCard({
  imageUrl,
  title,
  tags,
  userName,
  userAvatar,
  createdAt,
  metadata,
  onPress,
}: GalleryCardProps) {
  // Log image URL for debugging
  if (!imageUrl) {
    console.warn('[GalleryCard] Missing imageUrl for item:', { title, userName });
  }

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\//g, '.');
  };

  // Get first 3 colors from palette
  const colors = metadata?.palette?.slice(0, 3) || [];
  const materials = metadata?.materials?.slice(0, 2).join(', ') || '';

  // Use placeholder if no image URL
  const displayImageUrl = imageUrl || 'https://via.placeholder.com/400x560/1A1A1A/FFFFFF?text=No+Image';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.95}
    >
      {/* Main Image */}
      <Image
        source={{ uri: displayImageUrl }}
        style={styles.image}
        resizeMode="cover"
        onError={(error) => {
          console.error('[GalleryCard] Image load error:', {
            url: displayImageUrl,
            originalUrl: imageUrl,
            title,
            error: error.nativeEvent.error,
          });
        }}
        onLoadStart={() => {
          console.log('[GalleryCard] Loading image:', displayImageUrl);
        }}
      />

      {/* Bottom Metadata Bar */}
      <View style={styles.metadataBar}>
        {/* Left: Title & Tags */}
        <View style={styles.leftSection}>
          <Text style={styles.title} numberOfLines={1}>
            {title || 'UNTITLED'}
          </Text>
          {tags && tags.length > 0 && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {tags.slice(0, 2).map(tag => `#${tag}`).join(' ')}
            </Text>
          )}
        </View>

        {/* Center: User Avatar */}
        <View style={styles.centerSection}>
          {userAvatar ? (
            <Image
              source={{ uri: userAvatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {userName?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </View>

        {/* Right: Metadata */}
        <View style={styles.rightSection}>
          {metadata?.silhouette && (
            <Text style={styles.metaText}>{metadata.silhouette}</Text>
          )}
          {materials && (
            <Text style={styles.metaSubtext} numberOfLines={1}>
              {materials}
            </Text>
          )}
          {createdAt && (
            <Text style={styles.metaSubtext}>
              {formatDate(createdAt)}
            </Text>
          )}
        </View>
      </View>

      {/* Color Palette Strip (Optional) */}
      {colors.length > 0 && (
        <View style={styles.colorStrip}>
          {colors.map((color, index) => (
            <View
              key={index}
              style={[
                styles.colorBlock,
                { backgroundColor: color.hex || '#CCCCCC' },
              ]}
            />
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    marginBottom: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: IMAGE_HEIGHT,
    backgroundColor: '#000000',
  },
  metadataBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#1A1A1A',
  },
  leftSection: {
    flex: 1,
    marginRight: 6,
  },
  title: {
    fontFamily: 'Trajan',
    fontSize: 8,
    letterSpacing: 1,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 7,
    color: '#999999',
    letterSpacing: 0.3,
  },
  centerSection: {
    marginHorizontal: 6,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#CC0000',
  },
  avatarPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#CC0000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Trajan',
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
    marginLeft: 6,
  },
  metaText: {
    fontFamily: 'Trajan',
    fontSize: 7,
    letterSpacing: 0.5,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  metaSubtext: {
    fontSize: 6,
    color: '#999999',
    letterSpacing: 0.3,
    marginBottom: 1,
  },
  colorStrip: {
    flexDirection: 'row',
    height: 3,
  },
  colorBlock: {
    flex: 1,
    height: '100%',
  },
});
