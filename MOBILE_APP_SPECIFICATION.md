# Open Wardrobe Market - Mobile App 完全仕様書

## 目次
1. [プロジェクト概要](#プロジェクト概要)
2. [技術スタック](#技術スタック)
3. [アーキテクチャ](#アーキテクチャ)
4. [デザインシステム](#デザインシステム)
5. [画面構成](#画面構成)
6. [認証システム](#認証システム)
7. [ナビゲーション](#ナビゲーション)
8. [コンポーネント詳細](#コンポーネント詳細)
9. [API統合](#api統合)
10. [状態管理](#状態管理)
11. [開発環境](#開発環境)

---

## プロジェクト概要

### アプリ名
**Open Wardrobe Market (OWM)**

### コンセプト
AI駆動のファッションデザイン生成プラットフォーム。ユーザーが画像やアイデアから独自のファッションデザインを創造できるモバイルアプリケーション。

### ターゲットユーザー
- ファッションデザイナー
- クリエイティブ志向のファッション愛好家
- デザインに興味があるが専門的なスキルを持たない一般ユーザー

### 主要機能
1. **FUSION** - 2つの画像を融合させたデザイン生成（実装済み）
2. **COMPOSER** - 6つの質問ベースのデザイン生成（予定）
3. **SHOWCASE** - コミュニティデザインギャラリー
4. **STUDIO** - パーソナライズされたデザインコレクション
5. **ARCHIVE** - ユーザープロファイルと保存済みデザイン

---

## 技術スタック

### フレームワーク
- **React Native** (0.76.9) - クロスプラットフォームモバイル開発
- **Expo** (~52.0.47) - React Nativeツールチェーン
- **Expo Router** (~4.0.21) - ファイルベースルーティング

### UI/スタイリング
- **NativeWind** (^4.2.1) - TailwindCSSのReact Native実装
- **TailwindCSS** (^3.4.18) - ユーティリティファーストCSSフレームワーク
- **@expo/vector-icons** - アイコンライブラリ

### 状態管理・データ
- **React Context API** - グローバル状態管理（認証）
- **Supabase** (^2.84.0) - バックエンドサービス
  - 認証 (Email/Password, Magic Link, Google OAuth)
  - データベース (PostgreSQL)
  - ストレージ

### AI/画像処理
- **Google Generative AI** (^0.24.1) - Gemini APIクライアント
- **Axios** (^1.13.2) - HTTPクライアント
- **expo-image-picker** - 画像選択
- **expo-image-manipulator** - 画像操作

### アニメーション・3D
- **react-native-reanimated** (~3.16.1) - 高性能アニメーション
- **Three.js** (^0.180.0) - 3Dレンダリング（予定）
- **@react-three/fiber** & **@react-three/drei** - Three.js React統合（予定）

### ナビゲーション
- **@react-navigation/native** (^7.0.14) - ナビゲーションライブラリ
- **react-native-screens** - ネイティブスクリーン管理
- **react-native-safe-area-context** - セーフエリア対応

### ストレージ
- **@react-native-async-storage/async-storage** - ローカルストレージ
- **expo-secure-store** - セキュアストレージ

### 開発ツール
- **TypeScript** (~5.3.3) - 型安全性
- **Jest** (^29.2.1) - テストフレームワーク
- **Babel** - JavaScript トランスパイラ

---

## アーキテクチャ

### ディレクトリ構造

```
OpenWardrobeMarket_app/
├── app/                          # Expo Routerによるファイルベースルーティング
│   ├── (tabs)/                   # タブナビゲーショングループ
│   │   ├── _layout.tsx          # タブレイアウト設定
│   │   ├── index.tsx            # STUDIO画面
│   │   ├── showcase.tsx         # SHOWCASE画面
│   │   ├── create.tsx           # CREATE画面
│   │   └── archive.tsx          # ARCHIVE画面（プロファイル）
│   ├── _layout.tsx              # ルートレイアウト
│   ├── login.tsx                # ログイン/サインアップ画面
│   ├── fusion.tsx               # FUSIONデザイン生成画面
│   ├── modal.tsx                # 汎用モーダル
│   ├── +html.tsx                # HTML エントリーポイント（Web）
│   └── +not-found.tsx           # 404画面
│
├── components/                   # 再利用可能コンポーネント
│   ├── fusion/                  # FUSION機能関連
│   │   ├── AnalyzingView.tsx   # 画像解析中UI
│   │   ├── FusionResultView.tsx # 結果表示UI
│   │   ├── FusionSpecView.tsx  # デザイン仕様表示
│   │   ├── GeneratingView.tsx  # 生成中UI
│   │   └── ImagePicker.tsx     # 画像選択コンポーネント
│   │
│   ├── mobile/                  # モバイル専用UI
│   │   ├── MobileHeader.tsx    # ヘッダー
│   │   ├── MenuOverlay.tsx     # ハンバーガーメニュー
│   │   ├── ModePicker.tsx      # デザインモード選択
│   │   ├── UrulaHero.tsx       # Urulaアニメーション
│   │   ├── CardSwiper.tsx      # 3Dカードスワイパー
│   │   ├── MasonryGrid.tsx     # Pinterestスタイルグリッド
│   │   ├── PosterCard.tsx      # デザインカード
│   │   └── SearchModal.tsx     # 検索モーダル
│   │
│   ├── ui/                      # 汎用UIコンポーネント
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── LoadingSpinner.tsx
│   │
│   ├── Themed.tsx               # テーマ対応コンポーネント
│   ├── useColorScheme.ts       # カラースキームフック
│   └── useClientOnlyValue.ts   # クライアント専用値フック
│
├── contexts/                     # Reactコンテキスト
│   └── AuthContext.tsx          # 認証状態管理
│
├── constants/                    # 定数定義
│   └── Colors.ts                # カラーパレット
│
├── lib/                          # ユーティリティ・サービス
│   ├── supabase.ts              # Supabaseクライアント設定
│   └── api-client.ts            # API HTTPクライアント
│
├── types/                        # TypeScript型定義
│   └── index.ts
│
├── assets/                       # 静的アセット
│   ├── images/
│   │   └── mobile_TOP_BG.png   # ログイン背景画像
│   └── fonts/
│       └── Trajan.ttf           # ブランドフォント
│
├── tailwind.config.js           # TailwindCSS設定
├── app.json                     # Expo設定
├── tsconfig.json                # TypeScript設定
└── package.json                 # 依存関係
```

### データフロー

```
User Input → React Component → Context/State → API Layer → Backend
                                    ↓
                            Local Storage
                                    ↓
                            Re-render UI
```

---

## デザインシステム

### テーマコンセプト: "Rich & Minimal"
和紙のような温かみと洗練されたミニマリズムの融合

### カラーパレット

#### プライマリカラー
```typescript
{
  darkTeal: '#1a3d3d',        // ブランドカラー - ダークティール
  accent: '#FF7A1A',          // アクセントカラー - オレンジ
  klein: '#002FA7',           // イヴ・クライン・ブルー
  background: '#F2F0E9',      // 和紙のような温かみのあるオフホワイト
  offwhite: '#F4F4F0',        // オフホワイト
}
```

#### インクカラー（階層的グレー）
```typescript
ink: {
  900: '#1A1A1A',  // 墨色（プライマリテキスト）
  700: '#3A3A3A',  // ダークグレー
  600: '#5A5A5A',  // セカンダリテキスト
  400: '#777777',  // 薄いグレー
  200: '#DCDCDC',  // UIボーダー
  50: '#F8F7F4'    // 紙のテクスチャ背景
}
```

### タイポグラフィ

#### フォントファミリー
- **Trajan** - ブランド・見出し用（ローマン体）
- **System** - 本文・UI要素用（システムフォント）

#### フォントサイズ階層
```
48px - メインページタイトル
24px - セクションヘッダー
18px - ナビゲーション・ブランド
16px - ボディテキスト
14px - 小見出し
12px - ボタンテキスト
9px  - キャプション・フッター
```

#### レタースペーシング
```typescript
{
  wider: '0.02em',   // 通常のスペーシング
  widest: '0.1em'    // タイトル用広いスペーシング
}
```

### スペーシングシステム（8pxベース）
```
8, 12, 16, 20, 24, 32, 40, 48, 60, 80, 120px
```

### ボーダーラディウス
```typescript
{
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  full: '9999px'  // 完全な円形
}
```

### シャドウ・エレベーション

#### ソフトシャドウ
```typescript
{
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
}
```

#### ミディアムシャドウ
```typescript
{
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 5,
}
```

#### グラスモーフィズム（タブバー）
```typescript
{
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  borderRadius: 24,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.4)',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 12,
  elevation: 8,
  backdropFilter: 'blur(20px)', // iOS
}
```

### アニメーション

#### デュレーション
- **Fast**: 200ms - ボタンフィードバック
- **Normal**: 300ms - 画面遷移
- **Slow**: 2000ms - Urulaの呼吸アニメーション

#### イージング
- **useNativeDriver: true** - ネイティブスレッドでの実行

---

## 画面構成

### 1. STUDIO画面 (`app/(tabs)/index.tsx`)

#### 目的
ユーザーのパーソナライズされたデザインコレクションを表示するホーム画面

#### レイアウト
```
[MobileHeader: ヘッダー]
    ↓
[STUDIO Title: 背景タイトル（Trajan 64px）]
    ↓
[CardSwiper: 3Dカードスワイパー（前面）]
    ↓
[CTA Button: "その感性を、かたちに。"]
    ↓
[Gallery Link: "ショーケースを見る"]
    ↓
[Footer: About | FAQ | Contact]
```

#### 主要機能
- `/api/catalog`からデザインデータ取得
- 3Dカードスワイパーでデザイン閲覧
- CREATE画面へのCTA
- SHOWCASE画面へのリンク

#### デザイン特徴
- 背景色: `darkTeal (#1a3d3d)`
- タイトルがカードの背後に配置（z-index 0）
- カードが前面（z-index 10）
- ミニマルなCTAボタン（ボーダーのみ、アンダーライン付き）

#### データフロー
```typescript
fetchItems() → API /api/catalog → setItems(catalogItems) → CardSwiper
```

---

### 2. SHOWCASE画面 (`app/(tabs)/showcase.tsx`)

#### 目的
コミュニティ全体のデザインギャラリーをPinterestスタイルで表示

#### レイアウト
```
[MobileHeader: 透明ヘッダー、ダークテキスト]
    ↓
[Search Bar: 検索バー]
    ↓
[SHOWCASE Title: 背景タイトル（Trajan 56px）]
    ↓
[MasonryGrid: Pinterestスタイルグリッド（前面）]
```

#### 主要機能
- Pull-to-refresh対応
- リアルタイム検索（タイトル・タグ）
- `/api/catalog`からデザインフェッチ
- Masonryレイアウトによる可変グリッド

#### デザイン特徴
- 背景色: `background (#F2F0E9)`
- インクカラー（墨色）のテキスト
- 検索バーはボーダーボトムのみのミニマルデザイン
- 空状態メッセージ付き

#### 検索ロジック
```typescript
handleSearch(query) {
  const filtered = items.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
  );
  setFilteredItems(filtered);
}
```

---

### 3. CREATE画面 (`app/(tabs)/create.tsx`)

#### 目的
デザイン生成方法の選択とFUSIONへの誘導

#### レイアウト
```
[MobileHeader: 透明ヘッダー、ダークテキスト]
    ↓
[CREATE Title: Trajan 48px]
    ↓
[UrulaHero: アニメーションキャラクター]
    ↓
[Description: "あなたの創造性を解き放つ"]
    ↓
[Primary CTA: "START DESIGNING" → /fusion]
    ↓
[Secondary Link: "CHOOSE A METHOD" → ModePicker]
    ↓
[Info Section: 利用可能なモード説明]
```

#### 主要機能
- デフォルトでFUSIONモードに誘導
- ModePickerモーダルで他の生成方法を選択
- Urulaの呼吸アニメーション

#### デザイン特徴
- 背景色: `background (#F2F0E9)`
- プライマリボタン: `darkTeal`背景、シャドウ付き
- セカンダリリンク: アンダーライン付きテキスト
- 情報カード: `ink-50`背景、角丸16px

#### モード選択
```typescript
const handleModeSelect = (mode: CreateMode) => {
  if (mode === 'fusion') {
    router.push('/fusion');
  } else if (mode === 'composer') {
    // TODO: Implement COMPOSER mode
  }
};
```

---

### 4. ARCHIVE画面 (`app/(tabs)/archive.tsx`)

#### 目的
ユーザープロファイル、保存済みデザイン、設定

#### レイアウト（ログイン済み）
```
[MobileHeader: 透明ヘッダー、ダークテキスト]
    ↓
[ARCHIVE Title: Trajan 48px]
    ↓
[User Avatar: 円形、Klein Blue背景]
    ↓
[Email: ユーザーメール]
    ↓
[Badge: ★★★★☆ | SUBSCRIBED]
    ↓
[Tabs: DESIGN | SETTING]
    ↓
[Sub Tabs: Publish | Drafts | Collections]
    ↓
[Design List: 空状態 or デザイン一覧]
    ↓
[Sign Out Button]
```

#### レイアウト（未ログイン）
```
[MobileHeader]
    ↓
[ARCHIVE Title]
    ↓
[Login Prompt: "サインインしてアーカイブにアクセス"]
    ↓
[LOGIN Button → /login]
```

#### 主要機能
- 認証状態による条件分岐
- ユーザープロファイル表示
- タブナビゲーション（DESIGN/SETTING）
- サブタブ（Publish/Drafts/Collections）
- サインアウト機能

#### デザイン特徴
- アバター: `klein`背景、イニシャル表示
- バッジ: `ink-900`背景、`offwhite`テキスト
- タブ: アクティブタブにボーダーボトム
- サブタブ: アクティブは`ink-900`背景、非アクティブは白背景

---

### 5. LOGIN画面 (`app/login.tsx`)

#### 目的
ユーザー認証（ログイン・サインアップ）

#### レイアウト
```
[Background Image: mobile_TOP_BG.png]
    ↓
[Brand Title: OPEN WARDROBE MARKET (Trajan)]
    ↓
[Email Input: ボーダーボトムのみ]
    ↓
[Password Input: (passwordモード時)]
    ↓
[Confirm Password: (signup時のみ)]
    ↓
[Auth Mode Toggle: Password | Magic Link (signup時)]
    ↓
[Submit Button: LOGIN | SIGN UP | SEND MAGIC LINK]
    ↓
[Google Login Button: (login時のみ)]
    ↓
[Mode Toggle: NEW ACCOUNT | BACK TO LOGIN]
```

#### 認証モード

##### Login
- **Password認証**: Email + Password
- **Magic Link認証**: Emailのみ
- **Google OAuth**: ワンタップログイン

##### Signup
- **Password認証**: Email + Password + Confirm Password
- **Magic Link認証**: Emailのみ

#### 主要機能
```typescript
handleEmailLogin()    // メール・パスワードログイン
handleSignup()        // 新規登録
handleMagicLink()     // マジックリンク送信
handleGoogleLogin()   // Google OAuth
```

#### デザイン特徴
- 背景: 全画面画像
- テキスト: すべて白（#FAFAF7）
- 入力フィールド: 透明背景、白いボーダーボトム
- ボタン: ボーダーのみ、背景透明
- トグル: アクティブ時に白背景

#### リダイレクト
```typescript
useEffect(() => {
  if (!loading && user) {
    router.replace('/(tabs)'); // ログイン済みの場合、タブ画面へ
  }
}, [user, loading]);
```

---

### 6. FUSION画面 (`app/fusion.tsx`)

**※ FUSION機能の詳細は別ドキュメントで管理されているため、ここでは概要のみ**

#### 目的
2つの画像を融合させたファッションデザインの生成

#### ステート遷移
```
IDLE → ANALYZING → GENERATING → RESULT
```

#### 主要機能
- 画像選択（2枚）
- 画像アップロード（R2）
- Gemini APIによる画像解析
- デザイン仕様生成
- バリアント生成（3パターン）
- 結果表示

---

## 認証システム

### AuthContext (`contexts/AuthContext.tsx`)

#### 提供される値
```typescript
interface AuthContextType {
  user: User | null;              // 現在のユーザー
  session: Session | null;        // セッション情報
  loading: boolean;               // 読み込み中フラグ
  signIn: (email, password) => Promise<void>;
  signUp: (email, password) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}
```

#### 認証フロー

##### 初期化
```typescript
useEffect(() => {
  // セッション取得
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
  });

  // 認証状態の変更を監視
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }
  );

  return () => subscription.unsubscribe();
}, []);
```

##### Email/Passwordログイン
```typescript
const signIn = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
};
```

##### Google OAuthログイン
```typescript
const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'owm://', // app.jsonのschemeと一致
    },
  });
  if (error) throw error;
};
```

##### サインアウト
```typescript
const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
```

### Supabase設定 (`lib/supabase.ts`)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,           // トークンストレージ
    autoRefreshToken: true,           // 自動リフレッシュ
    persistSession: true,             // セッション永続化
    detectSessionInUrl: false,        // URL解析無効
  },
});
```

---

## ナビゲーション

### Expo Router構造

#### ルート階層
```
/                          → (tabs)/index.tsx (STUDIO)
/showcase                  → (tabs)/showcase.tsx
/create                    → (tabs)/create.tsx
/archive                   → (tabs)/archive.tsx
/login                     → login.tsx
/fusion                    → fusion.tsx
/modal                     → modal.tsx
```

### タブナビゲーション (`app/(tabs)/_layout.tsx`)

#### タブ構成
```typescript
<Tabs>
  <Tabs.Screen name="index"    title="STUDIO"    icon="grid"    />
  <Tabs.Screen name="showcase" title="SHOWCASE"  icon="compass" />
  <Tabs.Screen name="create"   title="CREATE"    icon="plus"    />
  <Tabs.Screen name="archive"  title="ARCHIVE"   icon="user"    />
</Tabs>
```

#### タブバースタイル

##### カスタムラッパー
```typescript
tabBar={(props) => (
  <View style={styles.tabBarWrapper}>
    <BottomTabBar {...props} />
  </View>
)}
```

##### ラッパースタイル
```typescript
tabBarWrapper: {
  position: 'absolute',
  left: 24,        // 左マージン
  right: 24,       // 右マージン
  bottom: 24,      // 下部から24px
  alignSelf: 'center',
}
```

##### タブバー内部スタイル
```typescript
tabBarStyle: {
  position: 'relative',
  height: 64,
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  borderRadius: 24,
  borderTopWidth: 0,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.4)',
  ...shadowStyles,
  ...(Platform.OS === 'ios' && {
    backdropFilter: 'blur(20px)', // すりガラス効果
  }),
}
```

##### アイコンスタイル
```typescript
tabBarItemStyle: {
  justifyContent: 'center',
  alignItems: 'center',
  paddingVertical: 0,
  paddingTop: 12,  // アイコンを垂直方向にセンタリング
}
```

##### カラー
```typescript
tabBarActiveTintColor: '#1a3d3d',      // darkTeal
tabBarInactiveTintColor: '#9CA3AF',    // グレー
```

### ルートレイアウト (`app/_layout.tsx`)

```typescript
<AuthProvider>
  <ThemeProvider>
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="fusion" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  </ThemeProvider>
</AuthProvider>
```

---

## コンポーネント詳細

### MobileHeader

#### ファイル
`components/mobile/MobileHeader.tsx`

#### Props
```typescript
interface MobileHeaderProps {
  onMenuPress: () => void;      // メニューボタン押下時のコールバック
  transparent?: boolean;        // 透明背景フラグ
  darkText?: boolean;           // ダークテキストフラグ
}
```

#### 機能
- ブランドロゴ「OWM」表示
- 背景色の切り替え（透明 or darkTeal）
- テキスト色の切り替え（白 or ink-900）

#### 使用例
```typescript
<MobileHeader
  onMenuPress={() => setMenuVisible(true)}
  transparent
  darkText
/>
```

---

### MenuOverlay

#### ファイル
`components/mobile/MenuOverlay.tsx`

#### Props
```typescript
interface MenuOverlayProps {
  visible: boolean;
  onClose: () => void;
}
```

#### 機能
- フルスクリーンメニューモーダル
- 画面遷移リンク（STUDIO, SHOWCASE, CREATE, ARCHIVE）
- ログアウトボタン（ログイン時のみ）
- フッターリンク（FAQ, Privacy, Contact）

#### ナビゲーション項目
```typescript
const menuItems = [
  { label: 'STUDIO', route: '/' },
  { label: 'SHOWCASE', route: '/showcase' },
  { label: 'CREATE', route: '/create' },
  { label: 'ARCHIVE', route: '/archive' },
];
```

#### デザイン
- 背景: `ink-900`（ダークグレー）
- テキスト: 白、Trajan 32px
- アニメーション: フェードイン

---

### ModePicker

#### ファイル
`components/mobile/ModePicker.tsx`

#### Props
```typescript
interface ModePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (mode: CreateMode) => void;
}
```

#### 生成モード
```typescript
type CreateMode =
  | 'fusion'       // 利用可能
  | 'composer'     // 利用可能
  | 'heritage'     // 未実装
  | 'zero'         // 未実装
  | 'mutation'     // 未実装
  | 'evolution'    // 未実装
  | 'remix';       // 未実装
```

#### モードオプション
```typescript
const modeOptions: ModeOption[] = [
  {
    id: 'fusion',
    title: 'FUSION',
    description: '2つの画像を融合させて新しいデザインを生成',
    icon: 'random',
    available: true,
  },
  {
    id: 'composer',
    title: 'COMPOSER',
    description: '6つの質問からあなただけのデザインを作成',
    icon: 'magic',
    available: true,
  },
  // ... 他のモード (available: false)
];
```

#### デザイン
- 利用可能: `darkTeal`背景、白テキスト、シャドウ
- 未実装: `ink-100`背景、グレーテキスト、半透明、"COMING SOON"バッジ

---

### UrulaHero

#### ファイル
`components/mobile/UrulaHero.tsx`

#### Props
```typescript
interface UrulaHeroProps {
  size?: number;  // デフォルト: 画面幅の60%
}
```

#### 機能
- Urulaキャラクターの視覚表現
- 呼吸アニメーション（2秒周期、1.0 ↔ 1.08スケール）
- 3層構造のグロー効果

#### アニメーション
```typescript
Animated.loop(
  Animated.sequence([
    Animated.timing(breatheAnim, {
      toValue: 1.08,
      duration: 2000,
      useNativeDriver: true,
    }),
    Animated.timing(breatheAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }),
  ])
).start();
```

#### 構造
```
[外側グロー: rgba(91, 125, 177, 0.15), 100%サイズ]
  [中間グロー: rgba(91, 125, 177, 0.25), 80%サイズ]
    [コア: #5B7DB1, 60%サイズ, シャドウ付き]
```

---

### CardSwiper

#### ファイル
`components/mobile/CardSwiper.tsx`

#### Props
```typescript
interface CardSwiperProps {
  items: PublishedItem[];
  onCardPress: (item: PublishedItem) => void;
}
```

#### 機能
- 3Dカードスワイパー
- パースペクティブ効果
- スワイプジェスチャー対応

#### デザイン特徴
- カード: 角丸、シャドウ
- 画像: アスペクト比維持
- インタラクティブ: アニメーション遷移

---

### MasonryGrid

#### ファイル
`components/mobile/MasonryGrid.tsx`

#### Props
```typescript
interface MasonryGridProps {
  items: any[];
  onItemPress: (item: any) => void;
}
```

#### 機能
- Pinterestスタイルの可変グリッド
- 2カラムレイアウト
- 画像の高さに応じた自動調整

#### レイアウトアルゴリズム
- 左右2つのカラムに交互配置
- 各カラムの高さを追跡
- 短いカラムに優先的に配置

---

### SearchModal

#### ファイル
`components/mobile/SearchModal.tsx`

#### Props
```typescript
interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
}
```

#### 機能
- 検索入力フィールド
- リアルタイム検索
- クリアボタン
- モーダルプレゼンテーション

---

## API統合

### APIクライアント (`lib/api-client.ts`)

```typescript
import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### 主要エンドポイント

#### `/api/catalog` - デザインカタログ取得
```typescript
// Request
GET /api/catalog

// Response
{
  images: [
    {
      id: string;
      title: string;
      src: string;
      tags: string[];
      createdAt: string;
    },
    ...
  ]
}
```

#### `/api/upload-to-r2` - 画像アップロード（FUSION用）
```typescript
// Request
POST /api/upload-to-r2
{
  image: string;    // Base64画像
  userId?: string;  // オプショナル
}

// Response
{
  url: string;      // R2の画像URL
}
```

#### `/api/gemini/analyze-fusion` - FUSION画像解析
```typescript
// Request
POST /api/gemini/analyze-fusion
{
  imageUrlA: string;
  imageUrlB: string;
  demographic?: {
    gender: string;
    generation: string;
  };
}

// Response
{
  specA: FusionSpec;
  specB: FusionSpec;
  merged: FusionSpec;
}
```

#### `/api/nano/generate` - バリアント生成
```typescript
// Request
POST /api/nano/generate
{
  designTokens: object;
  mode: string;
}

// Response (SSE)
data: {"type": "progress", "message": "..."}
data: {"type": "variant", "index": 0, "imageUrl": "..."}
data: {"type": "all_complete"}
```

---

## 状態管理

### グローバル状態

#### AuthContext
```typescript
const { user, session, loading, signIn, signUp, signOut } = useAuth();
```

### ローカル状態

#### React useState
```typescript
const [items, setItems] = useState<PublishedItem[]>([]);
const [loading, setLoading] = useState(true);
const [menuVisible, setMenuVisible] = useState(false);
```

#### useEffect - 副作用管理
```typescript
useEffect(() => {
  fetchItems();
}, []);
```

---

## 開発環境

### 環境変数（`.env.local`）

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxx

# API
EXPO_PUBLIC_API_BASE_URL=https://your-app.vercel.app

# R2
EXPO_PUBLIC_R2_PUBLIC_BASE_URL=https://assets.xxx.com

# Google OAuth
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_AI_API_KEY=xxx

# FUSION Mode
EXPO_PUBLIC_FUSION_MODE=multi_variant
```

### 起動コマンド

```bash
# 開発サーバー起動
npx expo start

# iOS シミュレータ起動
npx expo start --ios

# キャッシュクリア
npx expo start --clear

# プロダクションビルド（iOS）
npx expo run:ios
```

### テスト

```bash
# Jest テスト実行
npm test

# カバレッジ
npm test -- --coverage
```

### リンティング・フォーマット

```bash
# TypeScript型チェック
tsc --noEmit
```

---

## まとめ

このドキュメントは、Open Wardrobe Market モバイルアプリの全容を網羅しています。

### 実装済み機能
- ✅ タブナビゲーション（STUDIO, SHOWCASE, CREATE, ARCHIVE）
- ✅ 認証システム（Email/Password, Magic Link, Google OAuth）
- ✅ FUSIONデザイン生成
- ✅ デザインカタログ表示
- ✅ 検索機能
- ✅ レスポンシブUI

### 今後の実装予定
- ⏳ COMPOSERモード（6つの質問ベースのデザイン生成）
- ⏳ 他の生成モード（HERITAGE, ZERO, MUTATION, EVOLUTION, REMIX）
- ⏳ Urulaの3Dメタボール実装
- ⏳ デザイン保存・コレクション機能
- ⏳ ソーシャル機能（いいね、コメント）
- ⏳ プロファイル編集

### 技術的負債・改善点
- パフォーマンス最適化（画像レイジーロード）
- オフライン対応
- エラーハンドリングの強化
- E2Eテストの追加
- アクセシビリティ対応

---

**バージョン**: 1.0.0
**最終更新**: 2025年11月29日
**作成者**: Claude Code with OpenWardrobeMarket Team
