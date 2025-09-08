# AWSサービス活用機能実装タスクリスト

## 概要
LegalFlow3アプリケーションの各機能をAWSのサービスを活用して実装していくタスクリストです。

## 実装順序とタスク

### 1. ケース管理機能 (最優先)
**目標**: ケースの作成、編集、削除、一覧表示機能を実装

#### 1.1 データベース設計 ✅
- [x] Amazon DynamoDBテーブル設計
  - [x] Casesテーブル（ケース基本情報）
  - [x] Usersテーブル（ユーザー情報）
  - [x] Partiesテーブル（当事者情報）
  - [x] Tasksテーブル（タスク情報）
  - [x] TimesheetEntriesテーブル（タイムシート情報）
  - [x] Memosテーブル（メモ情報）
- [x] DynamoDBのパーティションキー・ソートキー設計
- [x] GSI（グローバルセカンダリインデックス）設計
- **実装ファイル**: `docs/dynamodb-design-specification.md`

#### 1.2 AWS AppSync (GraphQL) 設定 ✅
- [x] GraphQLスキーマ定義
  - [x] Case型定義
  - [x] User型定義
  - [x] Party型定義
  - [x] Task型定義
  - [x] TimesheetEntry型定義
  - [x] Memo型定義
- [x] Query定義（一覧取得、詳細取得、検索）
- [x] Mutation定義（作成、更新、削除）
- [x] Subscription定義（リアルタイム更新）
- **実装ファイル**: `amplify/data/schema.graphql`, `amplify/data/resolvers/`

#### 1.3 AWS Lambda関数実装 ✅
- [x] ケース作成Lambda関数
- [x] ケース更新Lambda関数
- [x] ケース削除Lambda関数
- [x] ケース一覧取得Lambda関数
- [x] ケース詳細取得Lambda関数
- [x] ケース検索Lambda関数
- **実装ファイル**: `amplify/backend/function/{functionName}/src/index.js`

#### 1.4 フロントエンド統合 ✅
- [x] AWS Amplify Data Client設定
- [x] ケース一覧コンポーネント実装
- [x] ケース詳細コンポーネント実装
- [x] ケース作成フォーム実装
- [x] ケース編集フォーム実装
- [x] ケース検索機能実装
- **実装ファイル**: `frontend/src/components/cases/`, `frontend/src/hooks/use-cases.ts`

#### 1.5 テスト実装 ✅
- [x] Lambda関数のユニットテスト（Jest）
- [x] フロントエンドコンポーネントのユニットテスト（Vitest）
- [x] API統合テスト
- [x] E2Eテスト（Playwright）
- [x] パフォーマンステスト
- [x] セキュリティテスト（OWASP Top 10）
- **実装ファイル**: `amplify/backend/function/*/tests/`, `frontend/src/test/`, `frontend/e2e/`

#### 1.6 デプロイメント設定 ✅
- [x] AWS Amplify設定
- [x] DynamoDBテーブル作成
- [x] Lambda関数デプロイ
- [x] AppSync GraphQL API設定
- [x] 環境変数とシークレット管理
- [x] CI/CDパイプライン設定（GitHub Actions）
- **実装ファイル**: `amplify/backend/`, `.github/workflows/`

#### 1.7 ドキュメント作成 ✅
- [x] API仕様書
- [x] ユーザーマニュアル
- [x] 開発者ガイド
- [x] デプロイメントガイド
- [x] トラブルシューティングガイド
- [x] セキュリティガイド
- **実装ファイル**: `docs/api-specification.md`, `docs/user-manual.md`, `docs/developer-guide.md`, `docs/deployment-guide.md`, `docs/troubleshooting-guide.md`, `docs/security-guide.md`

---

### 2. 認証機能の拡張 ✅
**目標**: 既存のCognito認証を拡張し、権限管理を実装

#### 2.1 Amazon Cognito設定拡張 ✅
- [x] ユーザープール設定の詳細化
- [x] カスタム属性の追加（役職、所属事務所等）
- [x] ユーザーグループ設定
- [x] パスワードポリシー設定
- [x] 認証トリガー実装（preSignUp, postConfirmation, preAuthentication, postAuthentication, customMessage）
- **実装ファイル**: `amplify/auth/cognito-config.ts`, `amplify/auth/triggers/`, `amplify/auth/user-groups.ts`

#### 2.2 AWS IAM設定 ✅
- [x] ロールベースアクセス制御（RBAC）設計
- [x] ユーザーロール定義
- [x] リソースアクセス権限設定
- [x] ポリシー文作成
- [x] 権限チェックサービス実装
- **実装ファイル**: `amplify/auth/iam-policies.ts`, `amplify/auth/iam-roles.ts`, `amplify/auth/rbac-service.ts`

