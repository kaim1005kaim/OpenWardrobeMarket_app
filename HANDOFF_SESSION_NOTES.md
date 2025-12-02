# OpenWardrobeMarket Mobile App - セッション引き継ぎドキュメント

**最終更新日**: 2025-11-30
**アプリバージョン**: React Native 0.76.9 + Expo SDK 52
**プロジェクトディレクトリ**: `/Users/kaimoriguchi/OpenWardrobeMarket_app`

---

## 📋 セッション概要

### 完了した作業

1. **NativeWind v4 migration完了**
   - すべてのFUSION関連コンポーネントでclassNameをインラインスタイルに変換
   - アプリ全体で統一されたデザインシステムを適用

2. **FUSION機能のUI改善**
   - 画像選択の品質を0.7に最適化（パフォーマンス向上）
   - ボタンテキストを「FUSE IMAGES」→「ANALYZE」に変更
   - 生成中テキストを「Imagen 3.0がデザインを生成しています」→「デザインを生成しています」に変更
   - 戻るボタンの位置調整とスタイル簡素化
   - 全体的なレイアウトスペーシングの改善
   - ヒントボックスのデザイン刷新（info-circleアイコン使用）

3. **保存ボタンのスタイル変更**
   - 「SAVE TO WARDROBE」ボタンを緑色（#2D7A4F）に変更
   - アウトラインスタイルから塗りつぶしスタイルに変更

---

## 🎯 次のセッションで実装予定の機能

以下の優先順位で実装を計画しています：

### フェーズ1（最優先）

#### 1. 公開設定画面（Publication Settings Screen）
**ファイル**: `app/publication-settings.tsx`（新規作成予定）

**機能要件**:
- FusionResultViewの「SAVE TO WARDROBE」ボタン押下時に遷移
- Gemini APIでメタデータ自動生成:
  - タイトル（title）
  - 説明文（description）
  - タグ（tags）配列
- 価格は**3000円固定**
- 公開/下書き選択オプション
- プレビュー画像表示

**API要件**:
```typescript
// 新規作成予定のエンドポイント
POST /api/publish-design
{
  generationId: string;
  title: string;
  description: string;
  tags: string[];
  price: 3000; // 固定
  status: 'published' | 'draft';
}
```

**Gemini API連携**:
```typescript
// lib/gemini-metadata.ts（新規作成予定）
export async function generateMetadata(
  imageUrl: string,
  fusionSpec: FusionSpec
): Promise<{
  title: string;
  description: string;
  tags: string[];
}>
```

#### 2. ARCHIVEのデータ取得と表示
**ファイル**: `app/(tabs)/archive.tsx`（既存ファイル修正）

**機能要件**:
- ユーザーの生成画像一覧を取得
- Publish/Drafts/Collectionsタブで振り分け
- 各画像のステータス表示
- タップで詳細画面へ遷移

**API要件**:
```typescript
// 既存または新規作成
GET /api/my-generations?userId={userId}&status={published|draft}
Response: {
  generations: Array<{
    id: string;
    imageUrl: string;
    title: string;
    status: 'published' | 'draft';
    createdAt: string;
    fusionSpec: FusionSpec;
  }>
}
```

---

### フェーズ2

#### 3. 詳細ページ（Detail Screen）
**ファイル**: `app/detail/[id].tsx`（新規作成予定）

**機能要件**:
- 画像の拡大表示（triptych対応）
- タイトル、説明文、価格表示
- いいねボタン（ハートアイコン）
- 購入ボタン
- デザイン仕様（FusionSpec）表示
- 類似画像セクション（下部）

**API要件**:
```typescript
GET /api/design/{id}
Response: {
  id: string;
  imageUrl: string;
  triptychUrls?: { front, side, back };
  title: string;
  description: string;
  price: number;
  tags: string[];
  fusionSpec: FusionSpec;
  likes: number;
  isLiked: boolean; // 現在のユーザーがいいね済みか
  similarDesigns: Array<{id, imageUrl, title}>;
}
```

#### 4. SHOWCASEのユーザー画像表示
**ファイル**: `app/(tabs)/showcase.tsx`（既存ファイル修正）

**機能要件**:
- 公開済みユーザー画像を新しい順に表示
- カタログ画像より優先表示
- 無限スクロール対応
- 画像タップで詳細画面へ

