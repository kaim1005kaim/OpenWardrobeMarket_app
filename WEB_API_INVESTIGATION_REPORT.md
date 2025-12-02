# Web版ディレクトリ構造とAPI実装状況レポート

作成日: 2025年11月30日  
対象: `/Volumes/SSD02/Private/Dev/OpenWardrobeMarket` (Web版)

---

## 目次
1. ディレクトリ構造の概要
2. 既存のAPIエンドポイント一覧
3. データベーススキーマ
4. 認証システムの実装
5. 画像保存・公開のロジック
6. モバイルアプリで必要な新規APIエンドポイント
7. Web版とモバイル版の差分

---

## 1. ディレクトリ構造の概要

### トップレベル構造
```
/Volumes/SSD02/Private/Dev/OpenWardrobeMarket/
├── app/                          # Next.js App Router
│   ├── api/                       # APIエンドポイント (RESTful)
│   ├── auth/                      # 認証関連ページ
│   └── [pages]/                   # ページコンポーネント
├── prisma/                        # Prismaスキーマ
│   └── schema.prisma             # ORM定義（現在は最小限）
├── lib/                           # ユーティリティ関数
│   ├── vertex-ai-auth.ts         # Vertex AI認証
│   ├── similarity-check.ts       # 類似性チェック
│   └── sse-emitter.ts            # Server-Sent Events
├── src/                           # 追加ソースコード
├── supabase/                      # Supabase設定
├── catalog/                       # カタログ画像データ (大容量)
├── node_modules/                  # 依存パッケージ
├── public/                        # 静的資産
├── schema-complete.sql            # DB完全スキーマ
├── package.json                   # 依存パッケージ定義
├── tsconfig.json                  # TypeScript設定
├── next.config.js                 # Next.js設定
└── tailwind.config.js             # Tailwind CSS設定
```

### APIディレクトリ構造（60+エンドポイント）
```
app/api/
├── _shared/                       # 共有ユーティリティ
│   ├── assets.ts                 # R2/Supabase操作共通関数
├── admin/migrate/                 # 管理者用マイグレーション
├── ai-pricing/                    # AI価格計算
├── analytics/                     # 分析データAPI
├── assets/                        # アセット管理
│   ├── create/                   # アセット作成
│   ├── [assetId]/               # 個別アセット操作
│   └── route.ts                  # アセット一覧
├── auto/                          # 自動タグ/カテゴリ
│   ├── category/
│   └── tags/
├── catalog/                       # カタログAPI
├── chat/                          # チャット機能
├── compose-poster/                # ポスター生成
├── create-user-profile/           # ユーザープロフィール作成
├── dna/sync/                      # DNA同期
├── fusion/                        # FUSION機能（重要）
│   ├── extract-tokens/           # トークン抽出
│   ├── generate-variant/         # バリアント生成
│   ├── start-variants/           # バリアント開始
│   ├── upload-image/             # 画像アップロード
│   ├── variants-generate/        # バリアント生成実行
│   └── variants-stream/          # バリアント配信
├── gemini/                        # Google Gemini AI
│   ├── analyze-fusion/           # FUSION分析
│   ├── analyze-image/            # 画像分析
│   └── coach/                    # AIコーチング
├── generate/variant/              # バリアント生成
├── generation-stream/[gen_id]/    # 生成ストリーミング
├── likes/                         # いいね機能
│   └── [assetId]/               # 個別いいね操作
├── my-generations/               # マイ生成物
├── nano-generate/                 # Nano生成
├── publish/                       # デザイン公開
├── r2-presign/                    # R2署名URL生成
├── recommend/                     # レコメンド
├── save-generation/               # 生成物保存
├── saved/                         # 保存済みアイテム
├── search/                        # 検索API
├── share/                         # シェア機能
├── similar-items/                 # 類似アイテム検索
├── upload-to-r2/                  # R2アップロード
├── urula/                         # Urulaプロフィール進化
│   ├── evolve/
│   └── profile/
├── user-gallery/                  # ユーザーギャラリー
├── variants/check-view/           # バリアント確認
└── vector-search/                 # ベクトル検索
```

---

## 2. 既存のAPIエンドポイント一覧

