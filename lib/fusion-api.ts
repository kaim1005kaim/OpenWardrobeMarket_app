import { FusionSpec } from '@/types/fusion';
import { apiClient } from './api-client';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { generateImageWithGoogleAI } from './google-ai-client';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

// Maximum base64 size to avoid PAYLOAD_TOO_LARGE (roughly 1.5MB after base64 encoding)
const MAX_BASE64_SIZE = 1_000_000;

export interface AnalyzeFusionRequest {
  imageAUrl: string;
  imageBUrl: string;
}

export interface AnalyzeFusionResponse {
  fusionSpec: FusionSpec;
}

export interface GenerateDesignRequest {
  fusionSpec: FusionSpec;
  userId?: string;
}

export interface GenerateDesignResponse {
  generationId: string;
  imageUrl: string;
  thumbnailUrl?: string;
}

/**
 * Convert URL to base64 with automatic resizing to prevent payload size issues
 */
async function urlToBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  console.log('[urlToBase64] Starting conversion for:', url);

  // Step 1: Resize image to max 1024x1024 with aggressive compression
  const manipulatedImage = await ImageManipulator.manipulateAsync(
    url,
    [
      { resize: { width: 1024 } }, // Max width 1024, height auto-scaled
    ],
    {
      compress: 0.3, // Very aggressive compression (0.0-1.0)
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  console.log('[urlToBase64] Resized image URI:', manipulatedImage.uri);

  // Step 2: Convert to base64
  const response = await fetch(manipulatedImage.uri);
  const blob = await response.blob();

  console.log('[urlToBase64] Blob size:', blob.size, 'bytes');

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Extract base64 data (remove "data:image/jpeg;base64," prefix)
      const base64 = result.split(',')[1];
      const mimeType = 'image/jpeg'; // Always JPEG after manipulation

      console.log('[urlToBase64] Base64 size:', base64.length, 'chars');

      // Check if still too large
      if (base64.length > MAX_BASE64_SIZE) {
        console.warn('[urlToBase64] WARNING: Base64 still large:', base64.length, 'chars');
      }

      resolve({ base64, mimeType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Analyze single image using Gemini Vision
 */
async function analyzeSingleImage(
  imageUrl: string
): Promise<FusionSpec> {
  console.log('[analyzeSingleImage] Converting URL to base64:', imageUrl);
  const { base64, mimeType } = await urlToBase64(imageUrl);
  console.log('[analyzeSingleImage] Base64 length:', base64.length);
  console.log('[analyzeSingleImage] MIME type:', mimeType);

  const response = await fetch(`${API_BASE_URL}/api/gemini/analyze-fusion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageData: base64,
      mimeType,
      generateInspiration: false, // We'll generate inspiration after merging
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[analyzeSingleImage] Error response:', errorText);
    throw new Error(`分析に失敗しました: ${response.status}`);
  }

  const spec = await response.json();
  console.log('[analyzeSingleImage] Analysis result:', spec);
  return spec as FusionSpec;
}

/**
 * Merge two FusionSpecs by combining their properties
 */
function mergeFusionSpecs(specA: FusionSpec, specB: FusionSpec): FusionSpec {
  try {
    console.log('[mergeFusionSpecs] === MERGE START ===');
    console.log('[mergeFusionSpecs] Input specA:', JSON.stringify(specA, null, 2));
    console.log('[mergeFusionSpecs] Input specB:', JSON.stringify(specB, null, 2));

    // Validate inputs
    if (!specA || typeof specA !== 'object') {
      console.error('[mergeFusionSpecs] Invalid specA:', specA);
      throw new Error('specA is not a valid object');
    }
    if (!specB || typeof specB !== 'object') {
      console.error('[mergeFusionSpecs] Invalid specB:', specB);
      throw new Error('specB is not a valid object');
    }

    // Ensure arrays exist with detailed logging
    console.log('[mergeFusionSpecs] Extracting palette arrays...');
    const paletteA = Array.isArray(specA.palette) ? specA.palette : [];
    const paletteB = Array.isArray(specB.palette) ? specB.palette : [];
    console.log('[mergeFusionSpecs] paletteA length:', paletteA.length);
    console.log('[mergeFusionSpecs] paletteB length:', paletteB.length);

    console.log('[mergeFusionSpecs] Extracting materials arrays...');
    const materialsA = Array.isArray(specA.materials) ? specA.materials : [];
    const materialsB = Array.isArray(specB.materials) ? specB.materials : [];
    console.log('[mergeFusionSpecs] materialsA length:', materialsA.length);
    console.log('[mergeFusionSpecs] materialsB length:', materialsB.length);

    console.log('[mergeFusionSpecs] Extracting motif_abstractions arrays...');
    const motifAbsA = Array.isArray(specA.motif_abstractions) ? specA.motif_abstractions : [];
    const motifAbsB = Array.isArray(specB.motif_abstractions) ? specB.motif_abstractions : [];
    console.log('[mergeFusionSpecs] motifAbsA length:', motifAbsA.length);
    console.log('[mergeFusionSpecs] motifAbsB length:', motifAbsB.length);

    console.log('[mergeFusionSpecs] Extracting details arrays...');
    const detailsA = Array.isArray(specA.details) ? specA.details : [];
    const detailsB = Array.isArray(specB.details) ? specB.details : [];
    console.log('[mergeFusionSpecs] detailsA length:', detailsA.length);
    console.log('[mergeFusionSpecs] detailsB length:', detailsB.length);

    // Merge palettes (take top colors from each, normalize weights)
    console.log('[mergeFusionSpecs] Merging palettes...');
    const mergedPalette = [
      ...(paletteA.length > 0 ? paletteA.slice(0, 2) : []),
      ...(paletteB.length > 0 ? paletteB.slice(0, 1) : []),
    ];
    console.log('[mergeFusionSpecs] Merged palette length:', mergedPalette.length);

    const totalWeight = mergedPalette.reduce((sum, c) => sum + (c?.weight || 0), 0);
    console.log('[mergeFusionSpecs] Total weight:', totalWeight);
    if (totalWeight > 0) {
      mergedPalette.forEach(c => {
        if (c) c.weight /= totalWeight;
      });
    }

    // Merge silhouettes (pick from A)
    console.log('[mergeFusionSpecs] Merging silhouettes...');
    const silhouette = specA.silhouette || specB.silhouette || 'oversized';
    console.log('[mergeFusionSpecs] Silhouette:', silhouette);

    // Merge materials (combine unique materials)
    console.log('[mergeFusionSpecs] Merging materials...');
    const materialsSet = new Set([
      ...materialsA,
      ...materialsB,
    ]);
    const materials = Array.from(materialsSet).slice(0, 3);
    console.log('[mergeFusionSpecs] Merged materials:', materials);

    // Merge motif_abstractions (take one from each)
    console.log('[mergeFusionSpecs] Merging motif_abstractions...');
    const motif_abstractions = [
      ...(motifAbsA.length > 0 ? motifAbsA.slice(0, 2) : []),
      ...(motifAbsB.length > 0 ? motifAbsB.slice(0, 1) : []),
    ];
    console.log('[mergeFusionSpecs] Merged motif_abstractions length:', motif_abstractions.length);

    // Merge details (combine unique details)
    console.log('[mergeFusionSpecs] Merging details...');
    const detailsSet = new Set([
      ...detailsA,
      ...detailsB,
    ]);
    const details = Array.from(detailsSet).slice(0, 5);
    console.log('[mergeFusionSpecs] Merged details:', details);

    const result = {
      palette: mergedPalette,
      silhouette,
      materials,
      motif_abstractions,
      details,
    };

    console.log('[mergeFusionSpecs] === MERGE SUCCESS ===');
    console.log('[mergeFusionSpecs] Result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('[mergeFusionSpecs] === MERGE FAILED ===');
    console.error('[mergeFusionSpecs] Error:', error);
    console.error('[mergeFusionSpecs] Error stack:', error instanceof Error ? error.stack : 'N/A');
    throw new Error(`マージに失敗しました: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Analyze two images using Gemini Vision to extract FusionSpec
 */
export async function analyzeFusion(
  imageAUrl: string,
  imageBUrl: string
): Promise<FusionSpec> {
  try {
    console.log('[analyzeFusion] Analyzing image A:', imageAUrl);
    console.log('[analyzeFusion] Analyzing image B:', imageBUrl);

    // Analyze both images in parallel
    const [specA, specB] = await Promise.all([
      analyzeSingleImage(imageAUrl),
      analyzeSingleImage(imageBUrl),
    ]);

    console.log('[analyzeFusion] Merging specs...');
    const mergedSpec = mergeFusionSpecs(specA, specB);

    console.log('[analyzeFusion] Final merged spec:', mergedSpec);
    return mergedSpec;
  } catch (error) {
    console.error('Failed to analyze fusion:', error);
    throw new Error('画像の分析に失敗しました');
  }
}

/**
 * Convert FusionSpec to fashion prompt
 */
function fusionSpecToPrompt(spec: FusionSpec): string {
  // Build color description
  const colors = spec.palette
    .map((c) => `${c.name} (${Math.round(c.weight * 100)}%)`)
    .join(', ');

  // Build materials list
  const materials = spec.materials.join(', ');

  // Build motif descriptions
  const motifs = spec.motif_abstractions
    .map((m) => `${m.operation} with ${m.style} style at ${m.scale} scale on ${m.placement.join('/')}`)
    .join('; ');

  // Build details
  const details = spec.details.join(', ');

  // Construct comprehensive prompt
  const prompt = `Fashion design with ${spec.silhouette} silhouette. ` +
    `Color palette: ${colors}. ` +
    `Materials: ${materials}. ` +
    `Design elements: ${motifs}. ` +
    `Details: ${details}. ` +
    `Professional fashion photography, full body shot, studio lighting, clean background.`;

  return prompt;
}

/**
 * Generate design using Nano Banana Pro (Gemini 3 Pro Image Preview) based on FusionSpec
 * v2.2: Hybrid mode - Direct API for production, Vercel for development
 */
export async function generateDesign(
  fusionSpec: FusionSpec,
  userId?: string
): Promise<{ generationId: string; imageUrl: string; triptychUrls?: any }> {
  const mode = process.env.EXPO_PUBLIC_FUSION_MODE || 'vercel';
  console.log(`[generateDesign] FUSION Mode: ${mode}`);

  try {
    if (mode === 'direct') {
      // Direct Google AI API (for production/real device)
      console.log('[generateDesign] Using direct Google AI API...');
      const { imageUrl, assetId } = await generateImageWithGoogleAI(fusionSpec);

      return {
        generationId: assetId,
        imageUrl,
      };
    } else {
      // Via Vercel backend (for development/simulator)
      console.log('[generateDesign] Using Vercel backend...');
      return await generateViaVercel(fusionSpec, userId);
    }
  } catch (error: any) {
    console.error('[generateDesign] === GENERATION FAILED ===');
    console.error('[generateDesign] Error:', error);
    console.error('[generateDesign] Error message:', error.message);

    if (error.message) {
      throw new Error(`デザインの生成に失敗しました: ${error.message}`);
    } else {
      throw new Error('デザインの生成に失敗しました');
    }
  }
}

/**
 * Generate via Vercel backend (for development/simulator)
 * v3.0: Enable triptych generation for single-shot consistency
 */
async function generateViaVercel(
  fusionSpec: FusionSpec,
  userId?: string
): Promise<{ generationId: string; imageUrl: string; triptychUrls?: any }> {
  console.log('[generateViaVercel] Step 1: Generate triptych image via Vercel...');
  console.log('[generateViaVercel] fusionSpec:', JSON.stringify(fusionSpec, null, 2));

  // Build request payload
  const prompt = fusionSpecToPrompt(fusionSpec);
  console.log('[generateViaVercel] Generated prompt:', prompt);
  console.log('[generateViaVercel] Prompt length:', prompt.length);
  console.log('[generateViaVercel] DNA (fusionSpec) keys:', Object.keys(fusionSpec));

  const requestPayload = {
    prompt,
    enableTriptych: true, // Enable triptych generation
    fusionConcept: fusionSpec.fusion_concept,
    dna: fusionSpec,
    userId,
  };

  console.log('[generateViaVercel] Request payload keys:', Object.keys(requestPayload));
  console.log('[generateViaVercel] Request payload.prompt exists:', !!requestPayload.prompt);
  console.log('[generateViaVercel] Request payload.dna exists:', !!requestPayload.dna);

  // Step 1: Generate triptych image (returns base64 for front/side/back)
  const response = await apiClient.post<{
    success: boolean;
    triptych?: boolean;
    imageData?: string | { front: string; side: string; back: string };
    mimeType: string;
    metadata: any;
  }>('/api/nano/generate', requestPayload);

  if (!response.success || !response.imageData) {
    throw new Error('Failed to generate image: No image data received');
  }

  // Check if triptych response
  const isTriptych = response.triptych && typeof response.imageData === 'object';
  console.log('[generateViaVercel] Triptych mode:', isTriptych);

  if (isTriptych) {
    // Handle triptych response (front/side/back panels)
    const triptychData = response.imageData as { front: string; side: string; back: string };
    console.log('[generateViaVercel] Step 2: Upload triptych panels to R2...');
    console.log('[generateViaVercel] Triptych data keys:', Object.keys(triptychData));
    console.log('[generateViaVercel] Front data exists:', !!triptychData.front, 'length:', triptychData.front?.length);
    console.log('[generateViaVercel] Side data exists:', !!triptychData.side, 'length:', triptychData.side?.length);
    console.log('[generateViaVercel] Back data exists:', !!triptychData.back, 'length:', triptychData.back?.length);

    // Validate triptych data
    if (!triptychData.front || !triptychData.side || !triptychData.back) {
      throw new Error(`Missing triptych panel data: front=${!!triptychData.front}, side=${!!triptychData.side}, back=${!!triptychData.back}`);
    }

    // Upload all 3 panels in parallel
    const [frontUrl, sideUrl, backUrl] = await Promise.all([
      uploadPanelToR2(triptychData.front, 'front', userId, response.mimeType),
      uploadPanelToR2(triptychData.side, 'side', userId, response.mimeType),
      uploadPanelToR2(triptychData.back, 'back', userId, response.mimeType),
    ]);

    console.log('[generateViaVercel] Triptych panels uploaded:', { frontUrl, sideUrl, backUrl });

    // Step 3: Save to database
    const saveResponse = await apiClient.post<{
      generationId: string;
      imageUrl: string;
    }>('/api/save-generation', {
      imageUrl: frontUrl,
      imageKey: extractKeyFromUrl(frontUrl),
      metadata: {
        ...response.metadata,
        triptych: true,
        sideUrl,
        backUrl,
      },
      userId,
    });

    console.log('[generateViaVercel] ✅ Triptych generation complete');

    return {
      generationId: saveResponse.generationId,
      imageUrl: frontUrl,
      triptychUrls: {
        front: frontUrl,
        side: sideUrl,
        back: backUrl,
      },
    };
  }

  // Legacy single image flow
  console.log('[generateViaVercel] Step 2: Write base64 to temp file...');

  // Step 2: Write base64 to temporary file using expo-file-system
  const tempUri = FileSystem.cacheDirectory + `temp_${Date.now()}.jpg`;
  await FileSystem.writeAsStringAsync(tempUri, response.imageData as string, {
    encoding: FileSystem.EncodingType.Base64,
  });

  console.log('[generateViaVercel] Step 3: Get presigned URL...');

  // Step 3: Generate R2 key and get presigned URL
  const ext = response.mimeType.includes('webp') ? 'webp' : 'jpg';
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(7);
  const key = `generated/${userId || 'anonymous'}/${yyyy}/${mm}/${timestamp}-${randomStr}.${ext}`;

  const presignUrl = `${API_BASE_URL}/api/r2-presign?key=${encodeURIComponent(key)}&contentType=${encodeURIComponent(response.mimeType)}`;
  const presignResponse = await fetch(presignUrl);

  if (!presignResponse.ok) {
    const errorText = await presignResponse.text();
    console.error('[generateViaVercel] Presign error:', errorText);
    throw new Error(`Failed to get presigned URL: ${presignResponse.status}`);
  }

  const presignData = await presignResponse.json();
  console.log('[generateViaVercel] Presign response:', presignData);
  const { uploadUrl } = presignData;

  console.log('[generateViaVercel] Step 4: Upload to R2 using presigned URL...');
  console.log('[generateViaVercel] Upload URL:', uploadUrl);
  console.log('[generateViaVercel] Temp file:', tempUri);

  // Step 4: Upload directly to R2 using presigned URL
  try {
    // Use FOREGROUND session if available
    const sessionType = FileSystem.FileSystemSessionType?.FOREGROUND
      ? FileSystem.FileSystemSessionType.FOREGROUND
      : FileSystem.FileSystemSessionType.BACKGROUND;

    console.log('[generateViaVercel] Starting upload with sessionType:', sessionType);

    const uploadTask = FileSystem.createUploadTask(
      uploadUrl,
      tempUri,
      {
        httpMethod: 'PUT',
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: {
          'Content-Type': response.mimeType,
        },
        sessionType: sessionType,
      },
      (data) => {
        const progress = data.totalBytesSent / data.totalBytesExpectedToSend;
        console.log(`[generateViaVercel] Upload progress: ${Math.round(progress * 100)}%`);
      }
    );

    const uploadResponse = await uploadTask.uploadAsync();

    if (!uploadResponse) {
      throw new Error('Upload response is null');
    }

    console.log('[generateViaVercel] Upload response status:', uploadResponse.status);
    console.log('[generateViaVercel] Upload response:', JSON.stringify(uploadResponse));

    // R2 returns 200 or 204 for successful PUT requests
    if (uploadResponse.status !== 200 && uploadResponse.status !== 204) {
      throw new Error(`R2 upload failed: ${uploadResponse.status}`);
    }
  } catch (uploadError: any) {
    console.error('[generateViaVercel] Upload error:', uploadError);
    console.error('[generateViaVercel] Upload error message:', uploadError?.message);
    throw uploadError;
  }

  console.log('[generateViaVercel] Step 5: Save to database...');

  // Step 5: Save DB records via API
  const publicBaseUrl = process.env.EXPO_PUBLIC_R2_PUBLIC_BASE_URL || 'https://assets.open-wardrobe-market.com';
  const finalUrl = `${publicBaseUrl}/${key}`;

  let saveResponse;
  try {
    saveResponse = await apiClient.post<{
      generationId: string;
      imageUrl: string;
    }>('/api/save-generation', {
      imageUrl: finalUrl,
      imageKey: key,
      metadata: response.metadata,
      userId,
    });
  } catch (saveError: any) {
    const data = saveError?.response?.data;
    console.error('[generateViaVercel] save-generation failed:', {
      status: saveError?.response?.status,
      data,
      message: saveError?.message,
    });
    throw new Error(
      data?.error || data?.details || `save-generation failed: ${saveError?.response?.status || saveError?.message}`
    );
  }

  // Cleanup temporary file
  await FileSystem.deleteAsync(tempUri, { idempotent: true });

  console.log('[generateViaVercel] ✅ Complete:', finalUrl);

  return {
    generationId: saveResponse.generationId,
    imageUrl: finalUrl,
  };
}

/**
 * Upload a single triptych panel to R2
 */
async function uploadPanelToR2(
  base64Data: string,
  panelType: 'front' | 'side' | 'back',
  userId?: string,
  mimeType: string = 'image/jpeg'
): Promise<string> {
  console.log(`[uploadPanelToR2] Uploading ${panelType} panel...`);

  // Write base64 to temp file
  const tempUri = FileSystem.cacheDirectory + `${panelType}_${Date.now()}.jpg`;
  await FileSystem.writeAsStringAsync(tempUri, base64Data, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Generate R2 key
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(7);
  const key = `fusion/${userId || 'anonymous'}/${yyyy}/${mm}/${timestamp}-${panelType}-${randomStr}.jpg`;

  // Get presigned URL
  const presignUrl = `${API_BASE_URL}/api/r2-presign?key=${encodeURIComponent(key)}&contentType=${encodeURIComponent(mimeType)}`;
  const presignResponse = await fetch(presignUrl);

  if (!presignResponse.ok) {
    throw new Error(`Failed to get presigned URL for ${panelType}: ${presignResponse.status}`);
  }

  const { uploadUrl } = await presignResponse.json();

  // Upload to R2
  const sessionType = FileSystem.FileSystemSessionType?.FOREGROUND
    ? FileSystem.FileSystemSessionType.FOREGROUND
    : FileSystem.FileSystemSessionType.BACKGROUND;

  const uploadTask = FileSystem.createUploadTask(
    uploadUrl,
    tempUri,
    {
      httpMethod: 'PUT',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers: { 'Content-Type': mimeType },
      sessionType,
    }
  );

  const uploadResponse = await uploadTask.uploadAsync();

  if (!uploadResponse || (uploadResponse.status !== 200 && uploadResponse.status !== 204)) {
    throw new Error(`${panelType} panel upload failed: ${uploadResponse?.status}`);
  }

  // Cleanup temp file
  await FileSystem.deleteAsync(tempUri, { idempotent: true });

  // Build public URL
  const publicBaseUrl = process.env.EXPO_PUBLIC_R2_PUBLIC_BASE_URL || 'https://assets.open-wardrobe-market.com';
  const finalUrl = `${publicBaseUrl}/${key}`;

  console.log(`[uploadPanelToR2] ${panelType} panel uploaded:`, finalUrl);
  return finalUrl;
}

/**
 * Extract R2 key from full public URL
 */
function extractKeyFromUrl(url: string): string {
  const publicBaseUrl = process.env.EXPO_PUBLIC_R2_PUBLIC_BASE_URL || 'https://assets.open-wardrobe-market.com';
  return url.replace(`${publicBaseUrl}/`, '');
}

/**
 * Upload image to R2 via /api/upload-to-r2 endpoint (server-side upload with anonymous support)
 */
export async function uploadImageToR2(
  imageUri: string,
  userId?: string
): Promise<string> {
  try {
    console.log('[uploadImageToR2] Starting presigned upload for:', imageUri);

    // Determine content type
    const filename = imageUri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const extension = match ? match[1] : 'jpg';
    const mimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;

    // Generate key and presign URL
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    const key = `fusion/${userId || 'anonymous'}/${yyyy}/${mm}/${timestamp}-${randomStr}.${extension}`;

    const presignUrl = `${API_BASE_URL}/api/r2-presign?key=${encodeURIComponent(
      key
    )}&contentType=${encodeURIComponent(mimeType)}`;
    const presignResponse = await fetch(presignUrl);

    if (!presignResponse.ok) {
      const errorText = await presignResponse.text();
      console.error('[uploadImageToR2] Presign error:', errorText);
      throw new Error(`Failed to get presigned URL: ${presignResponse.status}`);
    }

    const presignData = await presignResponse.json();
    const uploadUrl = presignData.uploadUrl || presignData.url;

    if (!uploadUrl) {
      throw new Error('Presigned upload URL is missing in response');
    }

    console.log('[uploadImageToR2] Uploading to R2 with key:', key);

    // Use FOREGROUND session when available to avoid simulator background session issues
    const sessionType = FileSystem.FileSystemSessionType?.FOREGROUND
      ? FileSystem.FileSystemSessionType.FOREGROUND
      : FileSystem.FileSystemSessionType.BACKGROUND;

    const uploadTask = FileSystem.createUploadTask(
      uploadUrl,
      imageUri,
      {
        httpMethod: 'PUT',
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: {
          'Content-Type': mimeType,
        },
        sessionType,
      },
      (data) => {
        const progress = data.totalBytesSent / data.totalBytesExpectedToSend;
        console.log(`[uploadImageToR2] Upload progress: ${Math.round(progress * 100)}%`);
      }
    );

    const uploadResponse = await uploadTask.uploadAsync();

    if (!uploadResponse) {
      throw new Error('Upload response is null');
    }

    console.log('[uploadImageToR2] Upload response status:', uploadResponse.status);

    if (uploadResponse.status !== 200 && uploadResponse.status !== 204) {
      throw new Error(`R2 upload failed: ${uploadResponse.status}`);
    }

    // Build public URL
    const publicBaseUrl =
      process.env.EXPO_PUBLIC_R2_PUBLIC_BASE_URL || 'https://assets.open-wardrobe-market.com';
    const finalUrl = `${publicBaseUrl}/${key}`;

    console.log('[uploadImageToR2] Upload successful:', finalUrl);
    return finalUrl;

  } catch (error) {
    console.error('[uploadImageToR2] Failed to upload image:', error);
    throw new Error('画像のアップロードに失敗しました');
  }
}

/**
 * Poll for variant generation status
 */
export async function pollVariantStatus(
  generationId: string
): Promise<{ side?: string; back?: string }> {
  try {
    const response = await apiClient.get<{
      variants: Array<{
        variant_type: 'SIDE' | 'BACK';
        status: string;
        image_url: string | null;
      }>;
    }>(`/api/variants/${generationId}/status`);

    const sideVariant = response.variants.find((v) => v.variant_type === 'SIDE');
    const backVariant = response.variants.find((v) => v.variant_type === 'BACK');

    return {
      side: sideVariant?.image_url || undefined,
      back: backVariant?.image_url || undefined,
    };
  } catch (error) {
    console.error('Failed to poll variant status:', error);
    return {};
  }
}