**API要件**:
```typescript
GET /api/showcase?page={number}&limit={number}
Response: {
  images: Array<{
    id: string;
    imageUrl: string;
    title: string;
    userId: string;
    createdAt: string;
    isUserGenerated: boolean; // ユーザー生成 vs カタログ
  }>;
  hasMore: boolean;
}
```

---

### フェーズ3

#### 5. いいね機能とCollections
**API要件**:
```typescript
POST /api/like/{designId}
DELETE /api/like/{designId}
GET /api/my-collections?userId={userId}
```

#### 6. 購入フロー
- 購入詳細画面の作成
- 決済連携（Stripe等）
- 注文履歴

#### 7. 類似画像表示（ベクトル検索）
**API要件**:
```typescript
GET /api/similar/{designId}?limit={number}
Response: {
  similar: Array<{
    id: string;
    imageUrl: string;
    similarity: number; // 0-1
  }>
}
```

#### 8. SHOWCASEパフォーマンス最適化
- React.memoの適用
- FlashListへの移行検討
- 画像の遅延読み込み

---

## 🗂️ ファイル構成

### 既存の重要ファイル

#### FUSION関連
```
app/
  fusion.tsx                              # メインFUSION画面
components/fusion/
  ImagePicker.tsx                         # 画像選択コンポーネント
  AnalyzingView.tsx                       # 解析中画面
  FusionSpecView.tsx                      # プレビュー画面
  GeneratingView.tsx                      # 生成中画面
  FusionResultView.tsx                    # 結果表示画面
lib/
  fusion-api.ts                           # FUSION API関数
  api-client.ts                           # 汎用APIクライアント
types/
  fusion.ts                               # FUSION型定義
```

#### タブ画面
```
app/(tabs)/
  showcase.tsx                            # SHOWCASE画面（カタログ表示）
  create.tsx                              # CREATE画面（FUSION入口）
  archive.tsx                             # ARCHIVE画面（要実装）
```

#### 認証・コンテキスト
```
contexts/
  AuthContext.tsx                         # 認証コンテキスト
```

---

## 🎨 デザインシステム

### カラーパレット
```typescript
const colors = {
  // Primary
  darkTeal: '#1a3d3d',

  // Neutrals
  'ink-900': '#1A1A1A',
  'ink-700': '#3A3A3A',
  'ink-600': '#777777',
  'ink-500': '#999999',
  'ink-400': '#AAAAAA',
  'ink-200': '#DCDCDC',
  'ink-50': '#F5F5F3',

  // Backgrounds
  background: '#F2F0E9',
  offwhite: '#FAFAF7',
  cardBg: '#F8F7F4',

  // Accents
  blue: '#5B7DB1',
  green: '#2D7A4F',

  // Borders
  border: '#E5E5E5',
  borderDark: '#ECECEC',
};
```

### タイポグラフィ
- **Trajan**: ヘッダー、ボタンテキスト
- **System**: 本文テキスト

### スペーシング基準
```typescript
const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};
```

---

## 🔧 API エンドポイント

### 現在実装済み

#### FUSION
```typescript
POST /api/gemini/analyze-fusion
  Body: { imageData: string, mimeType: string }
  Response: FusionSpec

POST /api/nano/generate
  Body: { prompt, enableTriptych, fusionConcept, dna, userId }
  Response: { success, imageData, triptych, metadata }

POST /api/save-generation
  Body: { imageUrl, imageKey, metadata, userId }
  Response: { generationId, imageUrl }
```

#### R2ストレージ
```typescript
GET /api/r2-presign?key={key}&contentType={type}
  Response: { uploadUrl }
```

#### カタログ
```typescript
GET /api/catalog
  Response: { images: Array<{id, url, title, tags}> }
```

### 実装予定

```typescript
// 公開設定
POST /api/publish-design

// 自分の生成画像取得
GET /api/my-generations?userId={id}&status={status}

// デザイン詳細
GET /api/design/{id}

// SHOWCASE（公開画像）
GET /api/showcase?page={p}&limit={l}

// いいね
POST /api/like/{designId}
DELETE /api/like/{designId}

// コレクション
GET /api/my-collections?userId={id}

// 類似画像
GET /api/similar/{designId}?limit={n}

// メタデータ生成
POST /api/generate-metadata
  Body: { imageUrl, fusionSpec }
  Response: { title, description, tags }
```

