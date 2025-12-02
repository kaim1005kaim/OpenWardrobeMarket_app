# Events API Specification

## Overview
イベント機能のバックエンドAPI仕様書。Pro会員がイベントを主催し、ユーザーが参加・投稿できる機能を提供します。

## Database Schema

### 1. events テーブル
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  thumbnail_url TEXT NOT NULL,
  banner_url TEXT,
  host_id UUID NOT NULL REFERENCES users(id),
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'ended')),
  participant_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  support_count INT DEFAULT 0,
  submission_count INT DEFAULT 0,
  max_submissions INT,
  tags TEXT[],
  prize_info JSONB,
  rules TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT check_dates CHECK (end_date > start_date)
);

CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_host ON events(host_id);
CREATE INDEX idx_events_end_date ON events(end_date);
```

### 2. event_submissions テーブル
```sql
CREATE TABLE event_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  published_item_id UUID NOT NULL REFERENCES published_items(id),
  title VARCHAR(200),
  description TEXT,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, published_item_id)
);

CREATE INDEX idx_submissions_event ON event_submissions(event_id);
CREATE INDEX idx_submissions_user ON event_submissions(user_id);
CREATE INDEX idx_submissions_likes ON event_submissions(likes_count DESC);
```

### 3. event_supporters テーブル
```sql
CREATE TABLE event_supporters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_supporters_event ON event_supporters(event_id);
CREATE INDEX idx_supporters_user ON event_supporters(user_id);
```

### 4. event_submission_likes テーブル
```sql
CREATE TABLE event_submission_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES event_submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(submission_id, user_id)
);

