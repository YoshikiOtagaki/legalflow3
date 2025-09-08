# LegalFlow3 API仕様書

## 概要

LegalFlow3は、法律事務所向けのケース管理システムです。本API仕様書では、GraphQL APIの詳細な仕様を記載しています。

## 基本情報

- **API名**: LegalFlow3 GraphQL API
- **バージョン**: 1.0.0
- **ベースURL**: `https://api.legalflow3.com/graphql`
- **認証方式**: Amazon Cognito User Pools
- **データ形式**: JSON

## 認証

### 認証方式

- **プライマリ**: Amazon Cognito User Pools
- **セカンダリ**: API Key (読み取り専用)

### 認証ヘッダー

```http
Authorization: Bearer <JWT_TOKEN>
```

または

```http
x-api-key: <API_KEY>
```

## GraphQLスキーマ

### 型定義

#### User
```graphql
type User {
  id: ID!
  email: String!
  firstName: String!
  lastName: String!
  role: Role!
  isActive: Boolean!
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  subscription: Subscription
}
```

#### Case
```graphql
type Case {
  id: ID!
  name: String!
  caseNumber: String
  status: CaseStatus!
  trialLevel: String
  hourlyRate: Float
  categoryId: ID!
  currentPhaseId: ID
  courtDivisionId: ID
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  firstConsultationDate: AWSDate
  engagementDate: AWSDate
  caseClosedDate: AWSDate
  litigationStartDate: AWSDate
  oralArgumentEndDate: AWSDate
  judgmentDate: AWSDate
  judgmentReceivedDate: AWSDate
  hasEngagementLetter: Boolean!
  engagementLetterPath: String
  remarks: String
  customProperties: AWSJSON
  tags: [String!]!
  priority: Priority!
  assignments: [CaseAssignment!]!
  parties: [CaseParty!]!
  tasks: [Task!]!
  timesheetEntries: [TimesheetEntry!]!
  memos: [Memo!]!
}
```

#### CaseAssignment
```graphql
type CaseAssignment {
  id: ID!
  caseId: ID!
  userId: ID!
  role: CaseRole!
  permissions: CasePermissions!
  assignedAt: AWSDateTime!
  lastAccessedAt: AWSDateTime!
  isActive: Boolean!
  case: Case
}
```

#### Party
```graphql
type Party {
  id: ID!
  isCorporation: Boolean!
  isFormerClient: Boolean!
  individualProfile: IndividualProfile
  corporateProfile: CorporateProfile
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  cases: [CaseParty!]!
}
```

#### Task
```graphql
type Task {
  id: ID!
  caseId: ID!
  description: String!
  dueDate: AWSDate
  isCompleted: Boolean!
  priority: Priority!
  category: String
  assignedToId: ID
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  case: Case
}
```

#### TimesheetEntry
```graphql
type TimesheetEntry {
  id: ID!
  caseId: ID!
  userId: ID!
  startTime: AWSDateTime!
  endTime: AWSDateTime
  duration: Int!
  description: String!
  category: String
  billable: Boolean!
  hourlyRate: Float
  createdAt: AWSDateTime!
  case: Case
}
```

#### Memo
```graphql
type Memo {
  id: ID!
  caseId: ID!
  content: String!
  authorId: ID!
  createdAt: AWSDateTime!
  case: Case
}
```

### 列挙型

#### Role
```graphql
enum Role {
  ADMIN
  LAWYER
  PARALEGAL
  CLIENT
}
```

#### CaseStatus
```graphql
enum CaseStatus {
  ACTIVE
  CLOSED
  SUSPENDED
}
```

