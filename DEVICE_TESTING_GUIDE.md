# 実機ログインテスト手順書

**作成日**: 2025年11月29日
**対象**: Android / iOS実機でのログイン機能確認

---

## 📋 事前準備チェックリスト

### ✅ 完了済み項目

- [x] **環境変数の設定** - [.env](.env) に必要な値が設定済み
  - `EXPO_PUBLIC_SUPABASE_URL`: https://etvmigcsvrvetemyeiez.supabase.co
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: 設定済み
  - `EXPO_PUBLIC_API_BASE_URL`: https://open-wardrobe-market.com
  - `EXPO_PUBLIC_R2_PUBLIC_BASE_URL`: https://assets.open-wardrobe-market.com

- [x] **app.jsonのスキーム設定** - `"scheme": "owm"` 設定済み ([app.json:8](app.json#L8))

- [x] **Bundle ID / Package設定**
  - iOS: `com.openwardrobemarket.app` ([app.json:18](app.json#L18))
  - Android: `com.openwardrobemarket.app` ([app.json:31](app.json#L31))

### ⚠️ 要確認項目

- [ ] **Supabase リダイレクトURL設定**
  - Supabaseコンソール → Authentication → URL Configuration
  - 以下のURLを追加してください:
    - `owm://` (本番用スキーム)
    - `exp://192.168.2.177:8081` (開発用 - あなたのLAN IP)
    - `exp://127.0.0.1:8081` (ローカルホスト)

**設定方法**:
1. https://supabase.com/dashboard/project/etvmigcsvrvetemyeiez にアクセス
2. Authentication → URL Configuration → Redirect URLs
3. 上記3つのURLを追加して保存

---

## 🚀 推奨テスト方法（安定度順）

### 方法1: 開発ビルド（Dev Client）★推奨★

Google OAuthが安定動作します。初回は時間がかかりますが、最も本番に近い環境でテストできます。

#### Android

```bash
# 1. Androidデバイスをコンピューターに接続（USBデバッグ有効化）
# 2. 開発ビルドを実行
npx expo run:android

# ビルド完了後、デバイスに「Open Wardrobe Market」アプリがインストールされます
```

**トラブルシューティング**:
- デバイスが認識されない場合: `adb devices` で確認
- ビルドエラーの場合: `cd android && ./gradlew clean && cd ..` 後に再実行

#### iOS

```bash
# 1. iPhoneをコンピューターに接続
# 2. 開発ビルドを実行（Xcode必須）
npx expo run:ios

# ビルド完了後、デバイスに「Open Wardrobe Market」アプリがインストールされます
```

**必要条件**:
- Xcode がインストールされていること
- Apple Developer アカウント（無料版でも可）
- デバイスがMacに信頼されていること

**トラブルシューティング**:
- 署名エラーの場合: Xcodeで `ios/OpenWardrobeMarket.xcworkspace` を開き、Signing & Capabilitiesで開発チームを選択
- デバイスが表示されない場合: Xcodeで Window → Devices and Simulators から確認

---

### 方法2: Expo Go（簡単だがOAuthは不安定）

最も簡単ですが、Google OAuthはブラウザ復帰が失敗することがあります。Email/Password認証のテストには最適です。

```bash
# 1. Metro bundlerを起動
npx expo start --clear

# 2. 表示されるQRコードを端末でスキャン
# Android: Expo Goアプリでスキャン
# iOS: カメラアプリでスキャン → Expo Goで開く
```

**事前準備**:
- 端末に「Expo Go」アプリをインストール
  - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
  - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
- コンピューターと端末が**同じWi-Fiネットワーク**に接続されていること

**制限事項**:
- Google OAuthはブラウザ→アプリ復帰が不安定
- 一部のネイティブモジュールが動作しない可能性

---

### 方法3: Tunnel経由（ネットワーク問題がある場合）

Wi-Fiが同じLANにない場合や、会社ネットワークでブロックされる場合に使用。

```bash
npx expo start --tunnel
```

**注意**:
- 初回は ngrok のセットアップが必要
- 通信速度が遅くなる可能性

---

## 📱 デバイス別のポイント

### Android

✅ **確認事項**:
- Wi-Fiが同じLANに接続されているか
- USBデバッグが有効か（Dev Client使用時）
- 開発者オプションが有効か

⚠️ **よくある問題**:
- **"Could not connect to development server"**
  - 原因: ファイアウォールまたはネットワーク分離
  - 解決策: `npx expo start --tunnel` を使用

- **アプリが起動しない**
  - 解決策: `adb uninstall com.openwardrobemarket.app` 後に再インストール

### iOS

✅ **確認事項**:
- 物理デバイスとMacが同じLANに接続されているか
- デバイスがMacを信頼しているか
- 必要に応じてプロビジョニングプロファイルが設定されているか

⚠️ **よくある問題**:
- **Google OAuthでブラウザから戻れない**
  - 原因: Expo Goの制限
  - 解決策: Dev Client (`npx expo run:ios`) を使用

- **"Trust This Computer" が表示される**
  - 解決策: iPhoneで「信頼」をタップ

- **署名エラー**
  - 解決策: Xcodeで開いてチームを選択

---

## 🧪 テスト手順（推奨フロー）

### 準備

```bash
# 1. 依存関係のインストール（初回のみ）
npm install

# 2. キャッシュクリア
npx expo start --clear
```

### Dev Client でテスト（推奨）

```bash
# ターミナル1: Metroバンドラーを起動
npx expo start --clear

# ターミナル2: デバイスにインストール
# Android の場合:
npx expo run:android

# iOS の場合:
npx expo run:ios
```

### テストケース

#### 1. Email/Password サインアップ
1. アプリ起動 → ログイン画面が表示されるか確認
2. 「Sign Up」タブをタップ
3. Email: `test-{YYYYMMDD}@example.com` (例: test-20251129@example.com)
4. Password: `Test1234!` (8文字以上)
5. 「Sign Up」ボタンをタップ
6. ✅ 期待結果:
   - "Check your email to confirm your account" メッセージが表示される
   - （実際のメール確認は後でOK）

#### 2. Email/Password ログイン
1. ログイン画面で「Login」タブ
2. 既存のアカウント情報を入力
3. 「Login」ボタンをタップ
4. ✅ 期待結果:
   - (tabs) 画面（STUDIO/SHOWCASE/CREATE/ARCHIVE）に遷移
   - タブバーが表示される

#### 3. Google OAuth ログイン（Dev Client必須）
1. ログイン画面で「Continue with Google」ボタンをタップ
2. ✅ 期待結果: ブラウザ（Safari/Chrome）が開く
3. Googleアカウントを選択
4. 権限を許可
5. ✅ 期待結果:
   - 自動的にアプリに戻る
   - (tabs) 画面に遷移

⚠️ **Expo Go使用時**: ステップ5でアプリに戻れない場合がある → Dev Clientを使用してください

#### 4. Magic Link ログイン
1. ログイン画面で「Magic Link」タブ
2. Email: 登録済みのメールアドレスを入力
3. 「Send Magic Link」ボタンをタップ
4. ✅ 期待結果: "Check your email for a magic link" メッセージ表示
5. メールを確認してリンクをタップ
6. ✅ 期待結果: アプリに戻りログイン完了

#### 5. ログアウト
1. ARCHIVE タブをタップ
2. 「Sign Out」ボタンをタップ
3. ✅ 期待結果: ログイン画面に戻る

---

## 🐛 うまくいかない場合のデバッグ

### 報告してほしい情報

エラーが発生した場合、以下の情報を教えてください:

1. **テスト環境**
   - 使用した方法: Expo Go / Dev Client / その他
   - デバイス: Android（機種名） / iPhone（機種名）
   - OSバージョン: Android 14 / iOS 17.5 など

2. **操作手順**
   - どのステップで止まったか
   - 例: "Googleログインでブラウザから戻れない"
   - 例: "Email/Passwordログイン後に白画面"

3. **エラーメッセージ**
   - 画面に表示されたエラー文言
   - スクリーンショット（可能なら）

4. **ログの取得方法**

#### Androidログ
```bash
# USBデバッグ接続後
adb logcat | grep -i "expo\|react"
```

#### iOSログ
- Xcodeで Window → Devices and Simulators → デバイス選択 → Open Console
- または: Mac Console.app でデバイスのログを確認

---

## 🔧 よくある問題と解決策

### 問題: "Unable to resolve module"

**原因**: 依存関係の不整合

**解決策**:
```bash
# キャッシュとnode_modulesを完全クリア
rm -rf node_modules
npm install
npx expo start --clear
```

---

### 問題: "Network request failed"

**原因**:
- 端末とPCが異なるネットワークにいる
- ファイアウォールがブロックしている

**解決策**:
```bash
# Tunnel経由で起動
npx expo start --tunnel
```

---

### 問題: Googleログイン後にアプリに戻れない

**原因**: Expo Goの制限

**解決策**: Dev Clientを使用
```bash
npx expo run:android
# または
npx expo run:ios
```

---

### 問題: "This app has been modified"（Expo Go）

**原因**: ネイティブコードの変更

**解決策**: Dev Clientが必要です
```bash
npx expo run:android
```

---

### 問題: iOS署名エラー

**原因**: プロビジョニングプロファイルが未設定

**解決策**:
1. Xcodeで `ios/OpenWardrobeMarket.xcworkspace` を開く
2. プロジェクトを選択 → Signing & Capabilities
3. Team を選択（Personal Teamでも可）
4. Bundle Identifierが `com.openwardrobemarket.app` であることを確認

---

## 📊 現在のネットワーク情報

**あなたのLAN IP**: `192.168.2.177`

Supabaseリダイレクトに以下を追加してください:
```
exp://192.168.2.177:8081
```

---

## 🎯 次のステップ

1. **Supabaseリダイレクト設定** - 上記の「要確認項目」を完了
2. **Dev Clientでテスト** - `npx expo run:android` または `npx expo run:ios`
3. **ログイン機能を確認** - Email/Password、Google OAuth、Magic Link
4. **問題があれば報告** - 上記のデバッグ情報フォーマットで

---

## 📚 参考リンク

- [Expo Dev Client ドキュメント](https://docs.expo.dev/develop/development-builds/introduction/)
- [Supabase Auth ドキュメント](https://supabase.com/docs/guides/auth)
- [Expo Router Authentication](https://docs.expo.dev/router/reference/authentication/)

---

**準備完了！** まずはSupabaseのリダイレクトURL設定から始めてください 🚀