#### 2.3 認証フロントエンド実装 ✅
- [x] ユーザー登録フォーム拡張
- [x] プロフィール管理機能
- [x] パスワード変更機能
- [x] 権限チェック機能
- [x] ログインフォーム実装
- [x] MFA認証フォーム実装
- [x] 認証ガード実装
- **実装ファイル**: `frontend/src/lib/auth-config.ts`, `frontend/src/hooks/use-auth.ts`, `frontend/src/components/auth/`

---

### 3. 当事者管理機能 ✅
**目標**: ケースに関連する当事者（個人・法人）の管理機能を実装

#### 3.1 データベース設計 ✅
- [x] Partiesテーブル設計
- [x] PartyTypesテーブル設計（個人・法人）
- [x] PartyRelationsテーブル設計（当事者関係）
- [x] ケースとの関連テーブル設計
- **実装ファイル**: `docs/parties-database-design.md`

#### 3.2 AWS AppSync設定 ✅
- [x] Party型定義
- [x] PartyType型定義
- [x] PartyRelation型定義
- [x] Query・Mutation・Subscription定義
- **実装ファイル**: `amplify/data/parties-schema.graphql`, `amplify/data/resolvers/parties-queries.js`, `amplify/data/resolvers/parties-mutations.js`

#### 3.3 AWS Lambda関数実装 ✅
- [x] 当事者作成Lambda関数
- [x] 当事者更新Lambda関数
- [x] 当事者削除Lambda関数
- [x] 当事者一覧取得Lambda関数
- [x] 当事者検索Lambda関数
- **実装ファイル**: `amplify/backend/function/createParty/`, `amplify/backend/function/updateParty/`, `amplify/backend/function/deleteParty/`, `amplify/backend/function/listParties/`, `amplify/backend/function/searchParties/`

#### 3.4 フロントエンド実装 ✅
- [x] 当事者一覧コンポーネント
- [x] 当事者詳細コンポーネント
- [x] 当事者作成フォーム
- [x] 当事者編集フォーム
- [x] ケースとの関連付け機能
- **実装ファイル**: `frontend/src/hooks/use-parties.ts`, `frontend/src/components/parties/`

---

### 4. タイムシート機能 ✅
**目標**: 時間追跡とタイマー機能を実装

#### 4.1 データベース設計 ✅
- [x] TimesheetEntriesテーブル設計
- [x] Timersテーブル設計
- [x] TimeCategoriesテーブル設計
- [x] ケースとの関連設計
- **実装ファイル**: `docs/timesheet-database-design.md`

#### 4.2 AWS AppSync設定 ✅
- [x] GraphQLスキーマ定義
- [x] クエリ・ミューテーション定義
- [x] リゾルバー実装
- **実装ファイル**: `amplify/data/timesheet-schema.graphql`, `amplify/data/resolvers/timesheet-queries.js`, `amplify/data/resolvers/timesheet-mutations.js`

#### 4.3 AWS Lambda関数実装 ✅
- [x] タイマー開始Lambda関数
- [x] タイマー停止Lambda関数
- [x] タイマー一時停止・再開Lambda関数
- [x] タイムエントリ作成Lambda関数
- [x] タイムエントリ更新Lambda関数
- [x] タイムエントリ削除Lambda関数
- [x] タイムシート統計Lambda関数
- **実装ファイル**: `amplify/backend/function/createTimesheetEntry/`, `amplify/backend/function/startTimer/`, `amplify/backend/function/stopTimer/`, `amplify/backend/function/pauseTimer/`, `amplify/backend/function/resumeTimer/`, `amplify/backend/function/getTimesheetStats/`

#### 4.4 フロントエンド実装 ✅
- [x] タイマーウィジェット実装
- [x] タイムシート一覧実装
- [x] タイムエントリ作成フォーム
- [x] タイムエントリ編集フォーム
- [x] リアルタイムタイマー表示
- **実装ファイル**: `frontend/src/hooks/use-timesheet.ts`, `frontend/src/components/timesheet/`

---

### 5. ドキュメント管理機能 ✅
**目標**: ドキュメントの保存、管理、生成機能を実装

#### 5.1 データベース設計 ✅
- [x] Documentsテーブル設計
- [x] DocumentVersionsテーブル設計
- [x] DocumentTemplatesテーブル設計
- [x] ケースとの関連設計
- **実装ファイル**: `docs/documents-database-design.md`

#### 5.2 AWS AppSync設定 ✅
- [x] GraphQLスキーマ定義
- [x] クエリ・ミューテーション定義
- [x] リゾルバー実装
- **実装ファイル**: `amplify/data/documents-schema.graphql`, `amplify/data/resolvers/documents-queries.js`, `amplify/data/resolvers/documents-mutations.js`

