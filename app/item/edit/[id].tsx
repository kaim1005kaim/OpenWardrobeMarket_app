import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

export default function ItemEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [originalItem, setOriginalItem] = useState<any>(null);

  useEffect(() => {
    fetchItemData();
  }, [id]);

  const fetchItemData = async () => {
    try {
      setLoading(true);

      // Fetch from user-gallery endpoint
      const response = await apiClient.get<{ success: boolean; images: any[] }>(
        `/api/user-gallery?user_id=${user?.id}&type=all`
      );

      const item = response.images?.find((i: any) => i.id === id);

      if (!item) {
        Alert.alert('Error', 'Item not found');
        router.back();
        return;
      }

      // Check ownership
      if (item.user_id !== user?.id) {
        Alert.alert('Error', 'You do not have permission to edit this item');
        router.back();
        return;
      }

      setOriginalItem(item);
      setTitle(item.title || '');
      setDescription(item.description || item.metadata?.description || '');
      setTags((item.tags || item.metadata?.design_tokens?.tags || []).join(', '));
      setIsPublic(item.type === 'published' || item.is_published || false);
    } catch (error) {
      console.error('[item-edit] Failed to fetch item:', error);
      Alert.alert('Error', 'Failed to load item');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Parse tags
      const parsedTags = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      // Update item via API
      const updateData = {
        title,
        description,
        tags: parsedTags,
        is_public: isPublic,
      };

      await apiClient.put(`/api/user-gallery/${id}`, updateData);

      Alert.alert('Success', 'Item updated successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('[item-edit] Failed to save:', error);
      Alert.alert('Error', error?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D7A4F" />
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
          <Text style={styles.headerTitle}>EDIT DESIGN</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Title Input */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter design title"
            placeholderTextColor="#999999"
          />
        </View>

        {/* Description Input */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter design description"
            placeholderTextColor="#999999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Tags Input */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Tags</Text>
          <Text style={styles.helperText}>Separate tags with commas</Text>
          <TextInput
            style={styles.input}
            value={tags}
            onChangeText={setTags}
            placeholder="e.g., modern, elegant, casual"
            placeholderTextColor="#999999"
          />
        </View>

        {/* Public/Private Toggle */}
        <View style={styles.formSection}>
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.label}>Publish to Showcase</Text>
              <Text style={styles.helperText}>
                {isPublic
                  ? 'Your design is visible to everyone'
                  : 'Your design is private'}
              </Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: '#DCDCDC', true: '#2D7A4F' }}
              thumbColor={isPublic ? '#FFFFFF' : '#F4F4F0'}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.saveButton}
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <FontAwesome name="check" size={18} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>SAVE CHANGES</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            activeOpacity={0.8}
            onPress={() => router.back()}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF7',
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
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  formSection: {
    marginBottom: 32,
  },
  label: {
    fontFamily: 'Trajan',
    fontSize: 12,
    letterSpacing: 2,
    color: '#1A1A1A',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  helperText: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#F8F7F4',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  actionsSection: {
    marginTop: 16,
    gap: 12,
  },
  saveButton: {
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
  saveButtonText: {
    fontFamily: 'Trajan',
    fontSize: 14,
    letterSpacing: 2,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
  },
  cancelButtonText: {
    fontSize: 14,
    letterSpacing: 2,
    color: '#666666',
    fontWeight: '600',
  },
});
