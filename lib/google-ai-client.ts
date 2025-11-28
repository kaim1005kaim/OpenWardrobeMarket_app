import { FusionSpec } from '@/types/fusion';
import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';

const GOOGLE_AI_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY!;

if (!GOOGLE_AI_API_KEY) {
  throw new Error('EXPO_PUBLIC_GOOGLE_AI_API_KEY is not configured');
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
 * Generate image directly using Google AI Gemini 3 Pro Image Preview
 * Bypasses Vercel backend to avoid SSL/TLS issues
 */
export async function generateImageWithGoogleAI(
  fusionSpec: FusionSpec
): Promise<{
  imageUrl: string;
  key: string;
  assetId: string;
}> {
  try {
    console.log('[google-ai-client] Starting image generation...');
    console.log('[google-ai-client] FusionSpec:', JSON.stringify(fusionSpec, null, 2));

    // Convert FusionSpec to prompt
    const prompt = fusionSpecToPrompt(fusionSpec);
    console.log('[google-ai-client] Generated prompt:', prompt);

    // Add negative prompt elements
    const cleanNegative = 'blurry, low quality, distorted, watermark, signature'
      .replace(/no watermark|no signature/gi, '')
      .replace(/,,/g, ',')
      .trim();

    const fullPrompt = `${prompt} | single model | one person only | clean minimal background | fashion lookbook style | full body composition | professional fashion photography${cleanNegative ? `. Negative: ${cleanNegative}` : ''
      }`;

    console.log('[google-ai-client] Full prompt:', fullPrompt);

    // Generate image using Google AI REST API (Gemini 3 Pro Image Preview)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${GOOGLE_AI_API_KEY}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: fullPrompt }],
          },
        ],
        generationConfig: {
          imageConfig: {
            aspectRatio: '3:4',
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[google-ai-client] Google AI API error:', errorText);
      throw new Error(`Google AI API error: ${response.status}`);
    }

    const data = await response.json();
    const parts: any[] = data.candidates?.[0]?.content?.parts ?? [];
    const inline = parts.find((p: any) => p.inlineData)?.inlineData;

    if (!inline?.data) {
      console.error('[google-ai-client] No image data in response');
      throw new Error('画像生成に失敗しました');
    }

    console.log('[google-ai-client] Image generated successfully');

    // Upload to R2
    const imageUrl = await uploadGeneratedImageToR2(
      inline.data,
      inline.mimeType || 'image/png'
    );

    console.log('[google-ai-client] Uploaded to R2:', imageUrl);

    // Save to Supabase
    const assetId = await saveToSupabase(imageUrl, fusionSpec);

    console.log('[google-ai-client] Saved to Supabase:', assetId);

    return {
      imageUrl,
      key: extractKeyFromUrl(imageUrl),
      assetId,
    };
  } catch (error: any) {
    console.error('[google-ai-client] Error:', error);
    throw new Error(
      error.message || '画像生成に失敗しました'
    );
  }
}

/**
 * Upload generated image to R2 using presigned URL
 */