### 重要なAPIエンドポイント

#### 2.1 認証・ユーザー管理
| エンドポイント | メソッド | 説明 | 実装状況 |
|---|---|---|---|
| `/api/create-user-profile` | POST | ユーザープロフィール初期化 | ✅ 完全実装 |
| `/api/urula/profile` | GET, PUT | Urulaプロフィール取得・更新 | ✅ 完全実装 |
| `/api/urula/evolve` | POST | プロフィール進化処理 | ✅ 完全実装 |

#### 2.2 マイページ・世代管理
| エンドポイント | メソッド | 説明 | 実装状況 |
|---|---|---|---|
| `/api/my-generations` | GET, DELETE, PATCH | マイ生成物一覧・削除・編集 | ✅ 完全実装 |
| `/api/user-gallery` | GET | ユーザーギャラリー | ✅ 基本実装 |
| `/api/save-generation` | POST | 生成物保存 | ✅ 完全実装 |

#### 2.3 公開・マーケットプレイス
| エンドポイント | メソッド | 説明 | 実装状況 |
|---|---|---|---|
| `/api/publish` | POST | デザイン公開 (超重要) | ✅ 完全実装 |
| `/api/likes/[assetId]` | POST, DELETE | いいね・いいね解除 | ✅ 完全実装 |
| `/api/catalog` | GET | カタログ取得 | ✅ 完全実装 |
| `/api/search` | GET | 検索 (複合フィルタ対応) | ✅ 完全実装 |
| `/api/recommend` | GET | レコメンド | ⚠️ 基本実装 |
| `/api/similar-items` | GET | 類似アイテム | ⚠️ 基本実装 |

#### 2.4 FUSION機能 (新機能)
| エンドポイント | メソッド | 説明 | 実装状況 |
|---|---|---|---|
| `/api/fusion/start-variants` | POST | バリアント生成ジョブ作成 | ✅ 完全実装 |
| `/api/fusion/generate-variant` | POST | 単一バリアント生成 | ✅ 完全実装 |
| `/api/fusion/variants-generate` | POST | バリアント生成実行 | ✅ 完全実装 |
| `/api/fusion/variants-stream` | POST | バリアント配信 | ✅ 完全実装 |
| `/api/fusion/extract-tokens` | POST | トークン抽出 | ✅ 完全実装 |
| `/api/fusion/upload-image` | POST | 融合画像アップロード | ✅ 完全実装 |
| `/api/gemini/analyze-fusion` | POST | FUSION分析 (Gemini) | ✅ 完全実装 |
| `/api/gemini/analyze-image` | POST | 画像分析 (Gemini Vision) | ✅ 完全実装 |

#### 2.5 アセット管理
| エンドポイント | メソッド | 説明 | 実装状況 |
|---|---|---|---|
| `/api/assets/create` | POST | アセット作成 | ✅ 完全実装 |
| `/api/assets/[assetId]` | GET, PUT, DELETE | アセット操作 | ✅ 完全実装 |
| `/api/assets` | GET | アセット一覧 | ✅ 完全実装 |
| `/api/upload-to-r2` | POST | R2直接アップロード | ✅ 完全実装 |
| `/api/r2-presign` | POST | R2署名URL生成 | ✅ 完全実装 |

#### 2.6 AI・生成関連
| エンドポイント | メソッド | 説明 | 実装状況 |
|---|---|---|---|
| `/api/ai-pricing` | POST | AI価格計算 | ✅ 完全実装 |
| `/api/nano-generate` | POST | Nano生成 | ✅ 完全実装 |
| `/api/generate/variant` | POST | バリアント生成 | ✅ 完全実装 |
| `/api/generation-stream/[gen_id]` | GET | 生成ストリーミング | ✅ 完全実装 |
| `/api/gemini/coach` | POST | AIコーチング | ✅ 完全実装 |

