# 当事者管理データベース設計

## 概要

LegalFlow3システムの当事者管理機能のためのDynamoDBテーブル設計です。個人・法人の当事者情報を効率的に管理します。

## テーブル設計

### 1. Parties テーブル

当事者の基本情報を格納するメインテーブルです。

#### テーブル構造

| 属性名 | データ型 | 説明 | 必須 |
|--------|----------|------|------|
| PK | String | パーティションキー | ✓ |
| SK | String | ソートキー | ✓ |
| id | String | 当事者ID | ✓ |
| isCorporation | Boolean | 法人フラグ | ✓ |
| isFormerClient | Boolean | 元クライアントフラグ | ✓ |
| individualProfile | Map | 個人プロフィール | - |
| corporateProfile | Map | 法人プロフィール | - |
| createdAt | String | 作成日時 | ✓ |
| updatedAt | String | 更新日時 | ✓ |
| createdBy | String | 作成者ID | ✓ |
| updatedBy | String | 更新者ID | ✓ |

#### パーティションキー・ソートキー設計

```
PK: PARTY#{partyId}
SK: METADATA
```

#### 個人プロフィール構造

```json
{
  "individualProfile": {
    "firstName": "太郎",
    "lastName": "田中",
    "firstNameKana": "タロウ",
    "lastNameKana": "タナカ",
    "dateOfBirth": "1980-01-01",
    "gender": "MALE",
    "nationality": "JP",
    "occupation": "会社員",
    "maritalStatus": "MARRIED",
    "spouseName": "花子",
    "children": [
      {
        "name": "一郎",
        "dateOfBirth": "2010-05-15"
      }
    ]
  }
}
```

#### 法人プロフィール構造

```json
{
  "corporateProfile": {
    "companyName": "株式会社サンプル",
    "companyNameKana": "カブシキガイシャサンプル",
    "representativeName": "代表取締役 田中太郎",
    "establishmentDate": "2010-04-01",
    "capital": 10000000,
    "employees": 50,
    "industry": "IT",
    "businessDescription": "ソフトウェア開発",
    "registrationNumber": "1234567890123",
    "taxId": "T1234567890123"
  }
}
```

### 2. PartyAddresses テーブル

当事者の住所情報を管理するテーブルです。

#### テーブル構造

| 属性名 | データ型 | 説明 | 必須 |
|--------|----------|------|------|
| PK | String | パーティションキー | ✓ |
| SK | String | ソートキー | ✓ |
| partyId | String | 当事者ID | ✓ |
| addressType | String | 住所種別 | ✓ |
| isPrimary | Boolean | 主住所フラグ | ✓ |
| address | Map | 住所情報 | ✓ |
| createdAt | String | 作成日時 | ✓ |
| updatedAt | String | 更新日時 | ✓ |

#### パーティションキー・ソートキー設計

```
PK: PARTY#{partyId}
SK: ADDRESS#{addressType}#{timestamp}
```

#### 住所情報構造

```json
{
  "address": {
    "postalCode": "100-0001",
    "prefecture": "東京都",
    "city": "千代田区",
    "address1": "千代田1-1-1",
    "address2": "サンプルビル 5F",
    "country": "JP",
    "isValid": true,
    "validationDate": "2024-01-01"
  }
}
```

### 3. PartyContacts テーブル

当事者の連絡先情報を管理するテーブルです。

#### テーブル構造

| 属性名 | データ型 | 説明 | 必須 |
|--------|----------|------|------|
| PK | String | パーティションキー | ✓ |
| SK | String | ソートキー | ✓ |
| partyId | String | 当事者ID | ✓ |
| contactType | String | 連絡先種別 | ✓ |
| isPrimary | Boolean | 主連絡先フラグ | ✓ |
| contact | Map | 連絡先情報 | ✓ |
| createdAt | String | 作成日時 | ✓ |
| updatedAt | String | 更新日時 | ✓ |

#### パーティションキー・ソートキー設計

```
PK: PARTY#{partyId}
SK: CONTACT#{contactType}#{timestamp}
```

#### 連絡先情報構造

```json
{
  "contact": {
    "phone": "03-1234-5678",
    "mobile": "090-1234-5678",
    "email": "tanaka@example.com",
    "fax": "03-1234-5679",
    "website": "https://example.com",
    "isValid": true,
    "validationDate": "2024-01-01"
  }
}
```

### 4. PartyRelations テーブル

当事者間の関係を管理するテーブルです。

#### テーブル構造

| 属性名 | データ型 | 説明 | 必須 |
|--------|----------|------|------|
| PK | String | パーティションキー | ✓ |
| SK | String | ソートキー | ✓ |
| partyId1 | String | 当事者1のID | ✓ |
| partyId2 | String | 当事者2のID | ✓ |
| relationType | String | 関係種別 | ✓ |
| description | String | 関係の説明 | - |
| isActive | Boolean | 有効フラグ | ✓ |
| createdAt | String | 作成日時 | ✓ |
| updatedAt | String | 更新日時 | ✓ |

#### パーティションキー・ソートキー設計

```
PK: PARTY#{partyId1}
SK: RELATION#{partyId2}#{relationType}
```

### 5. CaseParties テーブル

ケースと当事者の関連を管理するテーブルです。

#### テーブル構造