async function uploadGeneratedImageToR2(
  base64Data: string,
  mimeType: string
): Promise<string> {
  try {
    console.log('[google-ai-client] Uploading to R2...');

    // Get current user (or use anonymous)
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || 'anonymous';

    // Determine file extension
    const ext = mimeType.includes('webp') ? 'webp' : 'jpg';

    // Generate R2 key
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const key = `generated/${userId}/${yyyy}/${mm}/${timestamp}_${randomStr}.${ext}`;

    console.log('[google-ai-client] Generated key:', key);

    // Get presigned URL
    const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://open-wardrobe-market.com';
    const presignUrl = `${API_BASE_URL}/api/r2-presign?key=${encodeURIComponent(key)}&contentType=${encodeURIComponent(mimeType)}`;

    const presignResponse = await fetch(presignUrl);
    if (!presignResponse.ok) {
      const errorText = await presignResponse.text();
      console.error('[google-ai-client] Presign error:', errorText);
      throw new Error(`Failed to get presigned URL: ${presignResponse.status}`);
    }

    const presignJson = await presignResponse.json();
    const presignedUrl = presignJson.uploadUrl || presignJson.url;

    if (!presignedUrl) {
      throw new Error('Presigned URL is missing in response');
    }

    console.log('[google-ai-client] Got presigned URL');

    // Save to temporary file
    const tempFileUri = `${FileSystem.cacheDirectory}upload_${timestamp}_${randomStr}.${ext}`;
    await FileSystem.writeAsStringAsync(tempFileUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log('[google-ai-client] Saved temp file:', tempFileUri);

    // Upload to R2 using FileSystem.uploadAsync
    // Use FOREGROUND session if available to avoid background session issues on Simulator/Dev builds
    const sessionType = FileSystem.FileSystemSessionType?.FOREGROUND
      ? FileSystem.FileSystemSessionType.FOREGROUND
      : FileSystem.FileSystemSessionType.BACKGROUND;

    console.log('[google-ai-client] Starting upload with sessionType:', sessionType);

    console.log('[google-ai-client] Starting upload with sessionType:', sessionType);

    // Create upload task
    const uploadTask = FileSystem.createUploadTask(
      presignedUrl,
      tempFileUri,
      {
        httpMethod: 'PUT',
        headers: {
          'Content-Type': mimeType,
        },
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        sessionType: sessionType,
      },
      (data) => {
        const progress = data.totalBytesSent / data.totalBytesExpectedToSend;
        console.log(`[google-ai-client] Upload progress: ${Math.round(progress * 100)}%`);
      }
    );

    console.log('[google-ai-client] Upload task created, starting upload...');

    let uploadResult;
    try {
      uploadResult = await uploadTask.uploadAsync();

      if (!uploadResult) {
        throw new Error('Upload result is null');
      }

      console.log('[google-ai-client] Upload result status:', uploadResult.status);
      console.log('[google-ai-client] Upload result body:', uploadResult.body);
    } catch (uploadError: any) {
      console.error('[google-ai-client] FileSystem.uploadAsync error:', uploadError);
      console.error('[google-ai-client] Error message:', uploadError.message);

      // Cleanup temp file
      await FileSystem.deleteAsync(tempFileUri, { idempotent: true });

      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Cleanup temp file
    await FileSystem.deleteAsync(tempFileUri, { idempotent: true });

    if (uploadResult.status < 200 || uploadResult.status >= 300) {
      throw new Error(`Upload failed: ${uploadResult.status} - ${uploadResult.body}`);
    }

    // Construct public URL
    const publicBaseUrl = process.env.EXPO_PUBLIC_R2_PUBLIC_BASE_URL || 'https://assets.open-wardrobe-market.com';
    const publicUrl = `${publicBaseUrl}/${key}`;

    console.log('[google-ai-client] Upload successful:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('[google-ai-client] Failed to upload image:', error);
    throw new Error('画像のアップロードに失敗しました');
  }
}

/**
 * Save generated image to Supabase
 */
async function saveToSupabase(
  imageUrl: string,
  fusionSpec: FusionSpec
): Promise<string> {
  try {
    console.log('[google-ai-client] Saving to Supabase...');

    // Get current user (or use anonymous)
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || 'anonymous';

    const key = extractKeyFromUrl(imageUrl);

    // Build DNA from fusionSpec
    const dna = {
      palette: fusionSpec.palette,
      silhouette: fusionSpec.silhouette,
      materials: fusionSpec.materials,
      motif_abstractions: fusionSpec.motif_abstractions,
      details: fusionSpec.details,
      fusion_concept: fusionSpec.fusion_concept,
      emotional_keywords: fusionSpec.emotional_keywords,
      dominant_trait_analysis: fusionSpec.dominant_trait_analysis,
    };

    // Save to generation_history
    const { data: historyRecord, error: historyError } = await supabase
      .from('generation_history')
      .insert({
        user_id: userId,
        image_url: imageUrl,
        image_path: key,
        prompt: fusionSpecToPrompt(fusionSpec),
        dna: dna,
        is_public: false,
      })
      .select()
      .single();

    if (historyError) {
      console.error('[google-ai-client] Failed to save to generation_history:', historyError);
    } else {
      console.log('[google-ai-client] Saved to generation_history:', historyRecord?.id);
    }

    // Save to assets table
    const { data: assetRecord, error: assetError } = await supabase
      .from('assets')
      .insert({
        user_id: userId,
        final_url: imageUrl,
        final_key: key,
        status: 'private',
        dna: dna,
        metadata: {
          width: 1024,
          height: 1365,
          mime_type: 'image/png',
          fusion_concept: fusionSpec.fusion_concept,
        },
      })
      .select()
      .single();

    if (assetError) {
      console.error('[google-ai-client] Failed to save to assets:', assetError);
      throw new Error('Failed to save asset: ' + assetError.message);
    }

    console.log('[google-ai-client] Created asset:', assetRecord.id);
    return assetRecord.id;
  } catch (error) {
    console.error('[google-ai-client] Failed to save to Supabase:', error);
    throw new Error('データベースへの保存に失敗しました');
  }
}

/**
 * Extract R2 key from public URL
 */
function extractKeyFromUrl(url: string): string {
  const publicBaseUrl = process.env.EXPO_PUBLIC_R2_PUBLIC_BASE_URL || 'https://assets.open-wardrobe-market.com';
  return url.replace(`${publicBaseUrl}/`, '');
}