#### 2.7 その他
| エンドポイント | メソッド | 説明 | 実装状況 |
|---|---|---|---|
| `/api/saved` | GET | 保存済みアイテム | ⚠️ スタブ実装 |
| `/api/auto/tags` | GET | タグ自動取得 | ✅ 基本実装 |
| `/api/auto/category` | GET | カテゴリ自動取得 | ✅ 基本実装 |
| `/api/analytics` | POST | 分析データ送信 | ✅ 基本実装 |
| `/api/share` | POST | シェア機能 | ✅ 基本実装 |
| `/api/dna/sync` | POST | DNA同期 | ✅ 基本実装 |
| `/api/ops/env-check` | GET | 環境チェック | ✅ 基本実装 |

---

## 3. データベーススキーマ

### 使用DB: Supabase (PostgreSQL)

### 主要テーブル

#### users (Supabase Auth)
```sql
id (UUID) - Primary key
email (text)
password_hash (text)
email_confirmed_at (timestamp)
created_at (timestamp)
updated_at (timestamp)
```

#### published_items (公開デザイン)
```sql
id (UUID) - Primary key
user_id (UUID) - Foreign key → auth.users
image_id (text/UUID) - 画像リファレンス
title (VARCHAR 200)
description (TEXT)
price (INTEGER) - 1000～1,000,000円チェック
tags (TEXT[]) - タグ配列
colors (TEXT[]) - 色配列
category (VARCHAR) - カテゴリ
auto_tags (TEXT[]) - AI自動タグ
ai_description (TEXT) - AI説明
embedding (vector) - CLIP埋め込み
likes (INTEGER) - いいね数
views (INTEGER) - ビュー数
is_public (BOOLEAN) - 公開フラグ
is_active (BOOLEAN) - アクティブフラグ
metadata (JSONB) - ユーザーメタデータ
original_url (text) - 元画像URL
poster_url (text) - ポスターURL
sale_type (VARCHAR) - セールタイプ ('buyout' など)
created_at (TIMESTAMPTZ)
updated_at (TIMESTAMPTZ)
```

#### images (画像リポジトリ)
```sql
id (UUID) - Primary key
user_id (UUID) - Foreign key → auth.users
r2_url (text) - R2パブリックURL
r2_key (text) - R2キー (usergen/xxxxx.png)
title (VARCHAR)
description (TEXT)
tags (TEXT[]) - タグ
colors (TEXT[]) - カラータグ
price (INTEGER)
is_public (BOOLEAN)
mime_type (VARCHAR) - 'image/png' など
width (INTEGER) - 画像幅
height (INTEGER) - 画像高さ
created_at (TIMESTAMPTZ)
updated_at (TIMESTAMPTZ)
```

#### assets (アセット総合管理)
```sql
id (UUID) - Primary key
user_id (UUID) - Foreign key
title (VARCHAR)
description (TEXT)
tags (TEXT[])
status ('public'|'private'|'delisted')
final_key (text) - 最終形式R2キー
final_url (text) - 最終形式URL
raw_key (text) - 原形式R2キー
raw_url (text) - 原形式URL
dna (JSONB) - DNA情報
metadata (JSONB) - メタデータ
likes_count (INTEGER)
file_size (INTEGER)
created_at (TIMESTAMPTZ)
updated_at (TIMESTAMPTZ)
```

#### generation_history (生成履歴)
```sql
id (UUID) - Primary key
user_id (UUID) - Foreign key
prompt (TEXT) - プロンプト
provider (VARCHAR) - 'gemini-2.5', 'claude-3.5-sonnet' など
model (VARCHAR) - モデル名
r2_key (text) - R2キー
image_url (text) - 画像URL
image_path (text) - 画像パス
folder (VARCHAR) - 'usergen', 'catalog' など
aspect_ratio (VARCHAR) - '3:4' など
mode (VARCHAR) - 生成モード
demographic (VARCHAR) - 人口統計情報
design_tokens (JSONB) - デザイントークン
metadata (JSONB) - {variants[], demographic, dna, pricing_breakdown}
completion_status (VARCHAR) - 'completed', 'failed' など
created_at (TIMESTAMPTZ)
updated_at (TIMESTAMPTZ)
```

#### variants_jobs (FUSION用バリアント生成ジョブ)
```sql
id (UUID) - Primary key
gen_id (UUID) - 元生成ID
type (VARCHAR) - 'side'|'back'
status (VARCHAR) - 'pending'|'processing'|'completed'|'failed'
base_prompt (TEXT)
base_r2_key (text)
base_seed (INTEGER)
base_dna (JSONB)
demographic (VARCHAR)
design_tokens (JSONB)
attempts (INTEGER) - 試行回数
created_at (TIMESTAMPTZ)
updated_at (TIMESTAMPTZ)
```

