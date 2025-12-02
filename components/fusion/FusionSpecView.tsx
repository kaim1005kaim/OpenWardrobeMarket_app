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
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Title */}
        <View style={{ paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24 }}>
          <Text
            style={{
              fontFamily: 'Trajan',
              fontSize: 32,
              letterSpacing: 4,
              fontWeight: '400',
              color: '#1A1A1A',
              textAlign: 'center',
              marginBottom: 12,
            }}
          >
            FUSION PREVIEW
          </Text>
          <Text style={{ color: '#777777', textAlign: 'center', fontSize: 16, lineHeight: 24 }}>
            AIが抽出したデザイン要素
          </Text>
        </View>

        {/* Palette */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
          <View style={{ backgroundColor: '#F5F5F3', borderRadius: 16, padding: 20 }}>
            <Text
              style={{ fontFamily: 'Trajan', fontSize: 14, letterSpacing: 1, color: '#1A1A1A', marginBottom: 16 }}
            >
              COLOR PALETTE
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {fusionSpec.palette.map((color, index) => (
                <View key={index} style={{ alignItems: 'center' }}>
                  <View
                    style={[
                      styles.colorSwatch,
                      {
                        backgroundColor: color.hex,
                      },
                    ]}
                  />
                  <Text style={{ color: '#777777', fontSize: 12, marginTop: 8 }}>{color.name}</Text>
                  <Text style={{ color: '#999999', fontSize: 12 }}>{Math.round(color.weight * 100)}%</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Silhouette */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
          <View style={{ backgroundColor: '#F5F5F3', borderRadius: 16, padding: 20 }}>
            <Text
              style={{ fontFamily: 'Trajan', fontSize: 14, letterSpacing: 1, color: '#1A1A1A', marginBottom: 16 }}
            >
              SILHOUETTE
            </Text>
            <Text style={{ color: '#1A1A1A', fontWeight: '600', fontSize: 16, textTransform: 'capitalize' }}>{fusionSpec.silhouette}</Text>
          </View>
        </View>

        {/* Materials */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
          <View style={{ backgroundColor: '#F5F5F3', borderRadius: 16, padding: 20 }}>
            <Text
              style={{ fontFamily: 'Trajan', fontSize: 14, letterSpacing: 1, color: '#1A1A1A', marginBottom: 16 }}
            >
              MATERIALS
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {fusionSpec.materials.map((material, index) => (
                <View key={index} style={{ backgroundColor: '#FFFFFF', borderRadius: 9999, paddingHorizontal: 16, paddingVertical: 8 }}>
                  <Text style={{ color: '#3A3A3A', fontSize: 14, textTransform: 'capitalize' }}>{material}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Motif Abstractions */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
          <View style={{ backgroundColor: '#F5F5F3', borderRadius: 16, padding: 20 }}>
            <Text
              style={{ fontFamily: 'Trajan', fontSize: 14, letterSpacing: 1, color: '#1A1A1A', marginBottom: 16 }}
            >
              DESIGN ELEMENTS
            </Text>
            {fusionSpec.motif_abstractions.map((motif, index) => (
              <View key={index} style={{ marginBottom: index === fusionSpec.motif_abstractions.length - 1 ? 0 : 16 }}>
                <Text style={{ color: '#1A1A1A', fontWeight: '600', marginBottom: 4, textTransform: 'capitalize' }}>{motif.operation}</Text>
                <Text style={{ color: '#777777', fontSize: 14, lineHeight: 20 }}>{motif.notes}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Details */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
          <View style={{ backgroundColor: '#F5F5F3', borderRadius: 16, padding: 20 }}>
            <Text
              style={{ fontFamily: 'Trajan', fontSize: 14, letterSpacing: 1, color: '#1A1A1A', marginBottom: 16 }}
            >
              DETAILS
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {fusionSpec.details.map((detail, index) => (
                <View key={index} style={{ backgroundColor: '#FFFFFF', borderRadius: 9999, paddingHorizontal: 16, paddingVertical: 8 }}>
                  <Text style={{ color: '#3A3A3A', fontSize: 14 }}>{detail}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 48 }}>
          <TouchableOpacity
            style={[
              styles.generateButton,
              { backgroundColor: '#1a3d3d', borderRadius: 16, paddingVertical: 20, alignItems: 'center', marginBottom: 12 }
            ]}
            activeOpacity={0.8}
            onPress={onGenerate}
          >
            <Text
              style={{ fontFamily: 'Trajan', letterSpacing: 2, color: '#FAFAF7', fontSize: 18 }}
            >
              GENERATE DESIGN
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ paddingVertical: 16, alignItems: 'center' }}
            activeOpacity={0.7}
            onPress={onBack}
          >
            <Text style={{ color: '#777777', fontSize: 14, letterSpacing: 1 }}>
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