#### 5.3 AWS Lambda関数実装 ✅
- [x] ドキュメント作成Lambda関数
- [x] ドキュメント更新Lambda関数
- [x] ドキュメント削除Lambda関数
- [x] ドキュメント生成Lambda関数
- [x] ドキュメントアップロードLambda関数
- **実装ファイル**: `amplify/backend/function/createDocument/`, `amplify/backend/function/updateDocument/`, `amplify/backend/function/deleteDocument/`, `amplify/backend/function/generateDocument/`, `amplify/backend/function/uploadDocument/`

#### 5.4 フロントエンド実装 ✅
- [x] ドキュメント一覧実装
- [x] ドキュメント作成フォーム
- [x] ドキュメント編集フォーム
- [x] ドキュメントアップロード機能
- [x] ドキュメント生成機能
- **実装ファイル**: `frontend/src/hooks/use-documents.ts`, `frontend/src/components/documents/`

---

### 6. 通知管理機能 ✅
**目標**: リアルタイム通知機能を実装

#### 6.1 データベース設計 ✅
- [x] Notificationsテーブル設計
- [x] NotificationTypesテーブル設計
- [x] NotificationPrioritiesテーブル設計
- [x] NotificationChannelsテーブル設計
- [x] NotificationSettingsテーブル設計
- [x] ユーザーとの関連設計
- **実装ファイル**: `docs/notifications-database-design.md`

#### 6.2 AWS AppSync設定 ✅
- [x] GraphQLスキーマ定義
- [x] クエリ・ミューテーション定義
- [x] リゾルバー実装
- **実装ファイル**: `amplify/data/notifications-schema.graphql`, `amplify/data/resolvers/notifications-queries.js`, `amplify/data/resolvers/notifications-mutations.js`

#### 6.3 AWS Lambda関数実装 ✅
- [x] 通知作成Lambda関数
- [x] 通知送信Lambda関数
- [x] 通知設定管理Lambda関数
- [x] スケジュール通知処理Lambda関数
- **実装ファイル**: `amplify/backend/function/createNotification/`, `amplify/backend/function/sendNotification/`, `amplify/backend/function/updateNotificationSettings/`, `amplify/backend/function/processScheduledNotifications/`

#### 6.4 フロントエンド実装 ✅
- [x] 通知一覧コンポーネント
- [x] 通知設定コンポーネント
- [x] リアルタイム通知表示
- [x] 通知ベルコンポーネント
- [x] 通知統計コンポーネント
- **実装ファイル**: `frontend/src/hooks/use-notifications.ts`, `frontend/src/components/notifications/`, `frontend/src/graphql/`, `frontend/src/app/notifications/page.tsx`

---

### 7. ダッシュボード機能 ✅
**目標**: 統計情報とレポート機能を実装

#### 7.1 データベース設計 ✅
- [x] DashboardMetricsテーブル設計
- [x] Reportsテーブル設計
- [x] DashboardWidgetsテーブル設計
- [x] DashboardLayoutsテーブル設計
- [x] SystemMetricsテーブル設計
- **実装ファイル**: `docs/dashboard-database-design.md`

#### 7.2 AWS AppSync設定 ✅
- [x] GraphQLスキーマ定義
- [x] クエリ・ミューテーション定義
- [x] リゾルバー実装
- **実装ファイル**: `amplify/data/dashboard-schema.graphql`, `amplify/data/resolvers/dashboard-queries.js`, `amplify/data/resolvers/dashboard-mutations.js`

#### 7.3 AWS Lambda関数実装 ✅
- [x] メトリクス収集Lambda関数
- [x] レポート生成Lambda関数
- [x] メトリクス集計Lambda関数
- **実装ファイル**: `amplify/backend/function/collectMetrics/`, `amplify/backend/function/generateReport/`, `amplify/backend/function/aggregateMetrics/`

#### 7.4 フロントエンド実装 ✅
- [x] 統計カードコンポーネント
- [x] グラフコンポーネント
- [x] レポート表示コンポーネント
- [x] ダッシュボードページ
- **実装ファイル**: `frontend/src/hooks/use-dashboard.ts`, `frontend/src/components/dashboard/`, `frontend/src/app/dashboard/page.tsx`

---

## 実装の進め方

1. **各タスクを順番に実装**
2. **各タスク完了後にテスト**
3. **フロントエンドとバックエンドの統合テスト**
4. **本番環境での動作確認**

## 注意事項

- 各AWSサービスの料金に注意
- セキュリティ設定を適切に行う
- エラーハンドリングを実装
- ログ出力を適切に設定
- モニタリング設定を行う

## 完了条件

- [ ] すべてのタスクが完了
- [ ] 各機能が正常に動作
- [ ] セキュリティテストが完了
- [ ] パフォーマンステストが完了
- [ ] ユーザー受け入れテストが完了