#### likes (いいね管理)
```sql
user_id (UUID) - Foreign key
image_id (UUID/text) - Foreign key
created_at (TIMESTAMPTZ)
-- 複合主キー: (user_id, image_id)
```

#### user_urula_profile (Urulaプロフィール)
```sql
user_id (UUID) - Primary key
mat_weights (JSONB) - 素材の重み
glass_gene (JSONB) - ガラス遺伝子
chaos (NUMERIC) - カオス係数
tint (JSONB) - 色合い
palette (JSONB) - パレット
history (JSONB) - 進化履歴
updated_at (TIMESTAMPTZ)
```

### インデックス
```sql
-- published_items用
published_items_user_id_idx
published_items_status_idx
published_items_created_at_idx
published_items_price_idx
published_items_tags_idx (GIN)

-- generation_history用
generation_history_user_id_idx
generation_history_created_at_idx

-- assets用 (暗黙的)
```

### Row-Level Security (RLS)
- 全テーブルで有効化
- ユーザーは自分のデータのみアクセス可能
- 公開データは全員アクセス可能

---

## 4. 認証システムの実装

### 認証フロー

#### 4.1 トークン検証パターン
```typescript
// api/_shared/assets.ts のパターン
export async function getAuthUser(req: Request | { headers?: any }) {
  // 1. Authorization ヘッダーから Bearer トークンを抽出
  const authHeader = extractAuthHeader(req);
  
  // 2. トークンがない場合は null を返す
  if (!authHeader) {
    return { user: null, token: null };
  }

  // 3. "Bearer " プレフィックスを削除
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  
  // 4. Supabase client を作成（anon key使用）
  const supabase = getSupabaseForToken(token);
  
  // 5. トークンを検証
  const { data, error } = await supabase.auth.getUser();
  
  // 6. ユーザー情報を返す
  return { user: data.user, token };
}
```

#### 4.2 Supabase初期化パターン
```typescript
// サービスロール初期化（管理者操作用）
export function getServiceSupabase(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });
}

// トークン付きクライアント（ユーザー操作用）
export function getSupabaseForToken(token: string | null): SupabaseClient | null {
  if (!token) return null;
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: { Authorization: `Bearer ${token}` }
    },
    auth: { persistSession: false }
  });
}
```

#### 4.3 認可パターン
```typescript
// POST /api/publish から
export async function POST(req: NextRequest) {
  // 1. トークンからユーザー認証
  const authHeader = req.headers.get('authorization');
  const token = authHeader.substring(7);
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. ユーザーIDを使用してDB操作
  await supabase
    .from('published_items')
    .insert({ user_id: user.id, ... });
}
```

#### 4.4 認証が不要なエンドポイント
- `/api/catalog` - 公開カタログ
- `/api/search` - 公開検索
- `/api/auto/tags`, `/api/auto/category` - 自動タグ
- `/api/recommend` - レコメンド
- `/api/similar-items` - 類似アイテム

#### 4.5 認証が必要なエンドポイント
- `/api/publish` - デザイン公開 (強制)
- `/api/my-generations` - マイ生成物 (強制)
- `/api/save-generation` - 生成物保存 (オプション - anonymous対応)
- `/api/likes/[assetId]` - いいね (強制)
- `/api/assets/create` - アセット作成 (強制)
- すべてのユーザー個人データAPI

---

## 5. 画像保存・公開のロジック

### 5.1 R2 (Cloudflare) 統合

#### 環境変数
```env
R2_S3_ENDPOINT=https://xxx.r2.googleapis.com
R2_ACCESS_KEY_ID=xxxxx
R2_SECRET_ACCESS_KEY=xxxxx
R2_BUCKET=owm-designs
R2_PUBLIC_BASE_URL=https://r2.openwardrobemarket.com
R2_CUSTOM_DOMAIN_URL=https://cdn.openwardrobemarket.com
```

