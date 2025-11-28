import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
}

const TRENDING_TAGS = [
  'ストリート',
  'モード',
  'カジュアル',
  'エレガント',
  'ミニマル',
  'ヴィンテージ',
  'スポーツ',
  'フォーマル',
  'アーバン',
  'ボヘミアン',
  'グランジ',
  'プレッピー',
];

const SEARCH_HISTORY_KEY = '@search_history';
const MAX_HISTORY_ITEMS = 10;

export function SearchModal({ visible, onClose, onSearch }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      loadSearchHistory();
    }
  }, [visible]);

  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  };

  const saveSearchHistory = async (newQuery: string) => {
    try {
      const updatedHistory = [
        newQuery,
        ...searchHistory.filter((item) => item !== newQuery),
      ].slice(0, MAX_HISTORY_ITEMS);

      await AsyncStorage.setItem(
        SEARCH_HISTORY_KEY,
        JSON.stringify(updatedHistory)
      );
      setSearchHistory(updatedHistory);
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  };

  const removeHistoryItem = async (itemToRemove: string) => {
    try {
      const updatedHistory = searchHistory.filter(
        (item) => item !== itemToRemove
      );
      await AsyncStorage.setItem(
        SEARCH_HISTORY_KEY,
        JSON.stringify(updatedHistory)
      );
      setSearchHistory(updatedHistory);
    } catch (error) {
      console.error('Failed to remove history item:', error);
    }
  };

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      saveSearchHistory(searchQuery.trim());
      onSearch(searchQuery.trim());
      setQuery('');
      onClose();
    }
  };

  const handleTagPress = (tag: string) => {
    handleSearch(tag);
  };

  const handleHistoryPress = (historyItem: string) => {
    handleSearch(historyItem);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>検索</Text>
              <TouchableOpacity onPress={onClose} hitSlop={8}>
                <FontAwesome name="times" size={24} color="#1a3d3d" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <FontAwesome
                name="search"
                size={18}
                color="#777777"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="デザインを検索..."
                placeholderTextColor="#777777"
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => handleSearch(query)}
                autoFocus
                returnKeyType="search"
              />
              {query.length > 0 && (
                <TouchableOpacity
                  onPress={() => setQuery('')}
                  hitSlop={8}
                  style={styles.clearButton}
                >
                  <FontAwesome name="times-circle" size={18} color="#777777" />
                </TouchableOpacity>
              )}
            </View>

            {/* Search History */}
            {searchHistory.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>最近の検索</Text>
                {searchHistory.map((item, index) => (
                  <View key={index} style={styles.historyItem}>
                    <TouchableOpacity
                      onPress={() => handleHistoryPress(item)}
                      style={styles.historyItemButton}
                    >
                      <FontAwesome
                        name="history"
                        size={16}
                        color="#777777"
                        style={styles.historyIcon}
                      />
                      <Text style={styles.historyText}>{item}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => removeHistoryItem(item)}
                      hitSlop={8}
                    >
                      <FontAwesome name="times" size={16} color="#777777" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Trending Tags */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>トレンドタグ</Text>
              <View style={styles.tagsContainer}>
                {TRENDING_TAGS.map((tag, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.tag}
                    onPress={() => handleTagPress(tag)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.tagText}>{tag}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(238, 236, 230, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 520,
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a3d3d',
    letterSpacing: 0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#EAEAEA',
    marginBottom: 32,
    paddingBottom: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a3d3d',
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#777777',
    marginBottom: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F0',
  },
  historyItemButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIcon: {
    marginRight: 12,
  },
  historyText: {
    fontSize: 16,
    color: '#1a3d3d',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    backgroundColor: '#F4F4F0',
  },
  tagText: {
    fontSize: 14,
    color: '#1a3d3d',
    fontWeight: '500',
  },
});
