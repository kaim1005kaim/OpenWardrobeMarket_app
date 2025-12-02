import { apiClient } from './api-client';
import { FusionSpec } from '@/types/fusion';

export interface GeneratedMetadata {
  title: string;
  description: string;
  tags: string[];
}

/**
 * Generate metadata (title, description, tags) for a design using Gemini
 * Based on the fusion spec and generated image
 */
export async function generateMetadata(
  imageUrl: string,
  fusionSpec: FusionSpec
): Promise<GeneratedMetadata> {
  try {
    console.log('[gemini-metadata] Generating metadata for:', imageUrl);

    // Fetch the image and convert to base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    const imageBlob = await imageResponse.blob();
    const base64Image = await blobToBase64(imageBlob);

    // Extract base64 data (remove data URL prefix)
    const base64Data = base64Image.split(',')[1];

    // Call Gemini analyze-image API (since generate-metadata doesn't exist yet)
    // We'll use the existing analyze-image endpoint and parse its response
    const response = await apiClient.post('/api/gemini/analyze-image', {
      imageData: base64Data,
      mimeType: 'image/png',
    });

    console.log('[gemini-metadata] Gemini response:', response);

    // Generate title from fusion concept
    const title = generateTitleFromSpec(fusionSpec);

    // Use AI description or fallback to fusion concept
    const description = response.description || fusionSpec.fusion_concept || '';

    // Combine AI tags with fusion spec keywords
    const aiTags = response.tags || [];
    const specTags = [
      fusionSpec.silhouette,
      ...fusionSpec.materials.slice(0, 2),
      ...fusionSpec.emotional_keywords.slice(0, 3),
    ].filter(Boolean);

    const tags = [...new Set([...aiTags, ...specTags])].slice(0, 10);

    console.log('[gemini-metadata] Generated metadata:', { title, description, tags });

    return {
      title,
      description,
      tags,
    };
  } catch (error) {
    console.error('[gemini-metadata] Error:', error);

    // Fallback to fusion spec-based metadata
    return generateFallbackMetadata(fusionSpec);
  }
}

/**
 * Generate a creative title from fusion spec
 */
function generateTitleFromSpec(fusionSpec: FusionSpec): string {
  const color = fusionSpec.palette[0]?.name || 'Mixed';
  const material = fusionSpec.materials[0] || 'Fabric';
  const keyword = fusionSpec.emotional_keywords[0] || '';

  // Create variations
  const templates = [
    `${color} ${fusionSpec.silhouette}`,
    `${keyword} ${fusionSpec.silhouette} in ${color}`,
    `${material} ${fusionSpec.silhouette}`,
    `${fusionSpec.silhouette} with ${color} ${material}`,
  ];

  // Pick the first non-empty template
  return templates.find((t) => t.trim().length > 0) || 'Untitled Design';
}

/**
 * Generate fallback metadata from fusion spec if Gemini fails
 */
function generateFallbackMetadata(fusionSpec: FusionSpec): GeneratedMetadata {
  // Safety check
  if (!fusionSpec) {
    return {
      title: 'Untitled Design',
      description: 'A unique fashion design',
      tags: ['fashion', 'design'],
    };
  }

  const materials = fusionSpec.materials?.join(', ') || 'premium materials';
  const colors = fusionSpec.palette?.map((c) => c.name).join(', ') || 'mixed colors';
  const keywords = fusionSpec.emotional_keywords?.join(', ') || '';

  // Generate a simple title
  const title = `${fusionSpec.silhouette || 'Design'} in ${fusionSpec.palette?.[0]?.name || 'Mixed Colors'}`;

  // Generate a simple description
  const description = fusionSpec.fusion_concept || `A ${(fusionSpec.silhouette || 'unique').toLowerCase()} design crafted with ${materials}.`;

  // Generate tags from fusion spec
  const tags = [
    fusionSpec.silhouette,
    ...(fusionSpec.materials || []).slice(0, 3),
    ...(fusionSpec.palette || []).slice(0, 2).map((c) => c.name),
    ...(fusionSpec.emotional_keywords || []).slice(0, 3),
  ].filter(Boolean);

  return {
    title,
    description,
    tags: tags.length > 0 ? tags : ['fashion', 'design'],
  };
}

/**
 * Convert Blob to base64 string
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
