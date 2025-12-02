import React, { useEffect, useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { MenuOverlay } from '@/components/mobile/MenuOverlay';
import { SearchModal } from '@/components/mobile/SearchModal';
import { apiClient } from '@/lib/api-client';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.2;

interface Event {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  host_id: string;
  host_name: string;
  host_avatar: string;
  start_date: string;
  end_date: string;
  participant_count: number;
  view_count: number;
  support_count: number;
  status: 'upcoming' | 'active' | 'ended';
  created_at: string;
}

// Event Card Component
const EventCard = memo(({ event, onPress }: { event: Event; onPress: () => void }) => {
  const isActive = event.status === 'active';
  const isEnded = event.status === 'ended';

  // Calculate days remaining
  const daysRemaining = Math.ceil(
    (new Date(event.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: event.thumbnail_url }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        {/* Status Badge */}
        <View style={[
          styles.statusBadge,
          isActive && styles.statusBadgeActive,
          isEnded && styles.statusBadgeEnded,
        ]}>
          <Text style={styles.statusText}>
            {isActive ? 'ACTIVE' : isEnded ? 'ENDED' : 'UPCOMING'}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        {/* Title */}
        <Text style={styles.eventTitle} numberOfLines={2}>
          {event.title}
        </Text>

        {/* Host Info */}
        <View style={styles.hostInfo}>
          {event.host_avatar ? (
            <Image
              source={{ uri: event.host_avatar }}
              style={styles.hostAvatar}
            />
          ) : (
            <View style={styles.hostAvatarPlaceholder}>
              <Text style={styles.hostAvatarText}>
                {event.host_name?.charAt(0).toUpperCase() || 'H'}
              </Text>
            </View>
          )}
          <Text style={styles.hostName} numberOfLines={1}>
            {event.host_name}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <FontAwesome name="users" size={10} color="#777777" />
            <Text style={styles.statText}>{event.participant_count}</Text>
          </View>
          <View style={styles.statItem}>
            <FontAwesome name="heart" size={10} color="#CC0000" />
            <Text style={styles.statText}>{event.support_count}</Text>
          </View>
        </View>

        {/* End Date */}
        {isActive && daysRemaining > 0 && (
          <Text style={styles.daysRemaining}>
            {daysRemaining}日後終了
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
});

export default function EventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchEvents = async () => {
    try {
      const response = await apiClient.get<{ success: boolean; events: Event[] }>('/api/events?limit=50');

      if (response.success && response.events) {
        // Sort by popularity score (views + supports * 2 + participants * 3)
        const sortedEvents = response.events.sort((a, b) => {
          const scoreA = a.view_count + (a.support_count * 2) + (a.participant_count * 3);
          const scoreB = b.view_count + (b.support_count * 2) + (b.participant_count * 3);
          return scoreB - scoreA;
        });

        setEvents(sortedEvents);
        setFilteredEvents(sortedEvents);
      }
    } catch (error: any) {
      // Silently use mock data for 404 (API not implemented yet)
      if (error?.response?.status === 404) {
        console.log('[events] API not implemented yet, using mock data');
      } else {
        console.warn('[events] Failed to fetch events:', error);
      }
      // Show mock data for development
      const mockEvents: Event[] = [
        {
          id: '1',
          title: 'Summer Fashion Challenge 2025',
          description: 'Create your best summer outfit design',
          thumbnail_url: 'https://via.placeholder.com/400x480/FF6B6B/FFFFFF?text=Summer+Fashion',
          host_id: 'host1',
          host_name: 'OpenDesign Team',
          host_avatar: '',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          participant_count: 128,
          view_count: 1520,
          support_count: 89,
          status: 'active',
          created_at: new Date().toISOString(),
        },
      ];
      setEvents(mockEvents);
      setFilteredEvents(mockEvents);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredEvents(events);
      return;
    }

    const filtered = events.filter((event) => {
      const searchLower = query.toLowerCase();
      const titleMatch = event.title?.toLowerCase().includes(searchLower);
      const hostMatch = event.host_name?.toLowerCase().includes(searchLower);
      return titleMatch || hostMatch;
    });

    setFilteredEvents(filtered);
  };

  const renderItem = useCallback(({ item }: { item: Event }) => (
    <EventCard
      event={item}
      onPress={() => router.push(`/event/${item.id}`)}
    />
  ), [router]);

  const keyExtractor = useCallback((item: Event) => item.id, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F0E9' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <MobileHeader onMenuPress={() => setMenuVisible(true)} transparent darkText />
        <MenuOverlay visible={menuVisible} onClose={() => setMenuVisible(false)} />
        <SearchModal
          visible={searchVisible}
          onClose={() => setSearchVisible(false)}
          onSearch={handleSearch}
        />

        <FlatList
          data={filteredEvents}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          numColumns={2}
          columnWrapperStyle={{
            paddingHorizontal: 16,
            gap: 16,
            justifyContent: 'space-between',
          }}
          contentContainerStyle={{
            paddingTop: 16,
            paddingBottom: 96,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <>
              {/* Page Title */}
              <View style={{ paddingHorizontal: 24, paddingTop: 32 }}>
                <Text
                  style={{
                    color: '#1A1A1A',
                    textAlign: 'center',
                    fontFamily: 'Trajan',
                    fontSize: 40,
                    letterSpacing: 8,
                    fontWeight: '400',
                  }}
                >
                  EVENTS
                </Text>
              </View>

              {/* Search Bar */}
              <View style={{ paddingHorizontal: 24, paddingBottom: 16, paddingTop: 24 }}>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: '#DCDCDC',
                  }}
                  onPress={() => setSearchVisible(true)}
                  activeOpacity={0.7}
                >
                  <FontAwesome name="search" size={16} color="#777777" />
                  <Text
                    style={{
                      color: '#777777',
                      marginLeft: 8,
                      fontSize: 14,
                      textTransform: 'uppercase',
                      letterSpacing: 1.5,
                    }}
                  >
                    {searchQuery || 'SEARCH EVENTS'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          }
          ListEmptyComponent={
            loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 120 }}>
                <ActivityIndicator size="large" color="#1a3d3d" />
                <Text style={{ color: '#777777', marginTop: 16 }}>
                  Loading events...
                </Text>
              </View>
            ) : (
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 80,
                  paddingHorizontal: 24,
                }}
              >
                <FontAwesome name="calendar-o" size={48} color="#EAEAEA" />
                <Text
                  style={{
                    color: '#777777',
                    textAlign: 'center',
                    marginTop: 16,
                    fontSize: 16,
                  }}
                >
                  {searchQuery
                    ? `「${searchQuery}」に一致するイベントが見つかりませんでした`
                    : 'まだイベントがありません'}
                </Text>
              </View>
            )
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  eventCard: {
    width: CARD_WIDTH,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnailContainer: {
    width: '100%',
    height: CARD_HEIGHT * 0.6,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E5E5',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
  },
  statusBadgeActive: {
    backgroundColor: '#10B981',
  },
  statusBadgeEnded: {
    backgroundColor: '#6B7280',
  },
  statusText: {
    fontFamily: 'Trajan',
    fontSize: 8,
    letterSpacing: 1,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cardContent: {
    padding: 12,
  },
  eventTitle: {
    fontFamily: 'Trajan',
    fontSize: 12,
    letterSpacing: 0.5,
    color: '#1A1A1A',
    textTransform: 'uppercase',
    marginBottom: 8,
    lineHeight: 16,
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  hostAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#CC0000',
    marginRight: 6,
  },
  hostAvatarPlaceholder: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#CC0000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  hostAvatarText: {
    fontFamily: 'Trajan',
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  hostName: {
    fontSize: 10,
    color: '#777777',
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 10,
    color: '#777777',
  },
  daysRemaining: {
    fontSize: 9,
    color: '#10B981',
    fontWeight: '600',
  },
});
