# LegalFlow3 DynamoDB データベース設計仕様書

**バージョン**: 1.0
**作成日**: 2024-01-15
**対象**: LegalFlow3 AWS実装

---

## 1. 概要

### 1.1 設計方針
- **複数テーブル設計**: ローカル実装（Prisma）と同様のテーブル分割
- **パフォーマンス最適化**: アクセスパターンに基づく効率的な設計
- **コスト効率**: 必要最小限のRCU/WCU使用
- **スケーラビリティ**: データ量増加に対応可能な設計

### 1.2 技術仕様
- **データベース**: Amazon DynamoDB
- **リージョン**: ap-northeast-1 (東京)
- **暗号化**: 保存時暗号化（AWS KMS）
- **バックアップ**: ポイントインタイムリカバリ有効

---

## 2. テーブル設計

### 2.1 Users テーブル
```yaml
TableName: LegalFlow3-Users
PartitionKey: id (String)
Attributes:
  - id: String (PK) - "USER#{cuid()}"
  - email: String - メールアドレス（ユニーク）
  - name: String - ユーザー名
  - role: String - "Lawyer" | "Paralegal"
  - createdAt: String - ISO 8601形式
  - updatedAt: String - ISO 8601形式
  - lastLoginAt: String - 最終ログイン日時
  - isActive: Boolean - アクティブ状態
  - profileImageUrl: String - プロフィール画像URL

GSI:
  - EmailIndex: email (PK) - メールアドレス検索用
  - RoleIndex: role (PK), createdAt (SK) - ロール別ユーザー一覧
```

### 2.2 Subscriptions テーブル
```yaml
TableName: LegalFlow3-Subscriptions
PartitionKey: userId (String)
Attributes:
  - userId: String (PK) - "USER#{cuid()}"
  - plan: String - "Free" | "Lawyer" | "Paralegal"
  - status: String - "Active" | "Suspended" | "Cancelled"
  - caseCount: Number - 現在の事件数
  - maxCases: Number - 最大事件数
  - usedStorage: Number - 使用ストレージ（MB）
  - maxStorage: Number - 最大ストレージ（MB）
  - billingCycle: String - "Monthly" | "Yearly"
  - nextBillingDate: String - 次回課金日
  - lastPaymentDate: String - 最終支払い日
  - createdAt: String - ISO 8601形式
  - updatedAt: String - ISO 8601形式
```

### 2.3 Cases テーブル
```yaml
TableName: LegalFlow3-Cases
PartitionKey: id (String)
SortKey: createdAt (String)
Attributes:
  - id: String (PK) - "CASE#{cuid()}"
  - name: String - 事件名
  - caseNumber: String - 事件番号
  - status: String - "Active" | "Closed" | "Suspended"
  - trialLevel: String - "First" | "Second" | "Third"
  - hourlyRate: Number - 時間単価
  - categoryId: String - カテゴリID
  - currentPhaseId: String - 現在のフェーズID
  - courtDivisionId: String - 裁判所部局ID
  - createdAt: String (SK) - ISO 8601形式
  - updatedAt: String - ISO 8601形式
  - firstConsultationDate: String - 初回相談日
  - engagementDate: String - 受任日
  - caseClosedDate: String - 事件終了日
  - litigationStartDate: String - 訴訟開始日
  - oralArgumentEndDate: String - 口頭弁論終了日
  - judgmentDate: String - 判決日
  - judgmentReceivedDate: String - 判決受領日
  - hasEngagementLetter: Boolean - 受任契約書の有無
  - engagementLetterPath: String - 受任契約書パス
  - remarks: String - 備考
  - customProperties: Map - カスタムプロパティ
  - tags: List<String> - タグ一覧
  - priority: String - "Low" | "Medium" | "High" | "Urgent"

GSI:
  - CategoryIndex: categoryId (PK), createdAt (SK) - カテゴリ別事件一覧
  - StatusIndex: status (PK), createdAt (SK) - ステータス別事件一覧
  - CourtDivisionIndex: courtDivisionId (PK), createdAt (SK) - 裁判所別事件一覧
```

