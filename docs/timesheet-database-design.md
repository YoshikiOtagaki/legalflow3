# タイムシート機能データベース設計

## 概要

LegalFlow3システムのタイムシート機能のためのDynamoDBテーブル設計です。時間追跡、タイマー機能、統計機能を効率的に管理します。

## テーブル設計

### 1. TimesheetEntries テーブル

タイムシートエントリの基本情報を格納するメインテーブルです。

#### テーブル構造

| 属性名 | データ型 | 説明 | 必須 |
|--------|----------|------|------|
| PK | String | パーティションキー | ✓ |
| SK | String | ソートキー | ✓ |
| id | String | タイムシートエントリID | ✓ |
| caseId | String | ケースID | ✓ |
| userId | String | ユーザーID | ✓ |
| taskId | String | タスクID | - |
| startTime | String | 開始時刻 | ✓ |
| endTime | String | 終了時刻 | ✓ |
| duration | Number | 作業時間（分） | ✓ |
| description | String | 作業内容 | - |
| category | String | カテゴリ | - |
| billable | Boolean | 請求可能フラグ | ✓ |
| hourlyRate | Number | 時給 | - |
| totalAmount | Number | 総金額 | - |
| isActive | Boolean | アクティブフラグ | ✓ |
| createdAt | String | 作成日時 | ✓ |
| updatedAt | String | 更新日時 | ✓ |
| createdBy | String | 作成者ID | ✓ |
| updatedBy | String | 更新者ID | ✓ |

#### パーティションキー・ソートキー設計

```
PK: TIMESHEET#{userId}
SK: ENTRY#{startTime}#{id}
```

### 2. Timers テーブル

アクティブなタイマー情報を管理するテーブルです。

#### テーブル構造

| 属性名 | データ型 | 説明 | 必須 |
|--------|----------|------|------|
| PK | String | パーティションキー | ✓ |
| SK | String | ソートキー | ✓ |
| id | String | タイマーID | ✓ |
| userId | String | ユーザーID | ✓ |
| caseId | String | ケースID | - |
| taskId | String | タスクID | - |
| status | String | タイマー状態 | ✓ |
| startTime | String | 開始時刻 | ✓ |
| pausedAt | String | 一時停止時刻 | - |
| totalPausedTime | Number | 総一時停止時間（ミリ秒） | ✓ |
| currentSessionTime | Number | 現在のセッション時間（ミリ秒） | ✓ |
| totalTime | Number | 総時間（ミリ秒） | ✓ |
| description | String | 説明 | ✓ |
| lastUpdated | String | 最終更新時刻 | ✓ |
| createdAt | String | 作成日時 | ✓ |

#### パーティションキー・ソートキー設計

```
PK: TIMER#{userId}
SK: ACTIVE#{id}
```

### 3. TimeCategories テーブル

時間カテゴリを管理するテーブルです。

#### テーブル構造

| 属性名 | データ型 | 説明 | 必須 |
|--------|----------|------|------|
| PK | String | パーティションキー | ✓ |
| SK | String | ソートキー | ✓ |
| id | String | カテゴリID | ✓ |
| name | String | カテゴリ名 | ✓ |
| description | String | 説明 | - |
| color | String | 色コード | - |
| isDefault | Boolean | デフォルトフラグ | ✓ |
| isActive | Boolean | アクティブフラグ | ✓ |
| createdAt | String | 作成日時 | ✓ |
| updatedAt | String | 更新日時 | ✓ |

#### パーティションキー・ソートキー設計

```
PK: CATEGORY
SK: CATEGORY#{id}
```

### 4. TimesheetStats テーブル

タイムシート統計情報を管理するテーブルです。

#### テーブル構造

| 属性名 | データ型 | 説明 | 必須 |
|--------|----------|------|------|
| PK | String | パーティションキー | ✓ |
| SK | String | ソートキー | ✓ |
| id | String | 統計ID | ✓ |
| userId | String | ユーザーID | - |
| caseId | String | ケースID | - |
| period | String | 期間種別 | ✓ |
| periodValue | String | 期間値 | ✓ |
| totalHours | Number | 総時間 | ✓ |
| totalMinutes | Number | 総分 | ✓ |
| totalSeconds | Number | 総秒 | ✓ |
| dailyHours | Number | 日別時間 | ✓ |
| weeklyHours | Number | 週別時間 | ✓ |
| monthlyHours | Number | 月別時間 | ✓ |
| caseHours | Map | ケース別時間 | - |
| taskHours | Map | タスク別時間 | - |
| averageSessionLength | Number | 平均セッション時間 | ✓ |
| totalSessions | Number | 総セッション数 | ✓ |
| createdAt | String | 作成日時 | ✓ |
| updatedAt | String | 更新日時 | ✓ |

