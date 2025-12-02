# 価格設定の仕様

## 現在の仕様（2025-11-30）

### モバイルアプリ
- **固定価格**: ¥3,000
- AI価格計算は**使用しない**
- すべてのユーザー生成デザインは一律¥3,000で公開

### Web版 `/api/publish` の動作

現在、Web版のAPIは以下の順序で価格を決定しています：

1. クライアントから`price`パラメータを受信
2. AI価格計算を実行
3. **AI価格で上書き**（379行目: `if (aiPrice !== null) updateData.price = aiPrice`）

### ⚠️ 問題点

モバイルアプリから`price: 3000`を送信しても、Web版のAI価格計算で上書きされてしまいます。

---

## 🔧 推奨される修正（Web版API）

### 修正箇所: `/api/publish/route.ts`

**現在のコード（337-379行目）**:
```typescript
// 4. AI-powered pricing
let aiPrice = null;
let pricingBreakdown = null;

try {
  const pricingResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai-pricing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageData: base64Image,
      mimeType: 'image/png',
      autoTags,
      likes: 0,
      category: category || 'user-generated'
    })
  });

  if (pricingResponse.ok) {
    pricingBreakdown = await pricingResponse.json();
    aiPrice = pricingBreakdown.final_price;
    console.log('[publish] AI pricing:', aiPrice, 'yen');
  }
} catch (pricingError) {
  console.warn('[publish] AI pricing error (non-fatal):', pricingError);
}

// 5. Update published_items with all AI-generated data
const updateData: any = {};
if (autoTags.length > 0) updateData.auto_tags = autoTags;
if (aiDescription) updateData.ai_description = aiDescription;
if (embedding) updateData.embedding = embedding;
if (aiPrice !== null) updateData.price = aiPrice; // ⚠️ これが問題
```

**推奨される修正**:
```typescript
// 4. AI-powered pricing (only if price not explicitly set)
let aiPrice = null;
let pricingBreakdown = null;

// Only run AI pricing if client didn't provide a price
if (!price || price === 0) {
  try {
    const pricingResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai-pricing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageData: base64Image,
        mimeType: 'image/png',
        autoTags,
        likes: 0,
        category: category || 'user-generated'
      })
    });

    if (pricingResponse.ok) {
      pricingBreakdown = await pricingResponse.json();
      aiPrice = pricingBreakdown.final_price;
      console.log('[publish] AI pricing:', aiPrice, 'yen');
    }
  } catch (pricingError) {
    console.warn('[publish] AI pricing error (non-fatal):', pricingError);
  }
}

// 5. Update published_items with all AI-generated data
const updateData: any = {};
if (autoTags.length > 0) updateData.auto_tags = autoTags;
if (aiDescription) updateData.ai_description = aiDescription;
if (embedding) updateData.embedding = embedding;

// Use AI price only if no price was provided
if (aiPrice !== null && (!price || price === 0)) {
  updateData.price = aiPrice;
}

// Save pricing breakdown as metadata
if (pricingBreakdown) {
  const currentMetadata = publishedItem.metadata || {};
  updateData.metadata = {
    ...currentMetadata,
    pricing_breakdown: pricingBreakdown
  };
}
```

---

## 📋 価格決定ロジック（修正後）

```
1. クライアントから price パラメータを確認
   ↓
2. price が指定されている (price > 0)
   → クライアントの価格を使用（AI価格計算をスキップ）
   ↓
3. price が未指定または 0
   → AI価格計算を実行
   → AI価格を使用
```

---

## 🧪 テストケース

### ケース1: モバイルアプリ（固定価格）
```json
POST /api/publish
{
  "price": 3000,
  ...
}
```
**期待される動作**:
- AI価格計算は実行されない
- `published_items.price = 3000`

### ケース2: Web版（AI価格計算）
```json
POST /api/publish
{
  "price": 0,
  ...
}
```
**期待される動作**:
- AI価格計算が実行される
- `published_items.price = <AI計算結果>`

### ケース3: Web版（価格未指定）
```json
POST /api/publish
{
  // price パラメータなし
  ...
}
```
**期待される動作**:
- AI価格計算が実行される
- `published_items.price = <AI計算結果>`

---

## 🚀 実装の優先度

**優先度: 高**

モバイルアプリのフェーズ1リリース前に、Web版APIの修正が必要です。

---

## 📝 コミットメッセージ案（Web版）

```bash
fix: Respect client-provided price in /api/publish

- Only run AI pricing when price is not explicitly set
- Allow clients (mobile app) to enforce fixed pricing (¥3,000)
- AI pricing now skips if price > 0 is provided

This fixes the issue where mobile app's fixed ¥3,000 price
was being overwritten by AI pricing calculation.

Related: Mobile app Phase 1 implementation
```

---

**作成日**: 2025-11-30
**関連ファイル**:
- Web版: `/Volumes/SSD02/Private/Dev/OpenWardrobeMarket/app/api/publish/route.ts`
- モバイル版: `/Users/kaimoriguchi/OpenWardrobeMarket_app/app/publication-settings.tsx`