### 2.4 CaseAssignments テーブル
```yaml
TableName: LegalFlow3-CaseAssignments
PartitionKey: caseId (String)
SortKey: userId (String)
Attributes:
  - caseId: String (PK) - "CASE#{cuid()}"
  - userId: String (SK) - "USER#{cuid()}"
  - role: String - "Lead" | "Collaborator"
  - permissions: Map - 権限設定
  - assignedAt: String - 割り当て日時
  - lastAccessedAt: String - 最終アクセス日時
  - isActive: Boolean - アクティブ状態

GSI:
  - UserCasesIndex: userId (PK), assignedAt (SK) - ユーザー別事件一覧
  - RoleIndex: role (PK), caseId (SK) - ロール別割り当て一覧
```

### 2.5 Parties テーブル
```yaml
TableName: LegalFlow3-Parties
PartitionKey: id (String)
Attributes:
  - id: String (PK) - "PARTY#{cuid()}"
  - isCorporation: Boolean - 法人フラグ
  - isFormerClient: Boolean - 元クライアントフラグ
  - createdAt: String - ISO 8601形式
  - updatedAt: String - ISO 8601形式
  - status: String - "Active" | "Inactive"
  - source: String - データソース
  - notes: String - 備考
```

### 2.6 IndividualProfiles テーブル
```yaml
TableName: LegalFlow3-IndividualProfiles
PartitionKey: partyId (String)
Attributes:
  - partyId: String (PK) - "PARTY#{cuid()}"
  - lastName: String - 姓
  - firstName: String - 名
  - lastNameKana: String - 姓（カナ）
  - firstNameKana: String - 名（カナ）
  - honorific: String - 敬称
  - formerName: String - 旧姓
  - dateOfBirth: String - 生年月日（ISO 8601）
  - legalDomicile: String - 本籍地
  - email: String - メールアドレス
  - phone: String - 電話番号
  - mobilePhone: String - 携帯電話
  - fax: String - FAX番号
  - postalCode: String - 郵便番号
  - address1: String - 住所1
  - address2: String - 住所2
  - companyName: String - 会社名
  - companyNameKana: String - 会社名（カナ）
  - companyPostalCode: String - 会社郵便番号
  - companyAddress1: String - 会社住所1
  - companyAddress2: String - 会社住所2
  - companyPhone: String - 会社電話
  - companyFax: String - 会社FAX
  - department: String - 部署
  - position: String - 役職
  - companyEmail: String - 会社メール
  - itemsInCustody: String - 保管物
  - cautions: String - 注意事項
  - remarks: String - 備考
  - emergencyContact: Map - 緊急連絡先

GSI:
  - NameIndex: lastName (PK), firstName (SK) - 名前検索用
  - EmailIndex: email (PK) - メールアドレス検索用
  - CompanyIndex: companyName (PK), lastName (SK) - 会社名検索用
```