#### R2キーの構造
```
usergen/         - ユーザー生成画像
  └── {imageId}.png
  
catalog/         - カタログ画像
  └── {filename}.png
  
generated/       - AI生成画像（その他）
  └── {filename}.png
```

### 5.2 公開フロー (/api/publish)

```
モバイルアプリ
    ↓
1. 画像をR2にアップロード (presigned URL経由)
    ↓
2. /api/save-generation にPOST (オプション)
    - generation_history に記録
    - assets テーブルに記録
    ↓
3. /api/publish にPOST (デザイン公開)
    ├─ リクエストボディ:
    │  {
    │    posterUrl, originalUrl,     // 画像URL
    │    sessionId,                  // セッションID（オプション）
    │    title, description,         // メタデータ
    │    tags, colors, category,
    │    price, saleType
    │  }
    ├─ images テーブル検索/作成
    ├─ published_items テーブル作成/更新
    ├─ AI分析実行（並列）
    │  ├─ Gemini Vision (自動タグ + AI説明)
    │  ├─ CLIP embedding (ベクトル検索用)
    │  ├─ AI Pricing (価格計算)
    ├─ generation_history に詳細保存
    ├─ Urulaプロフィール進化
    └─ published_item を返す
```

### 5.3 画像最適化とシリアライゼーション

#### serializeAsset() 関数（`api/_shared/assets.ts`）
```typescript
export async function serializeAsset(
  row: Record<string, any>,
  options: SerializedAssetOptions
): Promise<SerializedAsset> {
  // 1. キーの正規化
  const rawKey = extractWithFallback(row, [
    'raw_key', 'raw_r2_key', 'raw_path', 'raw_object_key'
  ]);
  const finalKey = extractWithFallback(row, [
    'final_key', 'final_r2_key', 'poster_key', 'r2_key', 'image_key'
  ]);

  // 2. 署名URL生成（プライベート画像用）
  if (options.kind === 'raw' || options.includeRaw) {
    const presigned = await tryPresign(rawKeyNormalised);
    if (presigned) {
      rawUrl = presigned;  // 署名されたURL
    }
  }

  // 3. フォールバック: パブリックURLを構築
  if (!finalUrl || !isAbsoluteUrl(finalUrl)) {
    finalUrl = buildR2Url(r2BaseUrl, finalKeyNormalised);  // https://r2.xxx/usergen/xxx.png
  }

  // 4. カスタムドメイン適用（優先度高）
  if (R2_CUSTOM_DOMAIN_URL) {
    finalUrl = buildR2Url(customBase, finalKeyNormalised);  // https://cdn.xxx/usergen/xxx.png
  }

  // 5. HTTPSを強制
  if (url.startsWith('http://')) {
    url = url.replace('http://', 'https://');
  }

  return {
    id: row.id,
    src: finalUrl,  // フロントエンド向けURL
    finalUrl,
    rawUrl,
    // ... その他フィールド
  };
}
```

### 5.4 CORS設定

#### Web版での設定パターン
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

// OPTIONS リクエスト対応
export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}
```

---

## 6. モバイルアプリで必要な新規APIエンドポイント

### 6.1 現在モバイルで使用中の既存エンドポイント
```
✅ /api/fusion/start-variants
✅ /api/fusion/generate-variant
✅ /api/fusion/variants-generate
✅ /api/fusion/variants-stream
✅ /api/fusion/extract-tokens
✅ /api/fusion/upload-image
✅ /api/gemini/analyze-fusion
✅ /api/gemini/analyze-image
✅ /api/publish
✅ /api/save-generation
✅ /api/assets/create
✅ /api/my-generations
✅ /api/search
✅ /api/catalog
✅ /api/likes/[assetId]
```

### 6.2 不足している新規エンドポイント

#### データ取得API
```
❌ POST /api/design/[id]  
  説明: 特定のデザイン詳細を取得
  用途: デザイン詳細ページ
  実装例:
  {
    "id": "uuid",
    "title": "Design Name",
    "description": "...",
    "tags": [],
    "colors": [],
    "price": 10000,
    "likes": 100,
    "views": 500,
    "creator": { "id": "uuid", "username": "..." },
    "metadata": { variants: [...] }
  }

