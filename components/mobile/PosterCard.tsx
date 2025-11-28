import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { PosterTemplate } from '@/lib/posterTemplates';

interface PosterCardProps {
  imageUrl: string;
  template: PosterTemplate;
  onPress?: () => void;
  displayWidth: number;
}

export function PosterCard({
  imageUrl,
  template,
  onPress,
  displayWidth,
}: PosterCardProps) {
  // Calculate display height based on template aspect ratio
  const aspectRatio = template.frameSize.height / template.frameSize.width;
  const displayHeight = displayWidth * aspectRatio;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[
        styles.container,
        {
          width: displayWidth,
          height: displayHeight,
          backgroundColor: template.backgroundColor,
        },
      ]}
    >
      {/* User Image - positioned in imageArea */}
      <View
        style={[
          styles.imageWrapper,
          {
            position: 'absolute',
            left: (template.imageArea.x / template.frameSize.width) * displayWidth,
            top: (template.imageArea.y / template.frameSize.height) * displayHeight,
            width: (template.imageArea.width / template.frameSize.width) * displayWidth,
            height: (template.imageArea.height / template.frameSize.height) * displayHeight,
          },
        ]}
      >
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
      </View>

      {/* Frame Overlay */}
      <Image
        source={{ uri: template.framePath }}
        style={styles.frame}
        contentFit="fill"
        transition={200}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageWrapper: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  frame: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
});
