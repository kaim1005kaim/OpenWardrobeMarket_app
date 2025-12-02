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

      // Launch image picker with optimized quality for faster loading
      const result = await ImagePickerLib.launchImageLibraryAsync({
        mediaTypes: ImagePickerLib.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.7, // Balanced quality for faster display and reasonable upload size
      });

      if (!result.canceled && result.assets[0]) {
        // Immediately set the image URI for instant display
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
      <Text style={{ color: '#3A3A3A', fontSize: 11, marginBottom: 10, letterSpacing: 2, fontWeight: '600' }}>
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
          <ActivityIndicator size="large" color="#1a3d3d" />
        ) : imageUri ? (
          <>
            <Image source={{ uri: imageUri }} style={styles.image} />
            <View style={styles.changeOverlay}>
              <FontAwesome name="refresh" size={20} color="#FAFAF7" />
              <Text style={{ color: '#FAFAF7', fontSize: 12, marginTop: 8, fontWeight: '500' }}>変更</Text>
            </View>
          </>
        ) : (
          <View style={styles.placeholder}>
            <FontAwesome name="image" size={32} color="#AAAAAA" />
            <Text style={{ color: '#999999', marginTop: 12, fontSize: 13 }}>画像を選択</Text>
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
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FAFAFA',
    borderWidth: 1.5,
    borderColor: '#D4D4D4',
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
    backgroundColor: 'rgba(26, 61, 61, 0.85)',
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
