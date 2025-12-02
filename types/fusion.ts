// FUSION mode types
export type FusionStage =
  | 'UPLOAD'      // Uploading 2 images
  | 'ANALYZING'   // Gemini Vision analyzing images
  | 'PREVIEW'     // Showing FusionSpec preview
  | 'GENERATING'  // Imagen 3.0 generating design
  | 'REVEALING'   // Glass reveal animation
  | 'DONE';       // Showing final result

// Backend API response format
export interface FusionSpec {
  palette: Array<{
    name: string;
    hex: string;
    weight: number;
  }>;
  silhouette: string;
  materials: string[];
  motif_abstractions: Array<{
    source_cue: string;
    operation: string;
    placement: string[];
    style: string;
    scale: string;
    notes: string;
    emotional_intent?: string; // v2.0: Emotional meaning of this design element
  }>;
  details: string[];
  inspiration?: string;

  // v2.0 Emotional Interpretation Fields
  fusion_concept?: string; // 1-3 sentence design philosophy
  emotional_keywords?: string[]; // 3-6 mood/feeling keywords
  dominant_trait_analysis?: string; // Strategy for combining images A & B
}

export interface FusionImage {
  uri: string;
  blob?: Blob;
  base64?: string;
}

export interface TriptychUrls {
  front: string;
  side: string;
  back: string;
}

// v4.0 Quadtych: MAIN + 3-view Specs
export interface QuadtychUrls {
  main: string;  // Hero shot (dynamic pose, editorial background)
  front: string; // Front spec (white background, A-pose)
  side: string;  // Side spec (90° profile, white background)
  back: string;  // Back spec (rear view, white background)
}

export interface FusionState {
  stage: FusionStage;
  imageA: FusionImage | null;
  imageB: FusionImage | null;
  fusionSpec: FusionSpec | null;
  generatedImageUrl: string | null;
  generationId: string | null;
  triptychUrls: TriptychUrls | null; // v3.0: Triptych panel URLs (deprecated)
  quadtychUrls: QuadtychUrls | null; // v4.0: Quadtych panel URLs (MAIN + 3-view)
  error: string | null;
}

export interface VariantJob {
  id: string;
  generation_id: string;
  variant_type: 'SIDE' | 'BACK';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  image_url: string | null;
  created_at: string;
  updated_at: string;
}
