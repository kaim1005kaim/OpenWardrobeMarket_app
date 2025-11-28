# R2アップロード問題の現状と対策まとめ

## 1. 現状の課題 (Current Issue)
React Native (Expo SDK 52) アプリから、Cloudflare R2 の署名付きURL (Presigned URL) に対して画像データ（バイナリ）を PUT アップロードしようとすると失敗する。

*   **症状A**: アップロード処理がハングし、完了しない（タイムアウトもしない場合がある）。
*   **症状B**: `An SSL error has occurred and a secure connection to the server cannot be made.` というエラーが発生する（iOSシミュレータ）。

## 2. 実施した修正 (Changes Implemented)

### コードベースの修正
*   **アップロード方式の変更**:
    *   `XMLHttpRequest` や `fetch` によるバイナリ送信は React Native で不安定なため、`expo-file-system` を導入。
    *   `google-ai-client.ts` と `fusion-api.ts` のアップロード処理を `FileSystem.createUploadTask` を使用するように書き換え。
    *   進捗（Progress）をログ出力できるように実装。
*   **セッション設定の最適化**:
    *   iOSシミュレータや開発ビルドでのバックグラウンドセッションの不安定さを回避するため、`FileSystemSessionType.FOREGROUND` を明示的に指定。

### 設定の修正
*   **App Transport Security (ATS) の緩和**:
    *   開発中のSSLエラーを回避するため、`app.json` (`Info.plist`) に以下を追加。
    *   `NSAppTransportSecurity`: `{ "NSAllowsArbitraryLoads": true }`

## 3. 確認・解決すべき点 (Remaining Issues & Action Items)

### A. SSLエラーの解決 (Critical)
ATS設定を追加しても `NSURLErrorDomain Code=-1200` (SSL error) が出る場合、以下の可能性があります。
1.  **ネイティブビルドの未更新**: `app.json` の変更は `npx expo run:ios` でリビルドしないと反映されません。これが行われていない可能性があります。
2.  **シミュレータの証明書問題**: シミュレータが R2 の SSL証明書（または中間証明書）を信頼していない可能性があります。実機（Physical Device）では発生しないことが多いです。
3.  **ネットワーク制限**: 実行環境（社内LANやセキュリティソフト）が SSL インスペクションを行っており、それが原因で接続エラーになっている可能性があります。

### B. CORS設定の確認
R2 のバケット設定で CORS が厳しすぎると、プリフライトリクエストやヘッダー送信で失敗します。以下が推奨設定です。
*   `AllowedHeaders`: `["*"]` (必須。`["Content-Type"]` だけでは不足する場合がある)
*   `AllowedMethods`: `["PUT", "GET", "HEAD", "POST", "DELETE"]`
*   `AllowedOrigins`: `["*"]` (開発中)

### C. 検証手順
1.  `npx expo run:ios` を実行してアプリを完全にリビルドする。
2.  Cloudflare R2 の CORS 設定で `AllowedHeaders` が `*` になっているか確認する。
3.  可能であれば、iOS実機で動作確認を行う（シミュレータ特有のSSL問題を切り分けるため）。
