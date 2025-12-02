import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuth } from '@/contexts/AuthContext';
import { generateMetadata } from '@/lib/gemini-metadata';
import { apiClient } from '@/lib/api-client';
import { FusionSpec } from '@/types/fusion';
import { Event } from '@/types/event';

export default function PublicationSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();

  // Parameters passed from FusionResultView
  const imageUrl = params.imageUrl as string;
  const generationId = params.generationId as string;
  const fusionSpecJSON = params.fusionSpec as string;

  const [fusionSpec, setFusionSpec] = useState<FusionSpec | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [price] = useState(3000); // Fixed price
  const [status, setStatus] = useState<'published' | 'draft'>('published');

  // Event/Contest features
  const [activeEvents, setActiveEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isEventExclusive, setIsEventExclusive] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [metadataGenerated, setMetadataGenerated] = useState(false);

  useEffect(() => {
    if (fusionSpecJSON) {
      try {
        const parsed = JSON.parse(fusionSpecJSON);
        setFusionSpec(parsed);
      } catch (error) {
        console.error('[publication-settings] Failed to parse fusionSpec:', error);
      }
    }
  }, [fusionSpecJSON]);

  useEffect(() => {
    if (fusionSpec && imageUrl && !metadataGenerated) {
      generateMetadataAuto();
    }
  }, [fusionSpec, imageUrl]);

  useEffect(() => {
    fetchActiveEvents();
  }, []);

  const fetchActiveEvents = async () => {
    try {
      // TODO: Implement /api/events endpoint
      // For now, mock data
      const mockEvents: Event[] = [
        {
          id: 'event-1',
          title: '春の新作デザインコンテスト',
          description: 'VTuber「桜ミク」の新衣装デザインを募集中！',
          organizer: {
            id: 'org-1',
            name: '桜ミク',
            type: 'vtuber',
            verified: true,
            avatarUrl: 'https://example.com/avatar.png',
          },
          coverImageUrl: 'https://example.com/event-cover.png',
          startDate: '2025-11-01',
          endDate: '2025-12-31',
          status: 'active',
          category: 'vtuber',
          submissionCount: 142,
          prizePool: '¥100,000',
          tags: ['春', 'VTuber', '新衣装'],
          createdAt: '2025-10-15',
        },
      ];
      setActiveEvents(mockEvents);
    } catch (error) {
      console.error('[publication-settings] Failed to fetch events:', error);
    }
  };

  const generateMetadataAuto = async () => {
    if (!fusionSpec || !imageUrl) return;

    setIsGenerating(true);
    try {
      const metadata = await generateMetadata(imageUrl, fusionSpec);
      setTitle(metadata.title);
      setDescription(metadata.description);
      setTags(metadata.tags);
      setMetadataGenerated(true);
    } catch (error) {
      console.error('[publication-settings] Metadata generation failed:', error);
      Alert.alert('エラー', 'メタデータの生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!user) {
      Alert.alert('エラー', 'ログインが必要です');
      return;
    }

    if (!title.trim()) {
      Alert.alert('エラー', 'タイトルを入力してください');
      return;
    }

    setIsPublishing(true);

    try {
      // Extract colors from fusionSpec
      const colors = fusionSpec?.palette.map((c) => c.name) || [];

      // Prepare publication data
      const publicationData = {
        originalUrl: imageUrl,
        posterUrl: imageUrl,
        sessionId: generationId,
        title: title.trim(),
        description: description.trim(),
        tags,
        colors,
        category: 'user-generated',
        price,
        saleType: status === 'published' ? 'buyout' : 'draft',
        generation_data: fusionSpec ? {
          session_id: generationId,
          parameters: {
            fusion_spec: fusionSpec,
          },
        } : undefined,
        // Event-specific fields
        eventId: selectedEventId,
        isEventExclusive,
      };

      console.log('[publication-settings] Publishing with data:', publicationData);

      // Call /api/publish
      const response = await apiClient.post('/api/publish', publicationData);

      console.log('[publication-settings] Publish response:', response);

      // If submitting to an event, also create event submission
      if (selectedEventId && response.item) {
        try {
          await apiClient.post('/api/event-submissions', {
            eventId: selectedEventId,
            designId: response.item.id,
            imageUrl,
            title,
            description,
          });
          console.log('[publication-settings] Event submission created');
        } catch (eventError) {
          console.warn('[publication-settings] Event submission failed:', eventError);
          // Don't fail the whole publish if event submission fails
        }
      }

      Alert.alert(
        '完了',
        selectedEventId
          ? 'デザインを公開し、イベントに投稿しました'
          : status === 'published'
          ? 'デザインを公開しました'
          : '下書きとして保存しました',
        [
          {
            text: 'ARCHIVEへ',
            onPress: () => router.replace('/(tabs)/archive'),
          },
          {
            text: '新しいFUSION',
            onPress: () => router.replace('/fusion'),
          },
        ]
      );
    } catch (error) {
      console.error('[publication-settings] Publish error:', error);
      Alert.alert('エラー', '公開に失敗しました');
    } finally {
      setIsPublishing(false);
    }
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      setTags([...tags, tag.trim()]);
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  if (isGenerating) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F2F0E9', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#1a3d3d" />
        <Text style={{ color: '#777777', marginTop: 16 }}>
          AIがメタデータを生成しています...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F0E9' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16 }}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <FontAwesome name="chevron-left" size={24} color="#1a3d3d" />
          </TouchableOpacity>
          <Text
            style={{
              flex: 1,
              textAlign: 'center',
              fontFamily: 'Trajan',
              fontSize: 18,
              letterSpacing: 2,
              color: '#1A1A1A',
              marginLeft: -24,
            }}
          >
            PUBLISH SETTINGS
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Preview Image */}
          <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}>
            <View style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: '#F5F5F3' }}>
              <Image
                source={{ uri: imageUrl }}
                style={{ width: '100%', aspectRatio: 1 }}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Active Events Section */}
          {activeEvents.length > 0 && (
            <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <FontAwesome name="trophy" size={18} color="#FF7A1A" />
                <Text
                  style={{
                    fontFamily: 'Trajan',
                    fontSize: 14,
                    letterSpacing: 1.5,
                    color: '#1A1A1A',
                    marginLeft: 8,
                  }}
                >
                  ACTIVE CONTESTS
                </Text>
              </View>

              {activeEvents.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  onPress={() => setSelectedEventId(selectedEventId === event.id ? null : event.id)}
                  activeOpacity={0.8}
                  style={{
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: selectedEventId === event.id ? '#1a3d3d' : '#E5E5E5',
                    backgroundColor: selectedEventId === event.id ? 'rgba(26, 61, 61, 0.05)' : '#FAFAF7',
                    padding: 16,
                    marginBottom: 12,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: '#FF7A1A',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 16 }}>
                        {event.organizer.name.charAt(0)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ color: '#1A1A1A', fontSize: 16, fontWeight: '600' }}>
                          {event.title}
                        </Text>
                        {event.organizer.verified && (
                          <FontAwesome name="check-circle" size={14} color="#5B7DB1" style={{ marginLeft: 6 }} />
                        )}
                      </View>
                      <Text style={{ color: '#777777', fontSize: 12, marginTop: 2 }}>
                        by {event.organizer.name} • {event.submissionCount} submissions
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: '#3A3A3A', fontSize: 13, lineHeight: 18 }}>
                    {event.description}
                  </Text>
                  {event.prizePool && (
                    <View
                      style={{
                        marginTop: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        backgroundColor: '#FF7A1A',
                        borderRadius: 12,
                        alignSelf: 'flex-start',
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '600' }}>
                        賞金 {event.prizePool}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}

              {selectedEventId && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  <Switch
                    value={isEventExclusive}
                    onValueChange={setIsEventExclusive}
                    trackColor={{ false: '#DCDCDC', true: '#1a3d3d' }}
                    thumbColor="#FFFFFF"
                  />
                  <Text style={{ color: '#3A3A3A', fontSize: 14, marginLeft: 12 }}>
                    イベント専用（マーケットプレイスには表示しない）
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Title */}
          <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
            <Text style={{ color: '#777777', fontSize: 12, textTransform: 'uppercase', marginBottom: 8, fontWeight: '600' }}>
              Title
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="デザインのタイトル"
              placeholderTextColor="#AAAAAA"
              style={{
                backgroundColor: '#FAFAF7',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#E5E5E5',
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                color: '#1A1A1A',
              }}
            />
          </View>

          {/* Description */}
          <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
            <Text style={{ color: '#777777', fontSize: 12, textTransform: 'uppercase', marginBottom: 8, fontWeight: '600' }}>
              Description
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="デザインの説明"
              placeholderTextColor="#AAAAAA"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{
                backgroundColor: '#FAFAF7',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#E5E5E5',
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 14,
                color: '#1A1A1A',
                minHeight: 100,
              }}
            />
          </View>

          {/* Tags */}
          <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
            <Text style={{ color: '#777777', fontSize: 12, textTransform: 'uppercase', marginBottom: 8, fontWeight: '600' }}>
              Tags
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {tags.map((tag) => (
                <View
                  key={tag}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(26, 61, 61, 0.1)',
                    borderRadius: 16,
                    paddingLeft: 12,
                    paddingRight: 8,
                    paddingVertical: 6,
                    borderWidth: 1,
                    borderColor: 'rgba(26, 61, 61, 0.2)',
                  }}
                >
                  <Text style={{ color: '#1a3d3d', fontSize: 13, fontWeight: '600', marginRight: 6 }}>
                    {tag}
                  </Text>
                  <TouchableOpacity onPress={() => removeTag(tag)} activeOpacity={0.7}>
                    <FontAwesome name="times-circle" size={16} color="#1a3d3d" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <Text style={{ color: '#999999', fontSize: 12 }}>
              AIが自動生成したタグです。編集も可能です。
            </Text>
          </View>

          {/* Price */}
          <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
            <Text style={{ color: '#777777', fontSize: 12, textTransform: 'uppercase', marginBottom: 8, fontWeight: '600' }}>
              Price
            </Text>
            <View
              style={{
                backgroundColor: '#F5F5F3',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#E5E5E5',
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
            >
              <Text style={{ color: '#1A1A1A', fontSize: 18, fontWeight: '600' }}>
                ¥{price.toLocaleString()}
              </Text>
              <Text style={{ color: '#999999', fontSize: 12, marginTop: 4 }}>
                固定価格（変更不可）
              </Text>
            </View>
          </View>

          {/* Status Toggle */}
          <View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>
            <Text style={{ color: '#777777', fontSize: 12, textTransform: 'uppercase', marginBottom: 12, fontWeight: '600' }}>
              Status
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => setStatus('published')}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: status === 'published' ? '#1a3d3d' : '#E5E5E5',
                  backgroundColor: status === 'published' ? 'rgba(26, 61, 61, 0.05)' : '#FAFAF7',
                  paddingVertical: 16,
                  alignItems: 'center',
                }}
              >
                <FontAwesome name="globe" size={20} color={status === 'published' ? '#1a3d3d' : '#AAAAAA'} />
                <Text
                  style={{
                    color: status === 'published' ? '#1a3d3d' : '#AAAAAA',
                    fontSize: 14,
                    fontWeight: '600',
                    marginTop: 8,
                  }}
                >
                  公開
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setStatus('draft')}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: status === 'draft' ? '#1a3d3d' : '#E5E5E5',
                  backgroundColor: status === 'draft' ? 'rgba(26, 61, 61, 0.05)' : '#FAFAF7',
                  paddingVertical: 16,
                  alignItems: 'center',
                }}
              >
                <FontAwesome name="lock" size={20} color={status === 'draft' ? '#1a3d3d' : '#AAAAAA'} />
                <Text
                  style={{
                    color: status === 'draft' ? '#1a3d3d' : '#AAAAAA',
                    fontSize: 14,
                    fontWeight: '600',
                    marginTop: 8,
                  }}
                >
                  下書き
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Publish Button */}
          <View style={{ paddingHorizontal: 24 }}>
            <TouchableOpacity
              onPress={handlePublish}
              activeOpacity={0.8}
              disabled={isPublishing || !title.trim()}
              style={{
                backgroundColor: isPublishing || !title.trim() ? '#DCDCDC' : '#2D7A4F',
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              {isPublishing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  style={{
                    fontFamily: 'Trajan',
                    fontSize: 16,
                    letterSpacing: 2,
                    color: '#FAFAF7',
                  }}
                >
                  {selectedEventId
                    ? 'SUBMIT TO CONTEST'
                    : status === 'published'
                    ? 'PUBLISH DESIGN'
                    : 'SAVE AS DRAFT'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
