import React, { useEffect, useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { apiClient } from '@/lib/api-client';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface EventDetail {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  banner_url?: string;
  host: {
    id: string;
    name: string;
    avatar: string;
    subscription_plan: string;
  };
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'active' | 'ended';
  participant_count: number;
  view_count: number;
  support_count: number;
  submission_count: number;
  max_submissions?: number;
  tags: string[];
  prize_info?: any;
  rules?: string;
  is_supported: boolean;
  user_submission?: any;
  created_at: string;
}

export default function EventDetailScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    fetchEventDetail();
  }, [id]);

  const fetchEventDetail = async () => {
    try {
      const response = await apiClient.get<{ success: boolean; event: EventDetail }>(`/api/events/${id}`);
      if (response.success && response.event) {
        setEvent(response.event);
      }
    } catch (error: any) {
      console.log('[event-detail] API not implemented, using mock data');
      // Mock data for development
      const mockEvent: EventDetail = {
        id: id as string,
        title: 'Summer Fashion Challenge 2025',
        description: 'Create your best summer outfit design and showcase your creativity to the world. This challenge celebrates innovative fashion design and encourages participants to explore new styles and techniques.',
        thumbnail_url: 'https://via.placeholder.com/400x480/FF6B6B/FFFFFF?text=Summer+Fashion',
        banner_url: 'https://via.placeholder.com/800x300/FF6B6B/FFFFFF?text=Event+Banner',
        host: {
          id: 'host1',
          name: 'OpenDesign Team',
          avatar: '',
          subscription_plan: 'pro',
        },
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        participant_count: 128,
        view_count: 1520,
        support_count: 89,
        submission_count: 256,
        max_submissions: 1000,
        tags: ['summer', 'fashion', 'challenge'],
        prize_info: {
          first: '¥100,000 + Feature on homepage',
          second: '¥50,000',
          third: '¥30,000',
        },
        rules: '1. Original designs only\n2. Submit by end date\n3. One submission per participant\n4. Follow community guidelines',
        is_supported: false,
        user_submission: null,
        created_at: new Date().toISOString(),
      };
      setEvent(mockEvent);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const daysRemaining = event
    ? Math.ceil((new Date(event.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a3d3d" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>イベントが見つかりませんでした</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <FontAwesome name="arrow-left" size={20} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>EVENTS</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Banner */}
          {event.banner_url && (
            <Image
              source={{ uri: event.banner_url }}
              style={styles.banner}
              resizeMode="cover"
            />
          )}

          {/* Event Info */}
          <View style={styles.infoContainer}>
            {/* Title */}
            <Text style={styles.title}>{event.title}</Text>

            {/* Status Badge */}
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusBadge,
                  event.status === 'active' && styles.statusActive,
                  event.status === 'ended' && styles.statusEnded,
                ]}
              >
                <Text style={styles.statusText}>
                  {event.status === 'active' ? 'ACTIVE' : event.status === 'ended' ? 'ENDED' : 'UPCOMING'}
                </Text>
              </View>
              {event.status === 'active' && (
                <Text style={styles.daysRemaining}>残り {daysRemaining} 日</Text>
              )}
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <FontAwesome name="users" size={16} color="#666" />
                <Text style={styles.statText}>{event.participant_count}</Text>
              </View>
              <View style={styles.stat}>
                <FontAwesome name="heart" size={16} color="#666" />
                <Text style={styles.statText}>{event.support_count}</Text>
              </View>
              <View style={styles.stat}>
                <FontAwesome name="image" size={16} color="#666" />
                <Text style={styles.statText}>{event.submission_count}</Text>
              </View>
              <View style={styles.stat}>
                <FontAwesome name="eye" size={16} color="#666" />
                <Text style={styles.statText}>{event.view_count}</Text>
              </View>
            </View>

            {/* Host */}
            <View style={styles.hostRow}>
              <View style={styles.hostAvatar}>
                {event.host.avatar ? (
                  <Image source={{ uri: event.host.avatar }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{event.host.name[0]}</Text>
                )}
              </View>
              <View>
                <Text style={styles.hostLabel}>主催者</Text>
                <Text style={styles.hostName}>{event.host.name}</Text>
              </View>
            </View>

            {/* Dates */}
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>期間</Text>
              <Text style={styles.dateText}>
                {formatDate(event.start_date)} - {formatDate(event.end_date)}
              </Text>
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>イベント概要</Text>
              <Text style={styles.description}>{event.description}</Text>
            </View>

            {/* Prize Info */}
            {event.prize_info && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>賞品</Text>
                {Object.entries(event.prize_info).map(([key, value]) => (
                  <View key={key} style={styles.prizeRow}>
                    <Text style={styles.prizeLabel}>{key === 'first' ? '1位' : key === 'second' ? '2位' : '3位'}:</Text>
                    <Text style={styles.prizeValue}>{value as string}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Rules */}
            {event.rules && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>ルール</Text>
                <Text style={styles.rulesText}>{event.rules}</Text>
              </View>
            )}

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {event.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Action Buttons */}
        {event.status === 'active' && (
          <View style={styles.actionBar}>
            <TouchableOpacity
              style={[styles.actionButton, styles.supportButton]}
              activeOpacity={0.8}
            >
              <FontAwesome name="heart" size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>サポート</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.submitButton]}
              activeOpacity={0.8}
            >
              <FontAwesome name="upload" size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>投稿する</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F0E9',
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F0E9',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Trajan',
    fontSize: 16,
    letterSpacing: 3,
    color: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  banner: {
    width: SCREEN_WIDTH,
    height: 200,
    backgroundColor: '#000',
  },
  infoContainer: {
    padding: 24,
  },
  title: {
    fontFamily: 'Trajan',
    fontSize: 24,
    letterSpacing: 2,
    color: '#1A1A1A',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginRight: 12,
  },
  statusActive: {
    backgroundColor: '#4CAF50',
  },
  statusEnded: {
    backgroundColor: '#999',
  },
  statusText: {
    fontFamily: 'Trajan',
    fontSize: 10,
    letterSpacing: 1,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  daysRemaining: {
    fontSize: 14,
    color: '#666',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    marginBottom: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  hostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#CC0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    fontFamily: 'Trajan',
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  hostLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  hostName: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  dateRow: {
    marginBottom: 24,
  },
  dateLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Trajan',
    fontSize: 14,
    letterSpacing: 1,
    color: '#1A1A1A',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
  },
  prizeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  prizeLabel: {
    fontSize: 14,
    color: '#666',
    width: 50,
  },
  prizeValue: {
    fontSize: 14,
    color: '#1A1A1A',
    flex: 1,
  },
  rulesText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  supportButton: {
    backgroundColor: '#FF6B6B',
  },
  submitButton: {
    backgroundColor: '#1a3d3d',
  },
  actionButtonText: {
    fontFamily: 'Trajan',
    fontSize: 14,
    letterSpacing: 1,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