### 2.7 CorporateProfiles テーブル
```yaml
TableName: LegalFlow3-CorporateProfiles
PartitionKey: partyId (String)
Attributes:
  - partyId: String (PK) - "PARTY#{cuid()}"
  - name: String - 会社名
  - nameKana: String - 会社名（カナ）
  - postalCode: String - 郵便番号
  - address1: String - 住所1
  - address2: String - 住所2
  - phone: String - 電話番号
  - mobilePhone: String - 携帯電話
  - fax: String - FAX番号
  - email: String - メールアドレス
  - websiteURL: String - ウェブサイトURL
  - representativeTitle: String - 代表者役職
  - representativeLastName: String - 代表者姓
  - representativeFirstName: String - 代表者名
  - contactLastName: String - 担当者姓
  - contactFirstName: String - 担当者名
  - contactLastNameKana: String - 担当者姓（カナ）
  - contactFirstNameKana: String - 担当者名（カナ）
  - contactDepartment: String - 担当者部署
  - contactPosition: String - 担当者役職
  - contactDirectPhone: String - 担当者直通電話
  - contactEmail: String - 担当者メール
  - contactMobilePhone: String - 担当者携帯
  - contactPostalCode: String - 担当者郵便番号
  - contactAddress1: String - 担当者住所1
  - contactAddress2: String - 担当者住所2
  - itemsInCustody: String - 保管物
  - cautions: String - 注意事項
  - remarks: String - 備考
  - businessType: String - 業種
  - capital: Number - 資本金
  - establishedDate: String - 設立日

GSI:
  - NameIndex: name (PK) - 会社名検索用
  - EmailIndex: email (PK) - メールアドレス検索用
  - RepresentativeIndex: representativeLastName (PK), representativeFirstName (SK) - 代表者名検索用
```

### 2.8 CaseParties テーブル
```yaml
TableName: LegalFlow3-CaseParties
PartitionKey: caseId (String)
SortKey: partyId#role (String)
Attributes:
  - caseId: String (PK) - "CASE#{cuid()}"
  - partyId: String - "PARTY#{cuid()}"
  - role: String - "plaintiff" | "defendant" | "our_insurance"
  - createdAt: String - ISO 8601形式

GSI:
  - PartyCasesIndex: partyId (PK), caseId (SK) - 当事者別事件一覧
  - RoleIndex: role (PK), caseId (SK) - 役割別当事者一覧
```

### 2.9 Tasks テーブル
```yaml
TableName: LegalFlow3-Tasks
PartitionKey: id (String)
Attributes:
  - id: String (PK) - "TASK#{cuid()}"
  - caseId: String - 事件ID
  - description: String - タスク説明
  - dueDate: String - 期限日時（ISO 8601）
  - isCompleted: Boolean - 完了フラグ
  - isAutoGenerated: Boolean - 自動生成フラグ
  - assignedToId: String - 担当者ID
  - assignedByName: String - 割り当て者名
  - assignedAt: String - 割り当て日時
  - priority: String - "Low" | "Medium" | "High" | "Urgent"
  - category: String - タスクカテゴリ
  - tags: List<String> - タグ一覧
  - createdAt: String - ISO 8601形式
  - updatedAt: String - ISO 8601形式
  - completedAt: String - 完了日時
  - estimatedHours: Number - 見積時間
  - actualHours: Number - 実際時間
  - notes: String - 備考
  - attachments: List<Map> - 添付ファイル

GSI:
  - CaseTasksIndex: caseId (PK), dueDate (SK) - 事件別タスク一覧
  - AssignedTasksIndex: assignedToId (PK), dueDate (SK) - 担当者別タスク一覧
  - StatusIndex: isCompleted (PK), dueDate (SK) - 完了状況別タスク一覧
```

### 2.10 TimesheetEntries テーブル
```yaml
TableName: LegalFlow3-TimesheetEntries
PartitionKey: id (String)
Attributes:
  - id: String (PK) - "TIMESHEET#{cuid()}"
  - caseId: String - 事件ID
  - userId: String - ユーザーID
  - startTime: String - 開始時刻（ISO 8601）
  - endTime: String - 終了時刻（ISO 8601）
  - duration: Number - 作業時間（分）
  - description: String - 作業内容
  - category: String - 作業カテゴリ
  - subcategory: String - 作業サブカテゴリ
  - billable: Boolean - 請求可能フラグ
  - hourlyRate: Number - 時間単価
  - createdAt: String - ISO 8601形式
  - updatedAt: String - ISO 8601形式
  - notes: String - 備考
  - tags: List<String> - タグ一覧
  - isApproved: Boolean - 承認フラグ
  - approvedBy: String - 承認者ID
  - approvedAt: String - 承認日時

GSI:
  - CaseTimesheetIndex: caseId (PK), startTime (SK) - 事件別タイムシート一覧
  - UserTimesheetIndex: userId (PK), startTime (SK) - ユーザー別タイムシート一覧
  - UserCaseTimesheetIndex: userId (PK), caseId#startTime (SK) - ユーザー・事件別タイムシート一覧
```