---

## 🐛 既知の問題

### 解決済み
1. ✅ NativeWind classNameが反映されない → インラインスタイルに変換済み
2. ✅ 画像選択が遅い → 品質を0.7に最適化
3. ✅ ANALYZEボタンが見えない → スタイル修正済み
4. ✅ レイアウトが詰まっている → スペーシング改善済み

### 未解決・要確認
1. ⚠️ Google Loginの画面遷移が機能しない（別アドレスログインは可能）
2. ⚠️ 実機での画像読み込みパフォーマンス（要検証）

---

## 📱 テスト状況

### 動作確認済み
- ✅ 画像選択（2枚）
- ✅ ANALYZE機能
- ✅ FUSION PREVIEW表示
- ✅ GENERATE DESIGN機能
- ✅ Triptych（FRONT/SIDE/BACK）生成
- ✅ 結果画面表示
- ✅ 戻るボタン機能

### 未テスト
- ❓ SAVE TO WARDROBE機能（公開設定画面が未実装）
- ❓ ARCHIVE画面のデータ表示
- ❓ SHOWCASE画面のユーザー画像表示
- ❓ 詳細ページ
- ❓ いいね機能

---

## 🚀 次のステップ（推奨順序）

### ステップ1: 公開設定画面の実装
1. `app/publication-settings.tsx`を作成
2. Gemini APIでメタデータ自動生成機能を実装
3. `/api/publish-design`エンドポイントの実装または既存APIの確認
4. `fusion.tsx`の`handleSaveToWardrobe`から遷移するように修正

### ステップ2: ARCHIVEのデータ取得
1. `/api/my-generations`エンドポイントの実装確認
2. `archive.tsx`でデータ取得ロジックを実装
3. Publish/Drafts/Collectionsタブの振り分け実装

### ステップ3: 詳細ページ
1. `app/detail/[id].tsx`を作成
2. `/api/design/{id}`エンドポイントの実装
3. SHOWCASEとARCHIVEからの遷移実装

### ステップ4: SHOWCASEの拡張
1. `/api/showcase`エンドポイントの実装
2. ユーザー画像とカタログ画像のマージロジック
3. 無限スクロール実装

---

## 💡 重要な実装ノート

### 1. 型定義の拡張が必要
`types/index.ts`に以下の型を追加予定:
```typescript
export interface Design {
  id: string;
  userId: string;
  generationId: string;
  imageUrl: string;
  triptychUrls?: TriptychUrls;
  title: string;
  description: string;
  price: number;
  tags: string[];
  status: 'published' | 'draft';
  fusionSpec: FusionSpec;
  likes: number;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedMetadata {
  title: string;
  description: string;
  tags: string[];
}
```

### 2. ルーティング構成
Expo Routerのダイナミックルートを使用:
```
app/
  publication-settings.tsx      # 公開設定画面
  detail/
    [id].tsx                    # 詳細ページ（動的ルート）
```

### 3. 状態管理
- 認証: `AuthContext`（既存）
- FUSION状態: ローカルstate（既存）
- グローバル状態: 必要に応じてReact Context追加検討

---

## 📞 環境変数

### 必要な環境変数（.env）
```bash
EXPO_PUBLIC_API_BASE_URL=https://open-wardrobe-market.com
EXPO_PUBLIC_R2_PUBLIC_BASE_URL=https://assets.open-wardrobe-market.com
EXPO_PUBLIC_FUSION_MODE=vercel
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<Google OAuth Client ID>
EXPO_PUBLIC_SUPABASE_URL=<Supabase URL>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<Supabase Anon Key>
```

---

## 📚 参考リンク

- **Web版**: https://open-wardrobe-market.com
- **Assets CDN**: https://assets.open-wardrobe-market.com
- **Expo Docs**: https://docs.expo.dev/
- **React Native Docs**: https://reactnative.dev/

---

## ✅ チェックリスト（次セッション開始時）

- [ ] Expo Dev Serverが起動しているか確認
- [ ] 実機/エミュレータで現在のFUSION機能が動作するか確認
- [ ] Git statusを確認し、未コミットの変更を把握
- [ ] web版のAPIエンドポイントが正常に動作しているか確認
- [ ] 公開設定画面の実装を開始

---

**最終更新者**: Claude Code
**次回予定作業**: 公開設定画面（Publication Settings Screen）の実装
