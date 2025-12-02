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
import { useAuth } from '@/contexts/AuthContext';

export default function FusionScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [fusionState, setFusionState] = useState<FusionState>({
    stage: 'UPLOAD',
    imageA: null,
    imageB: null,
    fusionSpec: null,
    generatedImageUrl: null,
    generationId: null,
    triptychUrls: null,
    quadtychUrls: null, // v4.0: Quadtych URLs
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

    if (!user) {
      Alert.alert(
        'ログインが必要です',
        'デザインを生成するにはログインしてください',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: 'ログインへ', onPress: () => router.replace('/login') },
        ]
      );
      return;
    }

    try {
      // Stage 1: ANALYZING
      setFusionState((prev) => ({ ...prev, stage: 'ANALYZING', error: null }));

      // Upload images to R2
      const [imageAUrl, imageBUrl] = await Promise.all([
        uploadImageToR2(fusionState.imageA!.uri, user.id),
        uploadImageToR2(fusionState.imageB!.uri, user.id),
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

    if (!user) {
      Alert.alert(
        'ログインが必要です',
        'デザイン生成を続けるにはログインしてください',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: 'ログインへ', onPress: () => router.replace('/login') },
        ]
      );
      return;
    }

    try {
      // Stage 3: GENERATING
      setFusionState((prev) => ({ ...prev, stage: 'GENERATING', error: null }));

      // Generate design with Gemini 3 Pro (v4.0: quadtych mode)
      const result = await generateDesign(fusionState.fusionSpec, user.id);
      console.log('[fusion] Generation result:', result);

      // Stage 4: REVEALING (will be implemented next)
      setFusionState((prev) => ({
        ...prev,
        stage: 'REVEALING',
        generationId: result.generationId,
        generatedImageUrl: result.imageUrl,
        triptychUrls: result.triptychUrls || null,
        quadtychUrls: result.quadtychUrls || null, // v4.0: Quadtych URLs
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
      quadtychUrls: null, // v4.0: Reset quadtych URLs
      error: null,
    });
  };

  const handleSaveToWardrobe = () => {
    console.log('[fusion] handleSaveToWardrobe called');
    console.log('[fusion] generationId:', fusionState.generationId);
    console.log('[fusion] generatedImageUrl:', fusionState.generatedImageUrl);

    if (!fusionState.generationId || !fusionState.generatedImageUrl) {
      console.log('[fusion] Missing data, showing alert');
      Alert.alert('エラー', '保存する画像が見つかりません');
      return;
    }

    console.log('[fusion] Navigating to publication-settings');
    // Navigate to Publication Settings screen
    router.push({
      pathname: '/publication-settings',
      params: {
        imageUrl: fusionState.generatedImageUrl,
        generationId: fusionState.generationId,
        fusionSpec: JSON.stringify(fusionState.fusionSpec),
        quadtychUrls: fusionState.quadtychUrls ? JSON.stringify(fusionState.quadtychUrls) : undefined,
      },
    });
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
            quadtychUrls={fusionState.quadtychUrls} // v4.0: Pass quadtych URLs
            onClose={handleBackToUpload}
            onSaveToWardrobe={handleSaveToWardrobe}
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
            <Text style={{ color: '#1A1A1A', fontSize: 24 }}>生成完了！</Text>
            <Text style={{ color: '#777777', marginTop: 16 }}>
              生成されたデザインが表示されます
            </Text>
          </View>
        );

      case 'UPLOAD':
      default:
        return (
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Description */}
            <View style={{ paddingHorizontal: 32, paddingTop: 24, paddingBottom: 40 }}>
              <Text style={{ color: '#777777', textAlign: 'center', fontSize: 13, lineHeight: 20 }}>
                2つの画像を融合させて{'\n'}
                新しいデザインを生成します
              </Text>
            </View>

            {/* Image Pickers */}
            <View style={{ paddingHorizontal: 24, paddingBottom: 40 }}>
              <View style={{ flexDirection: 'row', gap: 16 }}>
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
            <View style={{ paddingHorizontal: 24, paddingBottom: 40 }}>
              <View style={{ backgroundColor: '#FAFAFA', borderRadius: 12, padding: 18, borderWidth: 1, borderColor: '#ECECEC' }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <FontAwesome
                    name="info-circle"
                    size={16}
                    color="#1a3d3d"
                    style={{ marginRight: 12, marginTop: 1 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#3A3A3A', fontWeight: '600', marginBottom: 6, fontSize: 12 }}>
                      ヒント
                    </Text>
                    <Text style={{ color: '#666666', fontSize: 11, lineHeight: 17 }}>
                      • できるだけ明確で高品質な画像を使用してください{'\n'}
                      • 異なるスタイルや素材の組み合わせが面白い結果を生みます{'\n'}
                      • AIが2つの画像の特徴を分析して融合します
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Action Button */}
            <View style={{ paddingHorizontal: 24, paddingBottom: 60 }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleFuse}
                disabled={!canProceed}
                style={[
                  {
                    borderRadius: 16,
                    paddingVertical: 20,
                    alignItems: 'center',
                    backgroundColor: canProceed ? '#1a3d3d' : '#DCDCDC',
                  },
                  styles.fuseButton,
                  canProceed && styles.fuseButtonActive,
                ]}
              >
                <Text
                  style={{
                    fontFamily: 'Trajan',
                    letterSpacing: 2,
                    fontSize: 18,
                    color: canProceed ? '#FAFAF7' : '#999999',
                  }}
                >
                  ANALYZE
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F0E9' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Back Button - Icon Only */}
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{
            position: 'absolute',
            top: 16,
            left: 24,
            zIndex: 50,
            padding: 8,
          }}
        >
          <FontAwesome name="chevron-left" size={24} color="#1a3d3d" />
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
