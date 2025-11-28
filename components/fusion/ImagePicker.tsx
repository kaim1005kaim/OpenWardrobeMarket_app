import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import * as ImagePickerLib from 'expo-image-picker';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface ImagePickerProps {
  imageUri: string | null;
  onImageSelected: (uri: string) => void;
  label: string;
  disabled?: boolean;
}

export function ImagePicker({
  imageUri,
  onImageSelected,
  label,
  disabled = false,
}: ImagePickerProps) {
  const [loading, setLoading] = React.useState(false);

  const pickImage = async () => {
    if (disabled) return;

    try {
      setLoading(true);

      // Request permission
      const { status } = await ImagePickerLib.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        alert('カメラロールへのアクセス許可が必要です');
        return;
      }

      // Launch image picker with lower quality for smaller file size
      const result = await ImagePickerLib.launchImageLibraryAsync({
        mediaTypes: ImagePickerLib.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.5, // Reduced to 0.5 to prevent PAYLOAD_TOO_LARGE errors
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('画像の選択に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text className="text-ink-700 text-sm mb-2 tracking-wider" style={{ letterSpacing: 1 }}>
        {label}
      </Text>

      <TouchableOpacity
        onPress={pickImage}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[
          styles.pickerButton,
          disabled && styles.pickerButtonDisabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#5B7DB1" />
        ) : imageUri ? (
          <>
            <Image source={{ uri: imageUri }} style={styles.image} />
            <View style={styles.changeOverlay}>
              <FontAwesome name="refresh" size={24} color="#FAFAF7" />
              <Text className="text-offwhite text-sm mt-2">変更</Text>
            </View>
          </>
        ) : (
          <View style={styles.placeholder}>
            <FontAwesome name="camera" size={40} color="#777777" />
            <Text className="text-ink-400 mt-3 text-base">画像を選択</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pickerButton: {
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F5F5F3',
    borderWidth: 2,
    borderColor: '#EAEAEA',
    borderStyle: 'dashed',
  },
  pickerButtonDisabled: {
    opacity: 0.5,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  changeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 61, 61, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