### 2.11 Notifications テーブル
```yaml
TableName: LegalFlow3-Notifications
PartitionKey: id (String)
Attributes:
  - id: String (PK) - "NOTIFICATION#{cuid()}"
  - userId: String - ユーザーID
  - eventType: String - イベントタイプ
  - message: String - メッセージ
  - isRead: Boolean - 既読フラグ
  - priority: String - "Low" | "Medium" | "High" | "Urgent"
  - channels: List<String> - 通知チャンネル
  - scheduledAt: String - 送信予定日時
  - relatedEntityType: String - 関連エンティティタイプ
  - relatedEntityId: String - 関連エンティティID
  - actionUrl: String - アクションURL
  - createdAt: String - ISO 8601形式
  - readAt: String - 既読日時
  - expiresAt: String - 有効期限
  - metadata: Map - メタデータ
  - templateId: String - テンプレートID
  - language: String - 言語

GSI:
  - UserNotificationsIndex: userId (PK), createdAt (SK) - ユーザー別通知一覧
  - UnreadNotificationsIndex: userId (PK), isRead#createdAt (SK) - 未読通知一覧
  - EventTypeIndex: eventType (PK), createdAt (SK) - イベントタイプ別通知一覧
```

---

## 3. アクセスパターン

### 3.1 主要クエリパターン

#### ユーザー認証・管理
- メールアドレスでユーザー検索（EmailIndex使用）
- ユーザーIDで直接取得（GetItem）
- ユーザー情報更新（UpdateItem）

#### 事件管理
- ユーザー別事件一覧取得（UserCasesIndex使用）
- 事件詳細取得（GetItem）
- カテゴリ別事件一覧（CategoryIndex使用）
- ステータス別事件一覧（StatusIndex使用）

#### 当事者管理
- 事件別当事者一覧（CasePartiesテーブル）
- 当事者詳細取得（Partiesテーブル）
- 名前で当事者検索（NameIndex使用）
- メールアドレスで当事者検索（EmailIndex使用）

#### タスク管理
- 事件別タスク一覧（CaseTasksIndex使用）
- 担当者別タスク一覧（AssignedTasksIndex使用）
- 完了タスク一覧（StatusIndex使用）

#### タイムシート管理
- 事件別タイムシート一覧（CaseTimesheetIndex使用）
- ユーザー別タイムシート一覧（UserTimesheetIndex使用）
- ユーザー・事件別タイムシート（UserCaseTimesheetIndex使用）

#### 通知管理
- ユーザー別通知一覧（UserNotificationsIndex使用）
- 未読通知一覧（UnreadNotificationsIndex使用）
- イベントタイプ別通知（EventTypeIndex使用）

### 3.2 複合クエリパターン

#### 事件詳細情報の一括取得
1. 事件基本情報取得（Casesテーブル）
2. 事件当事者一覧取得（CasePartiesテーブル）
3. 事件タスク一覧取得（Tasksテーブル）
4. 事件タイムシート一覧取得（TimesheetEntriesテーブル）

#### ダッシュボード情報の一括取得
1. ユーザー事件一覧取得（CaseAssignmentsテーブル）
2. 担当タスク一覧取得（Tasksテーブル）
3. 未読通知一覧取得（Notificationsテーブル）
4. 最近のタイムシート取得（TimesheetEntriesテーブル）

---

## 4. パフォーマンス最適化

### 4.1 読み取り最適化
- **プロジェクション**: 必要な属性のみ取得
- **バッチ処理**: 複数アイテムの一括取得
- **キャッシュ**: 頻繁にアクセスされるデータのキャッシュ
- **非同期処理**: 重い処理の非同期化

