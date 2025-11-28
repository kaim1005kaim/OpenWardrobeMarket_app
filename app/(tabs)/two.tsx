import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = (width - 48) / 2;

export default function FusionScreen() {
  const { user } = useAuth();
  const [image1, setImage1] = useState<string | null>(null);
  const [image2, setImage2] = useState<string | null>(null);
  const [demographic, setDemographic] = useState<'men' | 'women' | 'unisex'>('unisex');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const pickImage = async (imageNumber: 1 | 2) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      if (imageNumber === 1) {
        setImage1(imageUri);
      } else {
        setImage2(imageUri);
      }
    }
  };

  const handleFusion = async () => {
    if (!image1 || !image2) {
      Alert.alert('Missing images', 'Please select both images to proceed');
      return;
    }

    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to use FUSION');
      return;
    }

    setIsAnalyzing(true);

    try {
      // Convert images to base64
      const response1 = await fetch(image1);
      const blob1 = await response1.blob();
      const reader1 = new FileReader();

      const base64Image1 = await new Promise<string>((resolve) => {
        reader1.onloadend = () => resolve(reader1.result as string);
        reader1.readAsDataURL(blob1);
      });

      const response2 = await fetch(image2);
      const blob2 = await response2.blob();
      const reader2 = new FileReader();

      const base64Image2 = await new Promise<string>((resolve) => {
        reader2.onloadend = () => resolve(reader2.result as string);
        reader2.readAsDataURL(blob2);
      });

      // Send to API
      const result = await apiClient.post('/api/fusion/variants-generate', {
        image1: base64Image1,
        image2: base64Image2,
        demographic,
      });

      Alert.alert(
        'FUSION Started',
        'Your design is being generated. Check back in a few moments!',
        [
          {
            text: 'OK',
            onPress: () => {
              setImage1(null);
              setImage2(null);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('FUSION error:', error);
      Alert.alert('Error', error.message || 'Failed to start FUSION');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isAnalyzing) {
    return (
      <LoadingSpinner
        fullScreen
        message="Analyzing your images and generating FUSION variants..."
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-offwhite" edges={['top']}>
      <ScrollView>
        <View className="px-4 py-6">
          <Text className="text-3xl font-bold text-ink-900">FUSION</Text>
          <Text className="text-ink-400 mt-1">
            Combine two garments to create something new
          </Text>
        </View>

        <View className="px-4">
          <Text className="text-sm font-semibold text-ink-700 mb-3">
            Select 2 Images
          </Text>

          <View className="flex-row justify-between mb-6">
            <TouchableOpacity
              onPress={() => pickImage(1)}
              className="bg-white rounded-2xl overflow-hidden items-center justify-center border-2 border-dashed border-ink-200"
              style={{ width: IMAGE_SIZE, height: IMAGE_SIZE }}
              activeOpacity={0.7}
            >
              {image1 ? (
                <Image
                  source={{ uri: image1 }}
                  className="w-full h-full"
                  contentFit="cover"
                />
              ) : (
                <View className="items-center">
                  <Text className="text-4xl text-ink-400 mb-2">+</Text>
                  <Text className="text-ink-400 text-sm">Image 1</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => pickImage(2)}
              className="bg-white rounded-2xl overflow-hidden items-center justify-center border-2 border-dashed border-ink-200"
              style={{ width: IMAGE_SIZE, height: IMAGE_SIZE }}
              activeOpacity={0.7}
            >
              {image2 ? (
                <Image
                  source={{ uri: image2 }}
                  className="w-full h-full"
                  contentFit="cover"
                />
              ) : (
                <View className="items-center">
                  <Text className="text-4xl text-ink-400 mb-2">+</Text>
                  <Text className="text-ink-400 text-sm">Image 2</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View className="mb-6">
            <Text className="text-sm font-semibold text-ink-700 mb-3">
              Target Demographic
            </Text>
            <View className="flex-row gap-3">
              {(['men', 'women', 'unisex'] as const).map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => setDemographic(option)}
                  className={`flex-1 py-3 rounded-xl border-2 items-center ${
                    demographic === option
                      ? 'bg-ink-900 border-ink-900'
                      : 'bg-white border-ink-200'
                  }`}
                >
                  <Text
                    className={`font-semibold capitalize ${
                      demographic === option ? 'text-offwhite' : 'text-ink-700'
                    }`}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Button
            title="Start FUSION"
            onPress={handleFusion}
            variant="primary"
            size="lg"
            fullWidth
            disabled={!image1 || !image2 || !user}
          />

          {!user && (
            <Text className="text-ink-400 text-center text-sm mt-3">
              Sign in to use FUSION
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