CREATE INDEX idx_submission_likes_submission ON event_submission_likes(submission_id);
CREATE INDEX idx_submission_likes_user ON event_submission_likes(user_id);
```

### 5. subscriptions テーブル
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('standard', 'pro')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  credits_remaining INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

## API Endpoints

### 1. Get Events List
**Endpoint**: `GET /api/events`

**Query Parameters**:
- `limit` (number, optional): 取得件数 (default: 50, max: 100)
- `offset` (number, optional): オフセット (default: 0)
- `status` (string, optional): イベントステータス ('upcoming' | 'active' | 'ended')
- `search` (string, optional): タイトル・主催者名で検索

**Response**:
```json
{
  "success": true,
  "events": [
    {
      "id": "uuid",
      "title": "Summer Fashion Challenge 2025",
      "description": "Create your best summer outfit design",
      "thumbnail_url": "https://...",
      "banner_url": "https://...",
      "host_id": "uuid",
      "host_name": "OpenDesign Team",
      "host_avatar": "https://...",
      "start_date": "2025-06-01T00:00:00Z",
      "end_date": "2025-06-30T23:59:59Z",
      "status": "active",
      "participant_count": 128,
      "view_count": 1520,
      "support_count": 89,
      "submission_count": 256,
      "tags": ["summer", "fashion", "challenge"],
      "created_at": "2025-05-01T00:00:00Z"
    }
  ],
  "total": 10
}
```

### 2. Get Event Detail
**Endpoint**: `GET /api/events/:id`

**Response**:
```json
{
  "success": true,
  "event": {
    "id": "uuid",
    "title": "Summer Fashion Challenge 2025",
    "description": "Detailed description...",
    "thumbnail_url": "https://...",
    "banner_url": "https://...",
    "host": {
      "id": "uuid",
      "name": "OpenDesign Team",
      "avatar": "https://...",
      "subscription_plan": "pro"
    },
    "start_date": "2025-06-01T00:00:00Z",
    "end_date": "2025-06-30T23:59:59Z",
    "status": "active",
    "participant_count": 128,
    "view_count": 1520,
    "support_count": 89,
    "submission_count": 256,
    "max_submissions": 1000,
    "tags": ["summer", "fashion", "challenge"],
    "prize_info": {
      "first": "¥100,000 + Feature on homepage",
      "second": "¥50,000",
      "third": "¥30,000"
    },
    "rules": "1. Original designs only\n2. Submit by end date...",
    "is_supported": false,
    "user_submission": null,
    "created_at": "2025-05-01T00:00:00Z"
  }
}
```

### 3. Get Event Submissions
**Endpoint**: `GET /api/events/:id/submissions`

**Query Parameters**:
- `limit` (number, optional): 取得件数 (default: 50)
- `offset` (number, optional): オフセット (default: 0)
- `sort` (string, optional): ソート順 ('recent' | 'likes' | 'random') (default: 'likes')

**Response**:
```json
{
  "success": true,
  "submissions": [
    {
      "id": "uuid",
      "event_id": "uuid",
      "user_id": "uuid",
      "user_name": "Designer Name",
      "user_avatar": "https://...",
      "published_item_id": "uuid",
      "image_url": "https://...",
      "title": "My Summer Design",
      "description": "Inspired by...",
      "likes_count": 45,
      "is_liked": false,
      "created_at": "2025-06-15T10:30:00Z"
    }
  ],
  "total": 256
}
```

### 4. Create Event (Pro会員のみ)
**Endpoint**: `POST /api/events`

**Headers**:
- `Authorization: Bearer {token}`

**Request Body**:
```json
{
  "title": "Summer Fashion Challenge 2025",
  "description": "Create your best summer outfit design...",
  "thumbnail_url": "https://...",
  "banner_url": "https://...",
  "start_date": "2025-06-01T00:00:00Z",
  "end_date": "2025-06-30T23:59:59Z",
  "max_submissions": 1000,
  "tags": ["summer", "fashion", "challenge"],
  "prize_info": {
    "first": "¥100,000 + Feature on homepage",
    "second": "¥50,000",
    "third": "¥30,000"
  },
  "rules": "1. Original designs only..."
}
```

**Response**:
```json
{
  "success": true,
  "event": {
    "id": "uuid",
    "title": "Summer Fashion Challenge 2025",
    ...
  }
}
```

**Error Response (非Pro会員)**:
```json
{
  "success": false,
  "error": "Pro subscription required to create events"
}
```

### 5. Submit to Event
**Endpoint**: `POST /api/events/:id/submit`

**Headers**:
- `Authorization: Bearer {token}`

**Request Body**:
```json
{
  "published_item_id": "uuid",
  "title": "My Summer Design",
  "description": "Inspired by tropical vibes..."
}
```

**Response**:
```json
{
  "success": true,
  "submission": {
    "id": "uuid",
    "event_id": "uuid",
    "user_id": "uuid",
    "published_item_id": "uuid",
    "title": "My Summer Design",
    "created_at": "2025-06-15T10:30:00Z"
  }
}
```

### 6. Support Event
**Endpoint**: `POST /api/events/:id/support`

**Headers**:
- `Authorization: Bearer {token}`

**Response**:
```json
{
  "success": true,
  "is_supported": true,
  "support_count": 90
}
```

### 7. Like Submission
**Endpoint**: `POST /api/events/submissions/:id/like`

**Headers**:
- `Authorization: Bearer {token}`

**Response**:
```json
{
  "success": true,
  "is_liked": true,
  "likes_count": 46
}
```

### 8. Update Event View Count
**Endpoint**: `POST /api/events/:id/view`

**Response**:
```json
{
  "success": true,
  "view_count": 1521
}
```

## Business Logic

### イベントステータスの自動更新
```typescript
// Cron jobで1時間ごとに実行
async function updateEventStatuses() {
  const now = new Date();

  // upcoming → active
  await supabase
    .from('events')
    .update({ status: 'active' })
    .eq('status', 'upcoming')
    .lte('start_date', now.toISOString());

  // active → ended
  await supabase
    .from('events')
    .update({ status: 'ended' })
    .eq('status', 'active')
    .lte('end_date', now.toISOString());
}
```

### 人気度スコアの計算
```typescript
function calculatePopularityScore(event: Event): number {
  return (
    event.view_count +
    event.support_count * 2 +
    event.participant_count * 3 +
    event.submission_count * 5
  );
}
```

### Pro会員チェック
```typescript
async function isProMember(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('plan_type', 'pro')
    .eq('status', 'active')
    .single();

  return !!data;
}
```

## Subscription Plans

### Standard (¥980/月)
- 生成クレジット: 100/月
- 画像出品: 無制限
- FUSION生成: 利用可能
- コンポーザー: 利用可能
- イベント参加: 利用可能
- イベント主催: **不可**

### Pro (¥4,400/月)
- 生成クレジット: 500/月
- 画像出品: 無制限
- 全生成モード: 利用可能
- 生成優先キュー: 利用可能
- イベント参加: 利用可能
- **イベント主催: 利用可能**
- **OpenDesignチャット: 利用可能**

## Error Codes

- `401`: Unauthorized - ログインが必要
- `403`: Forbidden - Pro会員のみ / イベント主催者のみ
- `404`: Not Found - イベント・投稿が見つからない
- `409`: Conflict - すでに投稿済み / すでにサポート済み
- `422`: Validation Error - 入力値エラー

## Notes

1. **イベント作成はPro会員のみ**: `isProMember()` でチェック
2. **投稿は1イベント1回まで**: `UNIQUE(event_id, published_item_id)` 制約
3. **サポートは1イベント1回まで**: `UNIQUE(event_id, user_id)` 制約
4. **人気イベント表示**: `calculatePopularityScore()` でソート
5. **イベントステータス自動更新**: Cron jobで1時間ごとに実行
6. **閲覧数トラッキング**: `/api/events/:id/view` を詳細画面表示時に呼び出し
