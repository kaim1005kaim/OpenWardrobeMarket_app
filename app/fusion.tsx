import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ImagePicker } from '@/components/fusion/ImagePicker';
import { AnalyzingView } from '@/components/fusion/AnalyzingView';
import { FusionSpecView } from '@/components/fusion/FusionSpecView';
import { GeneratingView } from '@/components/fusion/GeneratingView';
import { FusionResultView } from '@/components/fusion/FusionResultView';
import { FusionState } from '@/types/fusion';
import { analyzeFusion, generateDesign, uploadImageToR2 } from '@/lib/fusion-api';

export default function FusionScreen() {
  const router = useRouter();
  const [fusionState, setFusionState] = useState<FusionState>({
    stage: 'UPLOAD',
    imageA: null,
    imageB: null,
    fusionSpec: null,
    generatedImageUrl: null,
    generationId: null,
    triptychUrls: null,
    error: null,
  });

  const handleImageASelected = (uri: string) => {
    setFusionState((prev) => ({
      ...prev,
      imageA: { uri },
    }));
  };

  const handleImageBSelected = (uri: string) => {
    setFusionState((prev) => ({
      ...prev,
      imageB: { uri },
    }));
  };

  const canProceed = fusionState.imageA && fusionState.imageB;

  const handleFuse = async () => {
    if (!canProceed) {
      Alert.alert('エラー', '2つの画像を選択してください');
      return;
    }

    try {
      // Stage 1: ANALYZING
      setFusionState((prev) => ({ ...prev, stage: 'ANALYZING', error: null }));

      // Upload images to R2
      const [imageAUrl, imageBUrl] = await Promise.all([
        uploadImageToR2(fusionState.imageA!.uri),
        uploadImageToR2(fusionState.imageB!.uri),
      ]);

      // Analyze with Gemini Vision
      const fusionSpec = await analyzeFusion(imageAUrl, imageBUrl);

      // Stage 2: PREVIEW
      setFusionState((prev) => ({
        ...prev,
        stage: 'PREVIEW',
        fusionSpec,
      }));
    } catch (error) {
      console.error('Fusion error:', error);
      setFusionState((prev) => ({
        ...prev,
        stage: 'UPLOAD',
        error: error instanceof Error ? error.message : '不明なエラーが発生しました',
      }));
      Alert.alert('エラー', error instanceof Error ? error.message : '不明なエラーが発生しました');
    }
  };

  const handleGenerate = async () => {
    if (!fusionState.fusionSpec) return;

    try {
      // Stage 3: GENERATING
      setFusionState((prev) => ({ ...prev, stage: 'GENERATING', error: null }));

      // Generate design with Gemini 3 Pro (triptych mode)
      const result = await generateDesign(fusionState.fusionSpec);
      console.log('[fusion] Generation result:', result);

      // Stage 4: REVEALING (will be implemented next)
      setFusionState((prev) => ({
        ...prev,
        stage: 'REVEALING',
        generationId: result.generationId,
        generatedImageUrl: result.imageUrl,
        triptychUrls: result.triptychUrls || null,
      }));

      // For now, go directly to DONE
      setTimeout(() => {
        setFusionState((prev) => ({ ...prev, stage: 'DONE' }));
      }, 2000);
    } catch (error) {
      console.error('Generation error:', error);
      setFusionState((prev) => ({
        ...prev,
        stage: 'PREVIEW',
        error: error instanceof Error ? error.message : '不明なエラーが発生しました',
      }));
      Alert.alert('エラー', error instanceof Error ? error.message : '不明なエラーが発生しました');
    }
  };

  const handleBackToUpload = () => {
    setFusionState({
      stage: 'UPLOAD',
      imageA: fusionState.imageA,
      imageB: fusionState.imageB,
      fusionSpec: null,
      generatedImageUrl: null,
      generationId: null,
      triptychUrls: null,
      error: null,
    });
  };

  const handleSaveToWardrobe = () => {
    if (!fusionState.generationId || !fusionState.generatedImageUrl) {
      Alert.alert('エラー', '保存する画像が見つかりません');
      return;
    }

    // TODO: Implement wardrobe save functionality
    Alert.alert(
      '保存完了',
      'ワードローブに保存されました',
      [
        {
          text: 'OK',
          onPress: handleBackToUpload,
        },
      ]
    );
  };

  const renderContent = () => {
    switch (fusionState.stage) {
      case 'ANALYZING':
        return (
          <AnalyzingView
            imageA={fusionState.imageA!.uri}
            imageB={fusionState.imageB!.uri}
            fusionSpec={fusionState.fusionSpec}
          />
        );

      case 'PREVIEW':
        return fusionState.fusionSpec ? (
          <FusionSpecView
            fusionSpec={fusionState.fusionSpec}
            onGenerate={handleGenerate}
            onBack={handleBackToUpload}
          />
        ) : null;

      case 'GENERATING':
        return <GeneratingView />;

      case 'REVEALING':
      case 'DONE':
        return fusionState.generatedImageUrl ? (
          <FusionResultView
            imageUrl={fusionState.generatedImageUrl}
            fusionSpec={fusionState.fusionSpec}
            triptychUrls={fusionState.triptychUrls}
            onClose={handleBackToUpload}
            onSaveToWardrobe={handleSaveToWardrobe}
          />
        ) : (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-ink-900 text-2xl">生成完了！</Text>
            <Text className="text-ink-600 mt-4">
              生成されたデザインが表示されます
            </Text>
          </View>
        );

      case 'UPLOAD':
      default:
        return (
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Description */}
            <View className="px-6 pt-2 pb-6">
              <Text className="text-ink-600 text-center text-base leading-6">
                2つの画像を融合させて{'\n'}
                新しいデザインを生成します
              </Text>
            </View>

            {/* Image Pickers */}
            <View className="px-6 pb-8">
              <View className="flex-row gap-4">
                <ImagePicker
                  imageUri={fusionState.imageA?.uri || null}
                  onImageSelected={handleImageASelected}
                  label="IMAGE A"
                  disabled={fusionState.stage !== 'UPLOAD'}
                />
                <ImagePicker
                  imageUri={fusionState.imageB?.uri || null}
                  onImageSelected={handleImageBSelected}
                  label="IMAGE B"
                  disabled={fusionState.stage !== 'UPLOAD'}
                />
              </View>
            </View>

            {/* Instructions */}
            <View className="px-6 pb-8">
              <View className="bg-ink-50 rounded-2xl p-5">
                <View className="flex-row items-start mb-3">
                  <FontAwesome
                    name="lightbulb-o"
                    size={20}
                    color="#5B7DB1"
                    style={{ marginRight: 12, marginTop: 2 }}
                  />
                  <View className="flex-1">
                    <Text className="text-ink-900 font-semibold mb-2">
                      ヒント
                    </Text>
                    <Text className="text-ink-600 text-sm leading-5">
                      • できるだけ明確で高品質な画像を使用してください{'\n'}
                      • 異なるスタイルや素材の組み合わせが面白い結果を生みます{'\n'}
                      • AIが2つの画像の特徴を分析して融合します
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Action Button */}
            <View className="px-6 pb-12">
              <TouchableOpacity
                className={`rounded-2xl py-5 items-center ${
                  canProceed ? 'bg-darkTeal' : 'bg-ink-200'
                }`}
                activeOpacity={0.8}
                onPress={handleFuse}
                disabled={!canProceed}
                style={[
                  styles.fuseButton,
                  canProceed && styles.fuseButtonActive,
                ]}
              >
                <Text
                  className={`tracking-wider text-lg ${
                    canProceed ? 'text-offwhite' : 'text-ink-400'
                  }`}
                  style={{ fontFamily: 'Trajan', letterSpacing: 2 }}
                >
                  FUSE IMAGES
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        );
    }
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Floating Back Button - Immersive Style */}
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="absolute top-12 left-6 z-50 w-10 h-10 items-center justify-center rounded-full bg-white/20"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <FontAwesome name="chevron-left" size={20} color="#1a3d3d" />
        </TouchableOpacity>

        {renderContent()}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  fuseButton: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fuseButtonActive: {
    shadowColor: '#1a3d3d',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
