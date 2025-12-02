import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  FlatList,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { apiClient } from '@/lib/api-client';
import { PublishedItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { SimilarItemsSection } from '@/components/mobile/SimilarItemsSection';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_WIDTH * 1.5; // 9:16 aspect ratio

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [item, setItem] = useState<PublishedItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Similar items state
  const [similarItems, setSimilarItems] = useState<any[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);

  // Check if the current user owns this item
  const isOwnItem = item && user && item.user_id === user.id;

  // Prepare images array (MAIN + SPEC views if available)
  // Check both metadata.quadtych_urls and top-level quadtych_urls
  const quadtychUrls = item?.metadata?.quadtych_urls || (item as any)?.quadtych_urls;
  const images = quadtychUrls
    ? [
        { uri: quadtychUrls.main, label: 'PORTRAIT' },
        { uri: quadtychUrls.front, label: 'FRONT' },
        { uri: quadtychUrls.side, label: 'SIDE' },
        { uri: quadtychUrls.back, label: 'BACK' },
      ]
    : [{ uri: item?.image_url || '', label: 'MAIN' }];

  useEffect(() => {
    fetchItemDetail();
  }, [id]);

  useEffect(() => {
    if (item?.id) {
      fetchSimilarItems();
    }
  }, [item?.id]);

  const fetchItemDetail = async () => {
    try {
      setLoading(true);

      // For now, we'll fetch from the showcase endpoint and find the item by ID
      // In production, you would have a dedicated /api/items/:id endpoint
      const showcaseResponse = await apiClient.get<{ items: any[] }>('/api/showcase?limit=100');
      const catalogResponse = await apiClient.get<{ images: any[] }>('/api/catalog');

      // Search in both showcase and catalog
      let foundItem = showcaseResponse.items?.find((i: any) => i.id === id);

      if (!foundItem) {
        // Check catalog
        const catalogItem = catalogResponse.images?.find((i: any) => i.id === id);
        if (catalogItem) {
          // Convert catalog item to PublishedItem format
          foundItem = {
            id: catalogItem.id,
            user_id: '',
            title: catalogItem.title,
            category: 'FUSION',
            image_url: catalogItem.src,
            thumbnail_url: catalogItem.src,
            metadata: {
              design_tokens: {
                tags: catalogItem.tags || [],
              },
            },
            created_at: catalogItem.createdAt,
            updated_at: catalogItem.createdAt,
            is_public: true,
          };
        }
      } else {
        // Convert showcase item to standardized format
        foundItem = {
          id: foundItem.id,
          user_id: foundItem.user_id || '',
          title: foundItem.title || 'Untitled Design',
          category: 'FUSION',
          image_url: foundItem.original_url || foundItem.poster_url || foundItem.image_url,
          thumbnail_url: foundItem.original_url || foundItem.poster_url || foundItem.image_url,
          quadtych_urls: foundItem.quadtych_urls || foundItem.metadata?.quadtych_urls,
          metadata: {
            ...foundItem.metadata,
            quadtych_urls: foundItem.quadtych_urls || foundItem.metadata?.quadtych_urls,
            fusion_spec: foundItem.fusion_spec,
            description: foundItem.description || foundItem.fusion_spec?.fusion_concept,
            design_tokens: {
              tags: foundItem.tags || foundItem.metadata?.design_tokens?.tags || [],
            },
          },
          created_at: foundItem.created_at,
          updated_at: foundItem.updated_at,
          is_public: true,
        };
      }

      setItem(foundItem || null);
    } catch (error) {
      console.error('[item-detail] Failed to fetch item:', error);
      setItem(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilarItems = async () => {
    if (!id) return;

    try {
      setSimilarLoading(true);
      console.log('[item-detail] Fetching similar items for:', id);
      const items = await apiClient.getSimilarItems(id, 6);
      console.log('[item-detail] Raw similar items response:', JSON.stringify(items).substring(0, 500));

      // R2 public base URL
      const R2_PUBLIC_BASE_URL = 'https://assets.open-wardrobe-market.com';

      // Convert to standardized format with proper image URLs
      const formattedItems = items.map((item: any) => {
        // Build image URL from image_id if original_url/poster_url not available
        const imageUrl = item.original_url || item.poster_url || item.image_url ||
          (item.image_id ? `${R2_PUBLIC_BASE_URL}/${item.image_id}` : '');

        return {
          id: item.id,
          title: item.title || 'Untitled Design',
          image_url: imageUrl,
          thumbnail_url: imageUrl,
          tags: item.tags || item.auto_tags || item.metadata?.design_tokens?.tags || [],
          category: item.category,
          metadata: item.metadata,
        };
      });

      console.log('[item-detail] Formatted similar items:', formattedItems.length, 'items');
      console.log('[item-detail] First item:', formattedItems[0] ? JSON.stringify(formattedItems[0]).substring(0, 300) : 'none');
      setSimilarItems(formattedItems);
    } catch (error) {
      console.error('[item-detail] Failed to fetch similar items:', error);
      setSimilarItems([]);
    } finally {
      setSimilarLoading(false);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentImageIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D7A4F" />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Item not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAF7" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backIconButton} onPress={() => router.back()}>
            <FontAwesome name="arrow-left" size={20} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>DETAILS</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Image Indicators - Only show if there are multiple images */}
        {images.length > 1 && (
          <View style={styles.viewModeContainer}>
            {images.map((img, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setCurrentImageIndex(index);
                  flatListRef.current?.scrollToIndex({ index, animated: true });
                }}
                activeOpacity={0.7}
                style={{
                  paddingBottom: 8,
                  borderBottomWidth: index === currentImageIndex ? 2 : 0,
                  borderBottomColor: '#1a3d3d',
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Trajan',
                    fontSize: 12,
                    letterSpacing: 2,
                    color: index === currentImageIndex ? '#1a3d3d' : 'rgba(119, 119, 119, 0.6)',
                  }}
                >
                  {img.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Image Card */}
        <View style={styles.imageCardContainer}>
          <FlatList
            ref={flatListRef}
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            keyExtractor={(_, index) => index.toString()}
            snapToInterval={SCREEN_WIDTH}
            decelerationRate="fast"
            renderItem={({ item: imageItem }) => (
              <View style={{ width: SCREEN_WIDTH, alignItems: 'center', justifyContent: 'center' }}>
                <View style={styles.imageCardShadow}>
                  <View style={styles.imageCard}>
                    <Image
                      source={{ uri: imageItem.uri }}
                      style={styles.image}
                      resizeMode="cover"
                    />
                  </View>
                </View>
              </View>
            )}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
          />
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          {/* Title */}
          <Text style={styles.title}>{item.title || 'Untitled Design'}</Text>

          {/* Tags */}
          {item.metadata?.design_tokens?.tags && (
            <View style={styles.tagsContainer}>
              {item.metadata.design_tokens.tags.map((tag: string, index: number) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Description */}
          {item.metadata?.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>DESCRIPTION</Text>
              <Text style={styles.description}>{item.metadata.description}</Text>
            </View>
          )}

          {/* Design Specifications */}
          {item.metadata?.fusion_spec && (
            <View style={styles.specsSection}>
              <Text style={styles.sectionTitle}>DESIGN SPECIFICATIONS</Text>

              {/* Silhouette */}
              {item.metadata.fusion_spec.silhouette && (
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Silhouette</Text>
                  <Text style={styles.specValue}>
                    {item.metadata.fusion_spec.silhouette}
                  </Text>
                </View>
              )}

              {/* Materials */}
              {item.metadata.fusion_spec.materials && (
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Materials</Text>
                  <Text style={styles.specValue}>
                    {item.metadata.fusion_spec.materials.join(', ')}
                  </Text>
                </View>
              )}

              {/* Color Palette */}
              {item.metadata.fusion_spec.palette && (
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Color Palette</Text>
                  <View style={styles.colorPaletteContainer}>
                    {item.metadata.fusion_spec.palette.map((color: any, index: number) => (
                      <View key={index} style={styles.colorItem}>
                        <View
                          style={[
                            styles.colorSwatch,
                            { backgroundColor: color.hex || '#CCCCCC' },
                          ]}
                        />
                        <Text style={styles.colorName}>{color.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Keywords */}
              {item.metadata.fusion_spec.emotional_keywords && (
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>Keywords</Text>
                  <Text style={styles.specValue}>
                    {item.metadata.fusion_spec.emotional_keywords.join(', ')}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsSection}>
            {isOwnItem ? (
              <TouchableOpacity
                style={styles.editButton}
                activeOpacity={0.8}
                onPress={() => router.push(`/item/edit/${item.id}`)}
              >
                <FontAwesome name="edit" size={18} color="#FFFFFF" />
                <Text style={styles.editButtonText}>EDIT</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.purchaseButton} activeOpacity={0.8}>
                <FontAwesome name="shopping-cart" size={18} color="#FFFFFF" />
                <Text style={styles.purchaseButtonText}>PURCHASE</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.favoriteButton} activeOpacity={0.8}>
              <FontAwesome name="heart-o" size={18} color="#2D7A4F" />
              <Text style={styles.favoriteButtonText}>FAVORITE</Text>
            </TouchableOpacity>
          </View>

          {/* Similar Items Section */}
          <SimilarItemsSection items={similarItems} loading={similarLoading} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F0E9',
  },
  safeArea: {
    backgroundColor: '#FAFAF7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAF7',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAF7',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#2D7A4F',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#FAFAF7',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Trajan',
    fontSize: 14,
    letterSpacing: 3,
    color: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F2F0E9',
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 40,
  },
  viewModeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 24,
  },
  imageCardContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  imageCardShadow: {
    width: SCREEN_WIDTH * 0.8,
    maxWidth: 320,
    height: 600,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    alignSelf: 'center',
  },
  imageCard: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  contentSection: {
    padding: 24,
  },
  title: {
    fontFamily: 'Trajan',
    fontSize: 20,
    letterSpacing: 2,
    color: '#1A1A1A',
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F2F0E9',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  tagText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  descriptionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Trajan',
    fontSize: 12,
    letterSpacing: 2,
    color: '#1A1A1A',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666666',
  },
  specsSection: {
    marginBottom: 32,
    padding: 20,
    backgroundColor: '#F8F7F4',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  specItem: {
    marginBottom: 16,
  },
  specLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999999',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  specValue: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  colorPaletteContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  colorItem: {
    alignItems: 'center',
    gap: 6,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  colorName: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'center',
  },
  actionsSection: {
    gap: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    backgroundColor: '#1a3d3d',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  editButtonText: {
    fontFamily: 'Trajan',
    fontSize: 14,
    letterSpacing: 2,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    backgroundColor: '#2D7A4F',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  purchaseButtonText: {
    fontFamily: 'Trajan',
    fontSize: 14,
    letterSpacing: 2,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#2D7A4F',
  },
  favoriteButtonText: {
    fontSize: 14,
    letterSpacing: 2,
    color: '#2D7A4F',
    fontWeight: '600',
  },
});