❌ GET /api/design/[id]/views
  説明: デザインビュー数を記録
  用途: ビュートラッキング
  
❌ GET /api/showcase
  説明: マーケットプレイス一覧（推奨順）
  用途: ホーム画面のショーケース
  フィルタ: category, vibe, price_range
  
❌ GET /api/trending
  説明: トレンドデザイン一覧
  用途: トレンドセクション
  
❌ GET /api/user/[userId]/designs
  説明: ユーザーのデザイン一覧
  用途: プロフィール画面
  
❌ GET /api/user/[userId]/info
  説明: ユーザープロフィール詳細
  用途: プロフィール画面
```

#### メタデータ生成API
```
❌ POST /api/generate-metadata
  説明: デザインのメタデータ自動生成
  入力: { imageUrl, baseTitle? }
  出力: { tags[], colors[], description, category, suggestedPrice }
  用途: デザイン公開時の自動情報入力
```

#### マーケットプレイスAPI
```
❌ POST /api/checkout/[designId]
  説明: 購入処理開始
  用途: 購入フロー
  
❌ GET /api/user-sales
  説明: ユーザーの売上情報
  用途: ダッシュボード
  
❌ POST /api/design/[id]/favorite
  説明: お気に入り登録
  用途: お気に入りリスト
  
❌ DELETE /api/design/[id]/favorite
  説明: お気に入り解除
```

#### コレクション管理API
```
❌ POST /api/collections
  説明: コレクション作成
  
❌ GET /api/collections
  説明: ユーザーのコレクション一覧
  
❌ POST /api/collections/[id]/items
  説明: コレクションにアイテム追加
  
❌ DELETE /api/collections/[id]/items/[itemId]
  説明: コレクションからアイテム削除
```

### 6.3 推奨される新規エンドポイント優先度

**Priority 1 (必須)**
1. POST `/api/design/[id]` - デザイン詳細取得
2. POST `/api/generate-metadata` - メタデータ生成
3. GET `/api/showcase` - マーケットプレイス一覧

**Priority 2 (高)**
4. GET `/api/trending` - トレンド一覧
5. GET `/api/user/[userId]/info` - ユーザープロフィール
6. GET `/api/user/[userId]/designs` - ユーザーデザイン一覧

**Priority 3 (中)**
7. POST `/api/checkout/[designId]` - 購入処理
8. POST `/api/collections` - コレクション管理
9. POST `/api/design/[id]/favorite` - お気に入り

---

## 7. Web版とモバイル版の差分

### 7.1 プロジェクト構成の差分

| 側面 | Web版 | モバイル版 |
|---|---|---|
| **フレームワーク** | Next.js 15 | Expo (React Native) |
| **言語** | TypeScript + React | TypeScript + React Native |
| **API呼び出し方式** | fetch + next/server | Axios (custom client) |
| **スタイリング** | Tailwind CSS | StyleSheet (React Native) |
| **ナビゲーション** | Next.js App Router | Expo Router (tabs) |
| **画像処理** | sharp | expo-image-manipulator |
| **データベース** | Supabase (直接接続) | Supabase (API経由) |
| **認証** | Supabase Auth | Supabase Auth (token) |

### 7.2 API利用の差分

#### Web版の特徴
```typescript
// 直接的なSupabase呼び出しが可能
const supabase = createClient(url, serviceKey);
await supabase.from('published_items').select('*');

// サーバーサイド処理が豊富
- AI分析の並列実行
- Urulaプロフィール進化
- メタデータ自動生成
- 複合検索
```

#### モバイル版の特徴
```typescript
// API経由でのみ通信
const response = await apiClient.post('/api/publish', {
  // Web版と同じデータ形式
});

