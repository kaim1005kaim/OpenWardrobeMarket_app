import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { FusionSpec } from '@/types/fusion';

interface FusionSpecViewProps {
  fusionSpec: FusionSpec;
  onGenerate: () => void;
  onBack: () => void;
}

export function FusionSpecView({ fusionSpec, onGenerate, onBack }: FusionSpecViewProps) {
  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Title */}
        <View className="px-6 pt-8 pb-6">
          <Text
            className="text-ink-900 text-center mb-3"
            style={{
              fontFamily: 'Trajan',
              fontSize: 32,
              letterSpacing: 4,
              fontWeight: '400',
            }}
          >
            FUSION PREVIEW
          </Text>
          <Text className="text-ink-600 text-center text-base leading-6">
            AIが抽出したデザイン要素
          </Text>
        </View>

        {/* Palette */}
        <View className="px-6 pb-6">
          <View className="bg-ink-50 rounded-2xl p-5">
            <Text
              className="text-ink-900 mb-4 tracking-wider"
              style={{ fontFamily: 'Trajan', fontSize: 14, letterSpacing: 1 }}
            >
              COLOR PALETTE
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {fusionSpec.palette.map((color, index) => (
                <View key={index} className="items-center">
                  <View
                    style={[
                      styles.colorSwatch,
                      {
                        backgroundColor: color.hex,
                      },
                    ]}
                  />
                  <Text className="text-ink-600 text-xs mt-2">{color.name}</Text>
                  <Text className="text-ink-500 text-xs">{Math.round(color.weight * 100)}%</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Silhouette */}
        <View className="px-6 pb-6">
          <View className="bg-ink-50 rounded-2xl p-5">
            <Text
              className="text-ink-900 mb-4 tracking-wider"
              style={{ fontFamily: 'Trajan', fontSize: 14, letterSpacing: 1 }}
            >
              SILHOUETTE
            </Text>
            <Text className="text-ink-900 font-semibold text-base capitalize">{fusionSpec.silhouette}</Text>
          </View>
        </View>

        {/* Materials */}
        <View className="px-6 pb-6">
          <View className="bg-ink-50 rounded-2xl p-5">
            <Text
              className="text-ink-900 mb-4 tracking-wider"
              style={{ fontFamily: 'Trajan', fontSize: 14, letterSpacing: 1 }}
            >
              MATERIALS
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {fusionSpec.materials.map((material, index) => (
                <View key={index} className="bg-white rounded-full px-4 py-2">
                  <Text className="text-ink-700 text-sm capitalize">{material}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Motif Abstractions */}
        <View className="px-6 pb-6">
          <View className="bg-ink-50 rounded-2xl p-5">
            <Text
              className="text-ink-900 mb-4 tracking-wider"
              style={{ fontFamily: 'Trajan', fontSize: 14, letterSpacing: 1 }}
            >
              DESIGN ELEMENTS
            </Text>
            {fusionSpec.motif_abstractions.map((motif, index) => (
              <View key={index} className="mb-4 last:mb-0">
                <Text className="text-ink-900 font-semibold mb-1 capitalize">{motif.operation}</Text>
                <Text className="text-ink-600 text-sm leading-5">{motif.notes}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Details */}
        <View className="px-6 pb-6">
          <View className="bg-ink-50 rounded-2xl p-5">
            <Text
              className="text-ink-900 mb-4 tracking-wider"
              style={{ fontFamily: 'Trajan', fontSize: 14, letterSpacing: 1 }}
            >
              DETAILS
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {fusionSpec.details.map((detail, index) => (
                <View key={index} className="bg-white rounded-full px-4 py-2">
                  <Text className="text-ink-700 text-sm">{detail}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="px-6 pb-12">
          <TouchableOpacity
            className="bg-darkTeal rounded-2xl py-5 items-center mb-3"
            activeOpacity={0.8}
            onPress={onGenerate}
            style={styles.generateButton}
          >
            <Text
              className="text-offwhite tracking-wider text-lg"
              style={{ fontFamily: 'Trajan', letterSpacing: 2 }}
            >
              GENERATE DESIGN
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="py-4 items-center"
            activeOpacity={0.7}
            onPress={onBack}
          >
            <Text className="text-ink-600 text-sm tracking-wider">
              やり直す
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  colorSwatch: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#EAEAEA',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  generateButton: {
    shadowColor: '#1a3d3d',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