#### パーティションキー・ソートキー設計

```
PK: STATS#{userId}#{period}
SK: PERIOD#{periodValue}
```

## グローバルセカンドインデックス（GSI）

### GSI1: ケース別インデックス

```
GSI1PK: CASE#{caseId}
GSI1SK: ENTRY#{startTime}
```

### GSI2: 日付別インデックス

```
GSI2PK: DATE#{date}
GSI2SK: USER#{userId}#{startTime}
```

### GSI3: タスク別インデックス

```
GSI3PK: TASK#{taskId}
GSI3SK: ENTRY#{startTime}
```

### GSI4: カテゴリ別インデックス

```
GSI4PK: CATEGORY#{category}
GSI4SK: ENTRY#{startTime}
```

### GSI5: アクティブタイマーインデックス

```
GSI5PK: TIMER_STATUS#{status}
GSI5SK: USER#{userId}#{startTime}
```

## アクセスパターン

### 1. ユーザーのタイムシートエントリ取得

```
Query: PK = TIMESHEET#{userId}
```

### 2. ケースのタイムシートエントリ取得

```
Query: GSI1PK = CASE#{caseId}
```

### 3. 日付範囲でのタイムシートエントリ取得

```
Query: GSI2PK = DATE#{date} AND GSI2SK begins_with(USER#{userId})
```

### 4. タスクのタイムシートエントリ取得

```
Query: GSI3PK = TASK#{taskId}
```

### 5. カテゴリ別タイムシートエントリ取得

```
Query: GSI4PK = CATEGORY#{category}
```

### 6. アクティブタイマー取得

```
Query: GSI5PK = TIMER_STATUS#running
```

### 7. ユーザーのアクティブタイマー取得

```
Query: PK = TIMER#{userId} AND begins_with(SK, "ACTIVE#")
```

### 8. 統計情報取得

```
Query: PK = STATS#{userId}#{period}
```

## データ型定義

### タイマー状態

```typescript
enum TimerStatus {
  STOPPED = 'stopped',
  RUNNING = 'running',
  PAUSED = 'paused'
}
```

### 期間種別

```typescript
enum PeriodType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  CUSTOM = 'custom'
}
```

### 時間カテゴリ

```typescript
enum TimeCategory {
  RESEARCH = 'research',
  DRAFTING = 'drafting',
  MEETING = 'meeting',
  COURT = 'court',
  ADMINISTRATIVE = 'administrative',
  OTHER = 'other'
}
```

## パフォーマンス考慮事項

### 1. ホットパーティション対策

- ユーザーIDをベースにしたパーティション設計
- 時間ベースのソートキーで分散

### 2. クエリ最適化

- 必要な属性のみを取得
- バッチ処理で複数エントリを取得
- ページネーションの実装

### 3. インデックス最適化

- 頻繁にアクセスされる属性でGSIを作成
- 不要なGSIは削除

## セキュリティ考慮事項

### 1. データ暗号化

- 機密情報は暗号化
- KMSキーを使用した暗号化

### 2. アクセス制御

- IAMポリシーでアクセス制御
- ロールベースの権限管理

### 3. 監査ログ

- すべての操作をログ記録
- 時間記録の監査

## バックアップ・復旧

### 1. ポイントインタイムリカバリ

- すべてのテーブルで有効化
- 35日間の保持期間

### 2. オンデマンドバックアップ

- 定期的なバックアップ作成
- テスト環境での復旧テスト

## 監視・アラート

### 1. CloudWatchメトリクス

- 読み取り・書き込み容量
- エラー率
- レイテンシ

### 2. アラート設定

- 容量使用率の監視
- エラー率の監視
- レイテンシの監視

## ローカル実装との対応

### 1. TimesheetEntry

- ローカルの基本構造を維持
- DynamoDBの特性に合わせて最適化

### 2. TimesheetTimerService

- メモリベースのタイマー管理
- DynamoDBでの永続化

### 3. TimesheetStatsService

- 統計計算の最適化
- キャッシュ戦略の実装

### 4. フロントエンド

- リアルタイム更新
- オフライン対応