### 4.2 書き込み最適化
- **バッチ書き込み**: 複数アイテムの一括書き込み
- **条件付き書き込み**: 競合状態の回避
- **トランザクション**: 関連データの整合性確保

### 4.3 コスト最適化
- **RCU最適化**: 最小限の読み取りで最大の効率
- **WCU最適化**: バッチ書き込みの活用
- **GSI最適化**: 必要最小限のGSI数
- **プロジェクション最適化**: 用途に応じた属性選択

---

## 5. セキュリティ設定

### 5.1 暗号化
- **保存時暗号化**: AWS KMSによる暗号化
- **転送時暗号化**: HTTPS/TLS 1.2以上
- **キー管理**: カスタマーマネージドキー（CMK）

### 5.2 アクセス制御
- **IAMポリシー**: 最小権限の原則
- **リソースベースポリシー**: テーブルレベルでのアクセス制御
- **条件付きアクセス**: IPアドレス、時間帯による制限

### 5.3 監査ログ
- **CloudTrail**: API呼び出しの記録
- **DynamoDB Streams**: データ変更の記録
- **CloudWatch**: メトリクスとアラーム

---

## 6. バックアップ・復旧

### 6.1 バックアップ戦略
- **ポイントインタイムリカバリ**: 35日間の自動バックアップ
- **オンデマンドバックアップ**: 重要な変更前の手動バックアップ
- **クロスリージョンバックアップ**: 災害復旧用のバックアップ

### 6.2 復旧手順
- **RTO**: 4時間以内
- **RPO**: 1時間以内
- **テスト**: 月次復旧テストの実施

---

## 7. 監視・アラート

### 7.1 メトリクス監視
- **RCU/WCU使用率**: 80%以上でアラート
- **スロットル**: スロットル発生時にアラート
- **エラー率**: 5%以上でアラート
- **レスポンス時間**: 100ms以上でアラート

### 7.2 アラート設定
- **CloudWatchアラーム**: 閾値超過時の通知
- **SNS通知**: メール、SMS、Slack通知
- **自動スケーリング**: 負荷に応じた自動調整

---

## 8. 実装ガイドライン

### 8.1 開発環境
- **ローカル開発**: DynamoDB Local使用
- **テスト環境**: 本番環境と同様の設定
- **ステージング環境**: 本番データのサブセット

### 8.2 デプロイメント
- **Infrastructure as Code**: CDK/Terraform使用
- **Blue-Greenデプロイ**: ダウンタイムなしのデプロイ
- **ロールバック**: 問題発生時の迅速な復旧

### 8.3 テスト戦略
- **単体テスト**: 各テーブル操作のテスト
- **統合テスト**: 複数テーブル連携のテスト
- **負荷テスト**: パフォーマンステスト
- **セキュリティテスト**: アクセス制御のテスト

---

## 9. 今後の拡張計画

### 9.1 短期計画（3ヶ月）
- 基本的なCRUD操作の実装
- 認証・認可システムの統合
- 基本的なクエリパターンの実装

### 9.2 中期計画（6ヶ月）
- 高度な検索機能の実装
- レポート機能の実装
- パフォーマンス最適化

### 9.3 長期計画（12ヶ月）
- 機械学習機能の統合
- リアルタイム分析機能
- グローバル展開対応

---

## 10. 参考資料

- [Amazon DynamoDB Developer Guide](https://docs.aws.amazon.com/dynamodb/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/dynamodb/latest/developerguide/best-practices.html)
- [DynamoDB Design Patterns](https://docs.aws.amazon.com/dynamodb/latest/developerguide/bp-general-nosql-design.html)
- [LegalFlow3 Local Implementation](backend/api_service/prisma/schema.prisma)

---

**文書管理**
- 作成者: AI Assistant
- 承認者: [承認者名]
- 次回レビュー: 2024-04-15
- バージョン履歴: v1.0 (2024-01-15)