| 属性名 | データ型 | 説明 | 必須 |
|--------|----------|------|------|
| PK | String | パーティションキー | ✓ |
| SK | String | ソートキー | ✓ |
| caseId | String | ケースID | ✓ |
| partyId | String | 当事者ID | ✓ |
| partyRole | String | 当事者役割 | ✓ |
| isPrimary | Boolean | 主当事者フラグ | ✓ |
| assignedAt | String | 割り当て日時 | ✓ |
| assignedBy | String | 割り当て者ID | ✓ |
| isActive | Boolean | 有効フラグ | ✓ |
| createdAt | String | 作成日時 | ✓ |
| updatedAt | String | 更新日時 | ✓ |

#### パーティションキー・ソートキー設計

```
PK: CASE#{caseId}
SK: PARTY#{partyId}
```

## グローバルセカンドインデックス（GSI）

### GSI1: 当事者種別別インデックス

```
GSI1PK: PARTY_TYPE#{isCorporation}
GSI1SK: CREATED#{createdAt}
```

### GSI2: 作成者別インデックス

```
GSI2PK: CREATED_BY#{createdBy}
GSI2SK: CREATED#{createdAt}
```

### GSI3: 更新者別インデックス

```
GSI3PK: UPDATED_BY#{updatedBy}
GSI3SK: UPDATED#{updatedAt}
```

### GSI4: 当事者役割別インデックス（CaseParties用）

```
GSI4PK: PARTY_ROLE#{partyRole}
GSI4SK: CASE#{caseId}
```

## アクセスパターン

### 1. 当事者一覧取得

```
Query: PK = PARTY#{partyId} AND SK = METADATA
```

### 2. 個人当事者一覧取得

```
Query: GSI1PK = PARTY_TYPE#false
```

### 3. 法人当事者一覧取得

```
Query: GSI1PK = PARTY_TYPE#true
```

### 4. 当事者検索

```
Query: PK = PARTY#{partyId} AND begins_with(SK, "METADATA")
```

### 5. ケースの当事者一覧取得

```
Query: PK = CASE#{caseId} AND begins_with(SK, "PARTY#")
```

### 6. 当事者の住所一覧取得

```
Query: PK = PARTY#{partyId} AND begins_with(SK, "ADDRESS#")
```

### 7. 当事者の連絡先一覧取得

```
Query: PK = PARTY#{partyId} AND begins_with(SK, "CONTACT#")
```

### 8. 当事者間の関係取得

```
Query: PK = PARTY#{partyId1} AND begins_with(SK, "RELATION#")
```

## データ型定義

### 当事者種別

```typescript
enum PartyType {
  INDIVIDUAL = 'INDIVIDUAL',
  CORPORATION = 'CORPORATION'
}
```

### 性別

```typescript
enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  UNKNOWN = 'UNKNOWN'
}
```

### 国籍

```typescript
enum Nationality {
  JP = 'JP',
  US = 'US',
  CN = 'CN',
  KR = 'KR',
  OTHER = 'OTHER'
}
```

### 婚姻状況

```typescript
enum MaritalStatus {
  SINGLE = 'SINGLE',
  MARRIED = 'MARRIED',
  DIVORCED = 'DIVORCED',
  WIDOWED = 'WIDOWED',
  UNKNOWN = 'UNKNOWN'
}
```

### 住所種別

```typescript
enum AddressType {
  HOME = 'HOME',
  WORK = 'WORK',
  MAILING = 'MAILING',
  REGISTERED = 'REGISTERED',
  OTHER = 'OTHER'
}
```

### 連絡先種別

```typescript
enum ContactType {
  PHONE = 'PHONE',
  MOBILE = 'MOBILE',
  EMAIL = 'EMAIL',
  FAX = 'FAX',
  WEBSITE = 'WEBSITE',
  OTHER = 'OTHER'
}
```

### 関係種別

```typescript
enum RelationType {
  SPOUSE = 'SPOUSE',
  CHILD = 'CHILD',
  PARENT = 'PARENT',
  SIBLING = 'SIBLING',
  BUSINESS_PARTNER = 'BUSINESS_PARTNER',
  EMPLOYEE = 'EMPLOYEE',
  EMPLOYER = 'EMPLOYER',
  OTHER = 'OTHER'
}
```

### 当事者役割

```typescript
enum PartyRole {
  PLAINTIFF = 'PLAINTIFF',
  DEFENDANT = 'DEFENDANT',
  THIRD_PARTY = 'THIRD_PARTY',
  WITNESS = 'WITNESS',
  EXPERT = 'EXPERT',
  OTHER = 'OTHER'
}
```

## パフォーマンス考慮事項

### 1. ホットパーティション対策

- 当事者IDにランダムな接尾辞を追加
- 作成日時をミリ秒単位で管理

### 2. クエリ最適化

- 必要な属性のみを取得
- バッチ処理で複数当事者を取得
- ページネーションの実装

### 3. インデックス最適化

- 頻繁にアクセスされる属性でGSIを作成
- 不要なGSIは削除

## セキュリティ考慮事項

### 1. データ暗号化

- 機密情報（個人情報）は暗号化
- KMSキーを使用した暗号化

### 2. アクセス制御

- IAMポリシーでアクセス制御
- ロールベースの権限管理

### 3. 監査ログ

- すべての操作をログ記録
- 個人情報アクセスの監査

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