#### Priority
```graphql
enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

#### CaseRole
```graphql
enum CaseRole {
  LEAD
  COLLABORATOR
}
```

#### PartyRole
```graphql
enum PartyRole {
  PLAINTIFF
  DEFENDANT
  THIRD_PARTY
  WITNESS
  EXPERT
}
```

## クエリ

### getCase
特定のケースを取得します。

```graphql
query GetCase($id: ID!) {
  getCase(id: $id) {
    success
    case {
      id
      name
      caseNumber
      status
      priority
      createdAt
      updatedAt
      assignments {
        id
        userId
        role
        permissions
      }
      parties {
        id
        partyId
        role
      }
      tasks {
        id
        description
        dueDate
        isCompleted
        priority
      }
      timesheetEntries {
        id
        startTime
        endTime
        duration
        description
        billable
      }
      memos {
        id
        content
        authorId
        createdAt
      }
    }
    error {
      message
      code
    }
  }
}
```

**パラメータ**:
- `id` (必須): ケースID

**レスポンス**:
- `success`: 成功フラグ
- `case`: ケース情報
- `error`: エラー情報

### listCases
ケース一覧を取得します。

```graphql
query ListCases(
  $limit: Int
  $nextToken: String
  $status: String
  $categoryId: ID
) {
  listCases(
    limit: $limit
    nextToken: $nextToken
    status: $status
    categoryId: $categoryId
  ) {
    success
    cases {
      id
      name
      caseNumber
      status
      priority
      createdAt
      updatedAt
    }
    nextToken
    totalCount
    error {
      message
      code
    }
  }
}
```

**パラメータ**:
- `limit` (オプション): 取得件数（デフォルト: 20）
- `nextToken` (オプション): ページネーショントークン
- `status` (オプション): ステータスフィルタ
- `categoryId` (オプション): カテゴリIDフィルタ

**レスポンス**:
- `success`: 成功フラグ
- `cases`: ケース一覧
- `nextToken`: 次のページのトークン
- `totalCount`: 総件数
- `error`: エラー情報

### searchCases
ケースを検索します。

```graphql
query SearchCases(
  $filter: CaseSearchFilter!
  $limit: Int
  $nextToken: String
) {
  searchCases(
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    success
    cases {
      id
      name
      caseNumber
      status
      priority
      createdAt
      updatedAt
    }
    nextToken
    totalCount
    error {
      message
      code
    }
  }
}
```

**パラメータ**:
- `filter` (必須): 検索フィルタ
- `limit` (オプション): 取得件数
- `nextToken` (オプション): ページネーショントークン

**検索フィルタ**:
```graphql
input CaseSearchFilter {
  name: String
  caseNumber: String
  status: String
  categoryId: ID
  priority: String
  tags: [String!]
  dateRange: DateRange
}

input DateRange {
  startDate: AWSDate!
  endDate: AWSDate!
}
```

## ミューテーション

### createCase
新しいケースを作成します。

```graphql
mutation CreateCase($input: CreateCaseInput!) {
  createCase(input: $input) {
    success
    case {
      id
      name
      caseNumber
      status
      priority
      createdAt
      updatedAt
    }
    assignment {
      id
      userId
      role
      permissions
    }
    error {
      message
      code
    }
  }
}
```

**パラメータ**:
```graphql
input CreateCaseInput {
  name: String!
  caseNumber: String
  status: CaseStatus
  trialLevel: String
  hourlyRate: Float
  categoryId: ID!
  currentPhaseId: ID
  courtDivisionId: ID
  firstConsultationDate: AWSDate
  engagementDate: AWSDate
  caseClosedDate: AWSDate
  litigationStartDate: AWSDate
  oralArgumentEndDate: AWSDate
  judgmentDate: AWSDate
  judgmentReceivedDate: AWSDate
  hasEngagementLetter: Boolean
  engagementLetterPath: String
  remarks: String
  customProperties: AWSJSON
  tags: [String!]
  priority: Priority
}
```

**必須フィールド**:
- `name`: ケース名
- `categoryId`: カテゴリID

### updateCase
既存のケースを更新します。

```graphql
mutation UpdateCase($input: UpdateCaseInput!) {
  updateCase(input: $input) {
    success
    case {
      id
      name
      caseNumber
      status
      priority
      updatedAt
    }
    error {
      message
      code
    }
  }
}
```

**パラメータ**:
```graphql
input UpdateCaseInput {
  id: ID!
  name: String
  caseNumber: String
  status: CaseStatus
  trialLevel: String
  hourlyRate: Float
  categoryId: ID
  currentPhaseId: ID
  courtDivisionId: ID
  firstConsultationDate: AWSDate
  engagementDate: AWSDate
  caseClosedDate: AWSDate
  litigationStartDate: AWSDate
  oralArgumentEndDate: AWSDate
  judgmentDate: AWSDate
  judgmentReceivedDate: AWSDate
  hasEngagementLetter: Boolean
  engagementLetterPath: String
  remarks: String
  customProperties: AWSJSON
  tags: [String!]
  priority: Priority
}
```

**必須フィールド**:
- `id`: ケースID

### deleteCase
ケースを削除します。

```graphql
mutation DeleteCase($id: ID!) {
  deleteCase(id: $id) {
    success
    case {
      id
      name
      caseNumber
      status
    }
    message
    error {
      message
      code
    }
  }
}
```

**パラメータ**:
- `id` (必須): ケースID

## サブスクリプション

### onCaseCreated
新しいケースが作成されたときに通知されます。

```graphql
subscription OnCaseCreated {
  onCaseCreated {
    id
    name
    caseNumber
    status
    priority
    createdAt
  }
}
```

### onCaseUpdated
ケースが更新されたときに通知されます。

```graphql
subscription OnCaseUpdated {
  onCaseUpdated {
    id
    name
    caseNumber
    status
    priority
    updatedAt
  }
}
```

### onCaseDeleted
ケースが削除されたときに通知されます。

```graphql
subscription OnCaseDeleted {
  onCaseDeleted {
    id
    name
    caseNumber
    status
  }
}
```

## エラーハンドリング

### エラーコード

| コード | 説明 |
|--------|------|
| `UNAUTHORIZED` | 認証が必要 |
| `FORBIDDEN` | アクセス権限なし |
| `NOT_FOUND` | リソースが見つからない |
| `VALIDATION_ERROR` | 入力値が無効 |
| `INTERNAL_ERROR` | 内部サーバーエラー |
| `RATE_LIMIT_EXCEEDED` | レート制限超過 |

### エラーレスポンス例

```json
{
  "data": {
    "createCase": {
      "success": false,
      "case": null,
      "error": {
        "message": "Case name is required",
        "code": "VALIDATION_ERROR"
      }
    }
  }
}
```

## レート制限

- **認証済みユーザー**: 1000リクエスト/時間
- **API Key**: 100リクエスト/時間
- **バースト制限**: 100リクエスト/分

## ページネーション

### 基本的なページネーション

```graphql
query ListCases($limit: Int, $nextToken: String) {
  listCases(limit: $limit, nextToken: $nextToken) {
    cases {
      id
      name
    }
    nextToken
    totalCount
  }
}
```

### ページネーションの実装例

```javascript
let nextToken = null;
let allCases = [];

