import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { PosterCard } from './PosterCard';
import { posterTemplates } from '@/lib/posterTemplates';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_GAP = 12;
const NUM_COLUMNS = 2;
const PADDING_HORIZONTAL = 16;
const COLUMN_WIDTH =
  (SCREEN_WIDTH - PADDING_HORIZONTAL * 2 - COLUMN_GAP * (NUM_COLUMNS - 1)) /
  NUM_COLUMNS;

interface MasonryItem {
  id: string;
  src: string;
  title?: string;
  tags?: string[];
}

interface MasonryGridProps {
  items: MasonryItem[];
  onItemPress?: (item: MasonryItem) => void;
}

export function MasonryGrid({ items, onItemPress }: MasonryGridProps) {
  // Distribute items into two columns for balanced layout
  const columns = useMemo(() => {
    const col1: MasonryItem[] = [];
    const col2: MasonryItem[] = [];

    items.forEach((item, index) => {
      if (index % 2 === 0) {
        col1.push(item);
      } else {
        col2.push(item);
      }
    });

    return [col1, col2];
  }, [items]);

  const renderColumn = (columnItems: MasonryItem[], columnIndex: number) => (
    <View key={columnIndex} style={styles.column}>
      {columnItems.map((item, itemIndex) => {
        // Calculate global index for template assignment
        const globalIndex = columnIndex === 0 ? itemIndex * 2 : itemIndex * 2 + 1;
        const template = posterTemplates[globalIndex % posterTemplates.length];

        return (
          <PosterCard
            key={item.id}
            imageUrl={item.src}
            template={template}
            onPress={() => onItemPress?.(item)}
            displayWidth={COLUMN_WIDTH}
          />
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      {columns.map((columnItems, index) => renderColumn(columnItems, index))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: PADDING_HORIZONTAL,
    gap: COLUMN_GAP,
  },
  column: {
    flex: 1,
    gap: COLUMN_GAP,
  },
});
