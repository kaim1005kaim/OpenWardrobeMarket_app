# FUSION Implementation Documentation

**Version:** v3.6
**Last Updated:** 2025-11-29
**Status:** Development (Mobile App Migration Phase)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [User Flow](#user-flow)
4. [API Endpoints](#api-endpoints)
5. [Mobile App Components](#mobile-app-components)
6. [Image Processing](#image-processing)
7. [Design System](#design-system)
8. [Known Issues & Limitations](#known-issues--limitations)
9. [Future Improvements](#future-improvements)

---

## Overview

FUSION is a fashion design AI feature that allows users to merge two fashion images to create a unique, AI-generated garment design. The system uses:

- **Gemini 2.5 Flash** for image analysis (fashion DNA extraction)
- **Gemini 3 Pro Image Preview (Nano Banana Pro)** for triptych generation (FRONT/SIDE/BACK views)
- **Sharp** for server-side image processing (triptych splitting)

### Key Features

- **Dual Image Input**: Users select two fashion images (IMAGE A + IMAGE B)
- **AI Analysis**: Emotional and aesthetic interpretation using Creative Director Mode
- **Triptych Generation**: 3-panel character sheet (16:9 → split into 3x 3:4 panels)
- **Interactive Preview**: Swipe between FRONT, SIDE, and BACK views
- **Metadata Display**: AI Design Note, Fusion Strategy, Design Specifications

---

## Architecture

### Tech Stack

**Backend (Next.js API Routes)**
- Next.js 14 (App Router)
- Vertex AI (Gemini 2.5 Flash, Gemini 3 Pro)
- Cloudflare R2 (image storage)
- Supabase (database)
- Sharp (image processing)

**Mobile App (React Native + Expo)**
- Expo SDK 52
- React Native
- NativeWind (Tailwind CSS)
- Expo Router (file-based navigation)
- Custom Trajan font

### System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile App (Expo)                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐ │
│  │ ImagePicker│  │AnalyzingView│ │ FusionResultView      │ │
│  │ (Upload)   │→│ (Processing)│→│ (FRONT/SIDE/BACK)     │ │
│  └────────────┘  └────────────┘  └────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/REST API
┌───────────────────────────▼─────────────────────────────────┐
│                  Backend (Next.js + Vercel)                  │
│  ┌──────────────────────┐  ┌──────────────────────────────┐ │
│  │ /api/gemini/         │  │ /api/nano/generate           │ │
│  │ analyze-fusion       │→ │ (Gemini 3 Pro)               │ │
│  │ (Gemini 2.5 Flash)   │  │                               │ │
│  └──────────────────────┘  └──────────────────────────────┘ │
│                                      │                        │
│                                      ▼                        │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ triptych-splitter.ts (Sharp)                             ││
│  │ - Extract 3 panels from 16:9 image                       ││
│  │ - Auto-trim white borders                                 ││
│  │ - Resize to 3:4 aspect ratio                             ││
│  └──────────────────────────────────────────────────────────┘│
│                                      │                        │
│                                      ▼                        │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ Cloudflare R2 + Supabase                                 ││
│  │ - Store original 16:9 debug images                       ││
│  │ - Return base64 to mobile app (SSL workaround)           ││
│  └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## User Flow

### Stage 1: UPLOAD
**File:** `app/fusion.tsx`
**Component:** `ImagePicker`

1. User selects IMAGE A (fashion image)
2. User selects IMAGE B (fashion image)
3. Taps "FUSE IMAGES" button

### Stage 2: ANALYZING
**Component:** `AnalyzingView`
**API:** `/api/gemini/analyze-fusion`

1. Upload images to Cloudflare R2
2. Call Gemini 2.5 Flash Vision API
3. Extract fashion DNA using Creative Director Mode prompt
4. Return `FusionSpec` JSON:
   - `fusion_concept` (design philosophy)
   - `emotional_keywords` (mood/feeling)
   - `palette` (colors with weights)
   - `silhouette` (shape)
   - `materials` (fabric types)
   - `details` (construction details)
   - `dominant_trait_analysis` (A vs B strategy)

### Stage 3: PREVIEW
**Component:** `FusionSpecView`

1. Display extracted design specifications
2. Show AI Design Note (fusion_concept)
3. User reviews and taps "GENERATE DESIGN"

### Stage 4: GENERATING
**Component:** `GeneratingView`
**API:** `/api/nano/generate`

1. Build triptych prompt with design specifications
2. Call Gemini 3 Pro Image Preview (16:9 generation)
3. Server-side: Split into 3 panels using Sharp
4. Return base64 data for FRONT, SIDE, BACK

### Stage 5: REVEALING → DONE
**Component:** `FusionResultView`

1. Display triptych with interactive FRONT/SIDE/BACK buttons
2. Show AI Design Note and Design Specifications
3. User can save to wardrobe or create new fusion

---

## API Endpoints

### 1. `/api/gemini/analyze-fusion`

**Method:** POST
**Timeout:** 60s (maxDuration)
**Model:** Gemini 2.5 Flash

**Request Body:**
```json
{
  "imageData": "base64_encoded_combined_image",
  "mimeType": "image/png",
  "generateInspiration": true
}
```

**Response:**
```json
{
  "palette": [
    { "name": "Charcoal Grey", "hex": "#3A3A3A", "weight": 0.6 },
    { "name": "Ivory", "hex": "#F5F5DC", "weight": 0.4 }
  ],
  "silhouette": "tailored",
  "materials": ["wool suiting", "silk lining"],
  "motif_abstractions": [
    {
      "source_cue": "curved architectural lines",
      "operation": "panel",
      "placement": ["bodice", "sleeve"],
      "style": "tonal",
      "scale": "medium",
      "notes": "Seamlines follow organic curves",
      "emotional_intent": "Expresses fluidity within structure"
    }
  ],
  "details": ["contrast piping", "asymmetric hem"],
  "fusion_concept": "Where structured minimalism dissolves into organic movement.",
  "emotional_keywords": ["structured", "fluid", "urban"],
  "dominant_trait_analysis": "Image A provides tailored foundation, Image B injects curved seamlines.",
  "inspiration": "Architecture melts into silk, creating rhythm without literalness."
}
```

**Key Features:**
- Creative Director Mode prompt (emotional interpretation)
- Temperature: 0.4 (focused creativity)
- Timeout: 55s (within 60s maxDuration)
- Auto-trims motif_abstractions to max 3
- Normalizes palette weights to sum 1.0

---

### 2. `/api/nano/generate`

**Method:** POST
**Timeout:** 120s (maxDuration)
**Model:** Gemini 3 Pro Image Preview (Nano Banana Pro)

**Request Body:**
```json
{
  "prompt": "Design specifications text",
  "dna": { /* FusionSpec object */ },
  "enableTriptych": true,
  "fusionConcept": "Design philosophy text"
}
```

**Response:**
```json
{
  "success": true,
  "triptych": true,
  "imageData": {
    "front": "base64_encoded_jpeg",
    "side": "base64_encoded_jpeg",
    "back": "base64_encoded_jpeg"
  },
  "mimeType": "image/jpeg",
  "metadata": {
    "prompt": "...",
    "dna": { /* FusionSpec */ },
    "fusionConcept": "...",
    "aspectRatio": "16:9",
    "originalImageUrl": "https://assets.open-wardrobe-market.com/fusion/..."
  }
}
```

**Prompt Structure (v3.6):**

```
Create a photorealistic FASHION CHARACTER SHEET.
Format: Horizontal Triptych (3 side-by-side panels) with Aspect Ratio 16:9.

[LAYOUT REQUIREMENTS]
- LEFT: Full-body FRONT VIEW
- CENTER: Full-body SIDE VIEW (90-degree profile)
- RIGHT: Full-body BACK VIEW

[FRAMING & COMPOSITION]
- EXTREME LONG SHOT (head to toe with 15% headroom)
- VISUAL SEPARATION: Thin white lines between panels

[CLEAN IMAGE RULES - CRITICAL]
- NO TEXT. NO LABELS. NO TYPOGRAPHY. NO WATERMARKS.
- DO NOT write "FRONT", "SIDE", "BACK"

[CRITICAL CONSISTENCY]
- Same person, same outfit across all 3 panels

[DESIGN SPECIFICATIONS]
{prompt}

Negative: text, label, word, writing, signature, watermark, typography,
         cropped head, cut off head, cut off feet, ...
```

**Key Features:**
- Generates 16:9 horizontal image
- Splits into 3 vertical panels (FRONT/SIDE/BACK)
- Auto-trims white borders (5% from each panel edge)
- Resizes to target height 1600px (preserves aspect ratio)
- Uploads original 16:9 to R2 for debugging
- Returns base64 (Vercel SSL workaround)

---

### 3. `/api/upload-to-r2`

**Method:** POST
**Purpose:** Upload base64 images to Cloudflare R2

**Request Body:**
```json
{
  "imageData": "base64_string",
  "mimeType": "image/jpeg",
  "path": "fusion/anonymous/front-1234567890.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://assets.open-wardrobe-market.com/fusion/..."
}
```

**Note:** Used by mobile app due to Vercel SSL issues with R2.

---

## Mobile App Components

### File Structure

```
/Users/kaimoriguchi/OpenWardrobeMarket_app/
├── app/
│   └── fusion.tsx                    # Main FUSION screen (state orchestration)
├── components/fusion/
│   ├── ImagePicker.tsx               # Dual image upload component
│   ├── AnalyzingView.tsx             # Loading state during analysis
│   ├── FusionSpecView.tsx            # Preview design specifications
│   ├── GeneratingView.tsx            # Loading state during generation
│   └── FusionResultView.tsx          # Triptych display with FRONT/SIDE/BACK
├── lib/
│   └── fusion-api.ts                 # API client functions
└── types/
    └── fusion.ts                     # TypeScript types
```

---

### 1. `fusion.tsx` (Main Screen)

**State Machine:**

```typescript
type FusionStage =
  | 'UPLOAD'      // Select 2 images
  | 'ANALYZING'   // Gemini 2.5 Flash analysis
  | 'PREVIEW'     // Review FusionSpec
  | 'GENERATING'  // Gemini 3 Pro generation
  | 'REVEALING'   // Transition animation
  | 'DONE'        // Display triptych

interface FusionState {
  stage: FusionStage;
  imageA: { uri: string } | null;
  imageB: { uri: string } | null;
  fusionSpec: FusionSpec | null;
  generatedImageUrl: string | null;
  generationId: string | null;
  triptychUrls: TriptychUrls | null;
  error: string | null;
}
```

**Key Functions:**
- `handleFuse()`: Upload images → analyze → preview
- `handleGenerate()`: Generate triptych → display
- `handleSaveToWardrobe()`: Save to database (TODO)

**UI Updates (v3.6):**
- Header: `SafeAreaView edges={[]}` (move to top)
- Header padding: `py-2` (8px vertical)

---

### 2. `FusionResultView.tsx` (Triptych Display)

**Features:**
- Interactive FRONT/SIDE/BACK buttons (Trajan font, 14px, letterSpacing 1.5)
- Dynamic aspect ratio calculation
- White flash prevention during view switching
- Image auto-sizing with 10% horizontal padding

**Layout:**
```
┌─────────────────────────────────────────┐
│  [FRONT]  [SIDE]  [BACK]  (buttons)     │  ← pt-6 (24px)
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐ │
│  │                                   │ │
│  │   Generated Image (3:4 ratio)    │ │  ← px-6 (24px padding)
│  │   resizeMode="contain"            │ │
│  │                                   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌─ AI DESIGN NOTE ──────────────────┐ │
│  │ "fusion_concept"                  │ │
│  │ [emotional_keywords badges]       │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌─ FUSION STRATEGY ─────────────────┐ │
│  │ dominant_trait_analysis            │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌─ DESIGN SPECIFICATIONS ───────────┐ │
│  │ Silhouette, Palette, Materials     │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [ SAVE TO WARDROBE ]                  │
│  [ CREATE NEW FUSION ]                 │
└─────────────────────────────────────────┘
```

**State Management:**
```typescript
const [activeView, setActiveView] = useState<'front' | 'side' | 'back'>('front');
const [imageAspectRatio, setImageAspectRatio] = useState<number | undefined>(undefined);
const [previousAspectRatio, setPreviousAspectRatio] = useState<number | undefined>(undefined);

// Prevent white flash during view switching
useEffect(() => {
  if (imageAspectRatio) {
    setPreviousAspectRatio(imageAspectRatio);
  }
}, [activeView]);
```

---

## Image Processing

### Triptych Splitter (`triptych-splitter.ts`)

**Input:** 16:9 image (e.g., 1920x1080)
**Output:** 3x 3:4 images (e.g., 1200x1600)

**Algorithm (v3.7):**

```typescript
// 1. Calculate base panel width (1/3 of total)
const basePanelWidth = Math.floor(originalWidth / 3); // 640px

// 2. Trim white borders (5% from left + 5% from right = 10% total)
const TRIM_RATIO = 0.05;
const trimPixels = Math.floor(basePanelWidth * TRIM_RATIO); // 32px
const cropWidth = basePanelWidth - (trimPixels * 2); // 576px

// 3. Extract each panel
const frontPanel = sharp(imageBuffer)
  .extract({
    left: 0 + trimPixels,      // Start 32px from left
    top: 0,
    width: cropWidth,           // 576px width
    height: panelHeight         // Full height (1080px)
  })
  .trim({
    background: { r: 245, g: 245, b: 243 }, // Match background
    threshold: 15
  })
  .resize({
    height: targetHeight,       // 1600px
    fit: 'inside',
    withoutEnlargement: false
  })
  .jpeg({ quality: 95 })
  .toBuffer();
```

**Key Features:**
- Auto-trim white backgrounds using Sharp `.trim()`
- Preserve aspect ratio during resize
- High-quality JPEG output (95%)
- Parallel processing for all 3 panels

---

## Design System

### Typography

**Trajan Font:**
- Headers: 18px, letterSpacing 2
- Buttons: 16px, letterSpacing 2
- Triptych buttons: 14px, letterSpacing 1.5
- Section titles: 14px, letterSpacing 1.5

### Colors (Tailwind)

```css
darkTeal: #1a3d3d
offwhite: #F5F5F3
ink-900: #1a1a1a
ink-600: #6b6b6b
ink-200: #e5e5e5
ink-50: #fafafa
```

### Spacing

- Header padding: `py-2` (8px)
- Content top padding: `pt-6` (24px)
- Horizontal padding: `px-6` (24px)
- Button vertical padding: `py-3` (12px)
- Button horizontal padding: `px-6` (24px)

### Animation

```typescript
// Fade in + scale animation
Animated.parallel([
  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: 600,
    useNativeDriver: true,
  }),
  Animated.spring(scaleAnim, {
    toValue: 1,
    friction: 8,
    tension: 40,
    useNativeDriver: true,
  }),
]);
```

---

## Known Issues & Limitations

### 1. SSL/TLS Issues (Vercel + Cloudflare R2)
**Problem:** Vercel serverless functions fail to upload to R2 due to SSL handshake errors
**Workaround:** Return base64 to mobile app, upload from client via `/api/upload-to-r2`
**Status:** Temporary (production needs proper fix)

**Code:**
```typescript
// TEMPORARY FIX: Disable SSL certificate validation
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
```

### 2. Anonymous User Access
**Problem:** Mobile app doesn't have authentication yet
**Workaround:** Allow anonymous access with user ID `"anonymous"`
**Status:** TODO - Re-enable auth before production launch

**Code:**
```typescript
// v2.0 TEMPORARY: Allow anonymous access for FUSION migration
if (!user) {
  user = { id: 'anonymous' };
}
```

### 3. Text Generation in Images
**Problem:** Gemini 3 Pro sometimes generates "FRONT", "SIDE", "BACK" labels
**Fix:** Added strong NO TEXT rules in prompt + comprehensive negative prompt
**Status:** Improved in v3.6 (needs testing)

### 4. White Flash During View Switching
**Problem:** Brief white padding visible when switching FRONT/SIDE/BACK
**Fix:** Added `previousAspectRatio` state to maintain aspect ratio during transitions
**Status:** Fixed in latest version

### 5. Generation API 500 Error
**Problem:** Occasional 500 errors with "prompt and dna are required"
**Status:** Investigation in progress (added extensive logging)

---

## Future Improvements

### High Priority

1. **Re-enable Authentication**
   - Implement Supabase Auth in mobile app
   - Remove anonymous user workaround
   - Add user-specific storage paths

2. **Fix Vercel + R2 SSL Issues**
   - Investigate proper TLS configuration
   - Remove `NODE_TLS_REJECT_UNAUTHORIZED = '0'`
   - Direct upload from server to R2

3. **Implement Wardrobe Save**
   - Save generated designs to Supabase
   - Link to user account
   - Display in wardrobe gallery

### Medium Priority

4. **Improve Triptych Consistency**
   - Fine-tune prompt for better identity matching
   - Experiment with seed values
   - Add retry logic for failed generations

5. **Add Loading Progress**
   - Show percentage during analysis (0-50%)
   - Show percentage during generation (50-100%)
   - Estimated time remaining

6. **Error Recovery**
   - Retry failed API calls
   - Better error messages for users
   - Fallback to single-panel generation if triptych fails

### Low Priority

7. **Caching**
   - Cache FusionSpec results
   - Cache generated images
   - Reduce API costs

8. **A/B Testing**
   - Test different prompt variations
   - Track generation quality metrics
   - Optimize for user satisfaction

9. **Multi-language Support**
   - Translate UI to Japanese
   - Support Japanese fashion terminology in prompts

---

## Version History

### v3.6 (2025-11-29)
- **[CRITICAL]** Added NO TEXT rules to prevent label generation
- Enhanced negative prompt with text-blocking keywords
- Updated button fonts to Trajan (14px, letterSpacing 1.5)

### v3.5 (2025-11-29)
- Improved triptych splitter with auto-trim feature
- Added 5% trim ratio to remove white borders
- Fixed white flash during view switching

### v3.0 (2025-11-28)
- Implemented triptych generation (16:9 → 3x 3:4)
- Added FRONT/SIDE/BACK interactive buttons
- Deployed mobile app UI improvements

### v2.0 (2025-11-27)
- Added Creative Director Mode for emotional interpretation
- Introduced fusion_concept and emotional_keywords
- Enabled anonymous access for mobile migration

### v1.0 (Initial Release)
- Basic dual-image fusion
- Single image generation
- Web-only implementation

---

## Contact & Support

**Repository:** `/Volumes/SSD02/Private/Dev/OpenWardrobeMarket`
**Mobile App:** `/Users/kaimoriguchi/OpenWardrobeMarket_app`
**Deployment:** Vercel (production)
**Storage:** Cloudflare R2
**Database:** Supabase

**Developer:** kai@moriguchi
**Last Reviewed:** 2025-11-29