// 制約
- Expoサンドボックスの制限
- ペイロードサイズ制限（MAX_BASE64_SIZE = 1MB）
- SSL/TLS証明書ピンニング対応
```

### 7.3 エンドポイント実装状況の比較

#### Web版で実装済みだがモバイル版が未実装
| エンドポイント | Web実装 | Mobile対応状況 |
|---|---|---|
| `/api/generate-metadata` | ✅ | ❌ **必須** |
| `/api/showcase` | ❌ | ❌ **必須** |
| `/api/design/[id]` | ❌ | ❌ **必須** |
| `/api/trending` | ❌ | ❌ |
| `/api/user/[userId]/info` | ❌ | ❌ |
| `/api/user-sales` | ❌ | ❌ |
| `/api/vector-search` | ✅ | ❌ |
| `/api/similar-items` | ✅ | ❌ |
| `/api/dna/sync` | ✅ | ❌ |
| `/api/urula/evolve` | ✅ | ❌ |

### 7.4 リクエスト形式の差分

#### Web版 - `/api/publish`
```typescript
// Web版（サーバーサイド）
POST /api/publish
{
  posterUrl,           // パブリックR2 URL
  originalUrl,         // パブリックR2 URL
  sessionId,           // オプション
  title,              // 必須
  description,
  tags,               // 配列
  colors,             // 配列
  category,
  price,
  generation_data,    // メタデータ
  saleType           // 'buyout' など
}

// レスポンス
{
  success: true,
  item: {
    id,
    user_id,
    title,
    image_id,
    auto_tags,         // AI生成
    ai_description,    // AI生成
    embedding,         // CLIP生成
    price,             // AI価格計算後
    metadata: {
      pricing_breakdown,  // AI価格詳細
      variants: [...]
    }
  }
}
```

#### モバイル版 - `/api/publish` (同じインターフェース)
```typescript
// モバイル版（クライアント）
const formData = new FormData();
formData.append('imageFile', imageAsset.base64);
formData.append('imageUrl', uploadedR2Url);
formData.append('title', title);
formData.append('tags', JSON.stringify(tags));
// ... その他

// ただし base64サイズ制限がある
if (base64.length > MAX_BASE64_SIZE) {
  // 圧縮/リサイズ必要
}
```

### 7.5 認証トークン管理の差分

#### Web版
```typescript
// クッキーベース + Authorization ヘッダー
const response = await fetch('/api/publish', {
  headers: {
    'Authorization': `Bearer ${sessionToken}`
  }
});
```

#### モバイル版
```typescript
// Supabase Session + Authorization ヘッダー
const session = await supabase.auth.getSession();
const response = await apiClient.post('/api/publish', body, {
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  }
});
```

### 7.6 エラーハンドリングの差分

#### Web版
```typescript
// 詳細なエラー情報を返す
if (error) {
  return NextResponse.json({
    error: 'Failed to publish',
    message: error.message,
    code: error.code
  }, { status: 500 });
}
```

#### モバイル版
```typescript
// Expoは詳細エラーが見えにくいため、より詳細なログが必要
try {
  const response = await api.post('/api/publish', ...);
} catch (error) {
  console.log('[FusionAPI] Error details:', {
    message: error.message,
    response: error.response?.data,
    status: error.response?.status
  });
  throw new Error(`Publish failed: ${error.message}`);
}
```

---

## 8. 結論と推奨事項

### 8.1 Web版APIの成熟度
- **全体**: 約90%完成
- **FUSION機能**: 100%完成
- **マーケットプレイス**: 80%実装
- **ユーザープロフィール**: 70%実装

### 8.2 モバイル版に必要な追加実装
1. **優先度1 (1-2週間)**
   - `/api/design/[id]` - デザイン詳細API
   - `/api/generate-metadata` - メタデータ自動生成
   - `/api/showcase` - マーケットプレイス一覧

2. **優先度2 (2-3週間)**
   - ユーザープロフィール関連API
   - トレンドAPI
   - コレクション管理API

3. **優先度3 (後期)**
   - 支払い/決済API
   - 推奨エンジンの強化
   - ベクトル検索統合

### 8.3 Web版を拡張する際の注意点
- R2署名URL有効期限を適切に設定（デフォルト15分）
- CORS設定をモバイルアプリに合わせる
- base64ペイロードサイズ制限に対応
- エラーレスポンスの一貫性を保つ

### 8.4 テスト・デプロイ
- すべての新APIは `/api/_shared/assets.ts` の認証関数を使用
- Supabaseクライアント初期化の重複を避ける
- プロダクション環境での署名URL生成をテスト
- R2 CORS設定を確認

