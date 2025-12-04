import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIMILAR_CARD_WIDTH = SCREEN_WIDTH * 0.4; // 40% of screen width
const SIMILAR_IMAGE_HEIGHT = SIMILAR_CARD_WIDTH * 1.5; // 9:16 aspect ratio

interface SimilarItem {
  id: string;
  title?: string;
  image_url?: string;
  thumbnail_url?: string;
  tags?: string[];
  category?: string;
  metadata?: any;
}

interface SimilarItemsSectionProps {
  items: SimilarItem[];
  loading?: boolean;
}

export function SimilarItemsSection({ items, loading }: SimilarItemsSectionProps) {
  const router = useRouter();

  console.log('[SimilarItemsSection] Render - loading:', loading, 'items:', items?.length || 0);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>SIMILAR ITEMS</Text>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading similar items...</Text>
        </View>
      </View>
    );
  }

  if (!items || items.length === 0) {
    console.log('[SimilarItemsSection] No items to display');
    return null;
  }

  console.log('[SimilarItemsSection] Rendering', items.length, 'items');

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>SIMILAR ITEMS</Text>
      <Text style={styles.subtitle}>
        Discover designs with similar style and aesthetics
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {items.map((item, index) => (
          <TouchableOpacity
            key={`similar-${item.id}-${index}`}
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => {
              router.push(`/item/${item.id}`);
            }}
          >
            {/* Image */}
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: item.thumbnail_url || item.image_url || '' }}
                style={styles.image}
                resizeMode="cover"
              />
            </View>

            {/* Info */}
            <View style={styles.infoContainer}>
              <Text style={styles.itemTitle} numberOfLines={1}>
                {item.title || 'Untitled Design'}
              </Text>

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {item.tags.slice(0, 2).map((tag, tagIndex) => (
                    <Text key={tagIndex} style={styles.tag} numberOfLines={1}>
                      #{tag}
                    </Text>
                  ))}
                </View>
              )}

              {/* Category badge (if available) */}
              {item.category && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Trajan',
    fontSize: 12,
    letterSpacing: 2,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#777777',
    marginBottom: 16,
    lineHeight: 18,
  },
  scrollView: {
    marginHorizontal: -24, // Negative margin to extend beyond parent padding
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#999999',
  },
  card: {
    width: SIMILAR_CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    width: '100%',
    height: SIMILAR_IMAGE_HEIGHT,
    backgroundColor: '#F5F5F5',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    padding: 12,
  },
  itemTitle: {
    fontFamily: 'Trajan',
    fontSize: 11,
    letterSpacing: 1,
    color: '#1A1A1A',
    marginBottom: 6,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
  },
  tag: {
    fontSize: 9,
    color: '#666666',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#2D7A4F',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontFamily: 'Trajan',
    fontSize: 8,
    letterSpacing: 1,
    color: '#FFFFFF',
  },
});
