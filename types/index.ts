// Database Types
export interface PublishedItem {
  id: string;
  user_id: string;
  title: string;
  category: 'TOPS' | 'BOTTOMS' | 'ONEPIECE' | 'OUTERWEAR' | 'ACCESSORIES' | 'FUSION';
  image_url: string;
  thumbnail_url?: string;
  metadata?: {
    design_tokens?: any;
    fusion_result?: any;
    fusion_spec?: any;
    base_images?: string[];
    demographic?: string;
    style?: string;
    description?: string;
    quadtych_urls?: {
      main: string;
      front: string;
      side: string;
      back: string;
    };
  };
  created_at: string;
  updated_at: string;
  is_public: boolean;
}

export interface VariantsJob {
  id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  base_image_1_url?: string;
  base_image_2_url?: string;
  result_urls?: string[];
  design_tokens?: any;
  error_message?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// API Request/Response Types
export interface FusionAnalyzeRequest {
  image1: string; // Base64
  image2: string; // Base64
  demographic?: 'men' | 'women' | 'unisex';
  style?: string;
}

export interface FusionAnalyzeResponse {
  job_id: string;
  message: string;
}

export interface StudioItemsResponse {
  items: PublishedItem[];
  total: number;
  page: number;
  pageSize: number;
}

// UI State Types
export interface AuthState {
  user: any | null;
  session: any | null;
  loading: boolean;
}

export interface CreateState {
  selectedImages: string[];
  isAnalyzing: boolean;
  jobId?: string;
  demographic?: 'men' | 'women' | 'unisex';
  style?: string;
}