do {
  const result = await client.query({
    query: LIST_CASES,
    variables: {
      limit: 20,
      nextToken: nextToken
    }
  });

  allCases = allCases.concat(result.data.listCases.cases);
  nextToken = result.data.listCases.nextToken;
} while (nextToken);
```

## 認可ルール

### ケース管理

- **作成**: 認証済みユーザー
- **読み取り**: ケースに割り当てられたユーザー
- **更新**: ケースに割り当てられたユーザー（編集権限）
- **削除**: ケースに割り当てられたユーザー（削除権限）

### 権限レベル

- **Lead**: 全権限
- **Collaborator**: 読み取り、編集（設定による）
- **Viewer**: 読み取りのみ

## データ型

### 日時型

- `AWSDateTime`: ISO 8601形式の日時
- `AWSDate`: ISO 8601形式の日付

### カスタム型

- `CasePermissions`: ケース権限
- `IndividualProfile`: 個人プロフィール
- `CorporateProfile`: 法人プロフィール
- `Address`: 住所情報

## 使用例

### ケース作成の例

```javascript
const CREATE_CASE = gql`
  mutation CreateCase($input: CreateCaseInput!) {
    createCase(input: $input) {
      success
      case {
        id
        name
        status
        createdAt
      }
      error {
        message
        code
      }
    }
  }
`;

const result = await client.mutate({
  mutation: CREATE_CASE,
  variables: {
    input: {
      name: "新しいケース",
      categoryId: "category-123",
      priority: "HIGH",
      tags: ["urgent", "litigation"]
    }
  }
});
```

### ケース検索の例

```javascript
const SEARCH_CASES = gql`
  query SearchCases($filter: CaseSearchFilter!) {
    searchCases(filter: $filter) {
      success
      cases {
        id
        name
        status
        priority
      }
      totalCount
    }
  }
`;

const result = await client.query({
  query: SEARCH_CASES,
  variables: {
    filter: {
      name: "契約",
      status: "ACTIVE",
      priority: "HIGH",
      dateRange: {
        startDate: "2024-01-01",
        endDate: "2024-12-31"
      }
    }
  }
});
```

## 更新履歴

| バージョン | 日付 | 変更内容 |
|------------|------|----------|
| 1.0.0 | 2024-01-01 | 初回リリース |

## サポート

- **ドキュメント**: https://docs.legalflow3.com
- **サポート**: support@legalflow3.com
- **GitHub**: https://github.com/legalflow3/api
