# LegalFlow3 開発者ガイド

## 概要

このガイドでは、LegalFlow3システムの開発環境構築、アーキテクチャ、コーディング規約、テスト方法について説明します。

## 目次

1. [開発環境構築](#開発環境構築)
2. [アーキテクチャ概要](#アーキテクチャ概要)
3. [プロジェクト構造](#プロジェクト構造)
4. [コーディング規約](#コーディング規約)
5. [データベース設計](#データベース設計)
6. [API開発](#api開発)
7. [フロントエンド開発](#フロントエンド開発)
8. [テスト](#テスト)
9. [デプロイメント](#デプロイメント)
10. [トラブルシューティング](#トラブルシューティング)

## 開発環境構築

### 必要な環境

- Node.js 18.x以上
- npm 8.x以上
- AWS CLI 2.x以上
- AWS Amplify CLI
- Git

### セットアップ手順

#### 1. リポジトリのクローン

```bash
git clone https://github.com/legalflow3/legalflow3.git
cd legalflow3
```

#### 2. 依存関係のインストール

```bash
# ルートディレクトリ
npm install

# フロントエンド
cd frontend
npm install

# バックエンドAPI
cd ../backend/api_service
npm install

# ドキュメント生成サービス
cd ../docgen_service
pipenv install
```

#### 3. 環境変数の設定

```bash
# ルートディレクトリに.envファイルを作成
cp .env.example .env

# 必要な環境変数を設定
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

#### 4. AWS Amplifyの初期化

```bash
amplify init
amplify configure
```

#### 5. データベースのセットアップ

```bash
# ローカル開発用
cd backend/api_service
npx prisma migrate dev
npx prisma generate
```

### 開発サーバーの起動

#### フロントエンド

```bash
cd frontend
npm run dev
```

#### バックエンドAPI

```bash
cd backend/api_service
npm run dev
```

#### ドキュメント生成サービス

```bash
cd backend/docgen_service
pipenv run python main.py
```

## アーキテクチャ概要

### システム構成

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   AWS AppSync   │    │   DynamoDB      │
│   (Next.js)     │◄──►│   (GraphQL)     │◄──►│   (NoSQL)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AWS Cognito   │    │   AWS Lambda    │    │   AWS S3        │
│   (認証)        │    │   (ビジネス     │    │   (ファイル     │
│                 │    │   ロジック)     │    │   ストレージ)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 技術スタック

#### フロントエンド
- **フレームワーク**: Next.js 14
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **状態管理**: Zustand
- **データフェッチング**: React Query
- **フォーム**: React Hook Form + Zod
- **アイコン**: Lucide React

#### バックエンド
- **API**: AWS AppSync (GraphQL)
- **認証**: AWS Cognito
- **データベース**: DynamoDB
- **サーバーレス**: AWS Lambda
- **ファイルストレージ**: AWS S3
- **通知**: AWS SNS

#### 開発・運用
- **パッケージマネージャー**: npm
- **テスト**: Jest, Vitest, Playwright
- **リンター**: ESLint
- **フォーマッター**: Prettier
- **CI/CD**: GitHub Actions

## プロジェクト構造

```
legalflow3/
├── amplify/                    # AWS Amplify設定
│   ├── backend/               # バックエンド設定
│   │   ├── function/          # Lambda関数
│   │   └── data/              # DynamoDB設定
│   └── auth/                  # 認証設定
├── backend/                   # バックエンドサービス
│   ├── api_service/           # APIサービス
│   │   ├── src/
│   │   │   ├── models/        # データモデル
│   │   │   ├── routes/        # APIルート
│   │   │   ├── services/      # ビジネスロジック
│   │   │   └── utils/         # ユーティリティ
│   │   └── prisma/            # データベーススキーマ
│   └── docgen_service/        # ドキュメント生成
├── frontend/                  # フロントエンド
│   ├── src/
│   │   ├── app/               # Next.js App Router
│   │   ├── components/        # Reactコンポーネント
│   │   ├── hooks/             # カスタムフック
│   │   ├── lib/               # ユーティリティ
│   │   ├── store/             # 状態管理
│   │   └── types/             # TypeScript型定義
│   └── public/                # 静的ファイル
├── docs/                      # ドキュメント
├── scripts/                   # スクリプト
└── tests/                     # テスト
```

## コーディング規約

### TypeScript

#### 型定義

```typescript
// インターフェースはPascalCase
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

// 型エイリアスはPascalCase
type UserRole = 'admin' | 'lawyer' | 'paralegal';

// 列挙型はPascalCase
enum CaseStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  SUSPENDED = 'SUSPENDED'
}
```

#### 関数

```typescript
// 関数はcamelCase
const createUser = async (userData: CreateUserInput): Promise<User> => {
  // 実装
};

// 非同期関数はasync/awaitを使用
const fetchUser = async (id: string): Promise<User | null> => {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return null;
  }
};
```

#### コンポーネント

```typescript
// ReactコンポーネントはPascalCase
interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onEdit }) => {
  return (
    <div className="user-card">
      <h3>{user.firstName} {user.lastName}</h3>
      <button onClick={() => onEdit(user)}>編集</button>
    </div>
  );
};
```

### CSS (Tailwind)

```typescript
// クラス名は意味のある順序で記述
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-semibold text-gray-800">タイトル</h2>
  <button className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700">
    ボタン
  </button>
</div>

// 長いクラス名は改行して整理
<div className="
  flex
  items-center
  justify-between
  p-4
  bg-white
  rounded-lg
  shadow-md
  hover:shadow-lg
  transition-shadow
">
```

### ファイル命名

```
components/
├── cases/
│   ├── CaseList.tsx           # コンポーネント
│   ├── CaseList.test.tsx      # テスト
│   └── index.ts               # エクスポート
├── ui/
│   ├── Button.tsx
│   ├── Modal.tsx
│   └── index.ts
└── layout/
    ├── Header.tsx
    └── Sidebar.tsx
```

## データベース設計

### DynamoDBテーブル設計

#### テーブル一覧

1. **Cases** - ケース情報
2. **Users** - ユーザー情報
3. **Parties** - 当事者情報
4. **Tasks** - タスク情報
5. **TimesheetEntries** - タイムシート情報
6. **Memos** - メモ情報

#### パーティションキー設計

```typescript
// Casesテーブル
interface CaseItem {
  PK: string;  // CASE#${caseId}
  SK: string;  // METADATA
  // その他の属性
}

// グローバルセカンドインデックス
interface CaseByStatus {
  GSI1PK: string;  // STATUS#${status}
  GSI1SK: string;  // CREATED#${createdAt}
  // その他の属性
}
```

### データアクセスパターン

```typescript
// ケース取得
const getCase = async (caseId: string): Promise<Case> => {
  const params = {
    TableName: 'Cases',
    Key: {
      PK: `CASE#${caseId}`,
      SK: 'METADATA'
    }
  };

  const result = await dynamodb.get(params).promise();
  return result.Item as Case;
};

// ステータス別ケース一覧
const getCasesByStatus = async (status: string): Promise<Case[]> => {
  const params = {
    TableName: 'Cases',
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :status',
    ExpressionAttributeValues: {
      ':status': `STATUS#${status}`
    }
  };

  const result = await dynamodb.query(params).promise();
  return result.Items as Case[];
};
```

## API開発

### GraphQLスキーマ

```graphql
type Case {
  id: ID!
  name: String!
  status: CaseStatus!
  priority: Priority!
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  assignments: [CaseAssignment!]!
}

input CreateCaseInput {
  name: String!
  status: CaseStatus
  priority: Priority
  categoryId: ID!
}

type Mutation {
  createCase(input: CreateCaseInput!): CreateCaseResponse!
  updateCase(input: UpdateCaseInput!): UpdateCaseResponse!
  deleteCase(id: ID!): DeleteCaseResponse!
}

type Query {
  getCase(id: ID!): GetCaseResponse!
  listCases(limit: Int, nextToken: String): ListCasesResponse!
  searchCases(filter: CaseSearchFilter!): SearchCasesResponse!
}
```

### Lambda関数実装

```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  try {
    const { id } = event.arguments;

    // ケース取得
    const result = await docClient.send(new GetCommand({
      TableName: process.env.CASES_TABLE,
      Key: {
        PK: `CASE#${id}`,
        SK: 'METADATA'
      }
    }));

    if (!result.Item) {
      return {
        success: false,
        error: {
          message: 'Case not found',
          code: 'NOT_FOUND'
        }
      };
    }

    return {
      success: true,
      case: result.Item
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }
    };
  }
};
```

### エラーハンドリング

```typescript
export class APIError extends Error {
  constructor(
    public message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export const handleError = (error: any) => {
  if (error instanceof APIError) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code
      }
    };
  }

  console.error('Unexpected error:', error);
  return {
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    }
  };
};
```

## フロントエンド開発

### コンポーネント設計

```typescript
// コンポーネントの基本構造
interface ComponentProps {
  // プロパティの型定義
}

const Component: React.FC<ComponentProps> = ({
  // プロパティの分割代入
}) => {
  // フックの使用
  const [state, setState] = useState<StateType>(initialState);

  // イベントハンドラー
  const handleEvent = useCallback((param: ParamType) => {
    // イベント処理
  }, [dependencies]);

  // 副作用
  useEffect(() => {
    // 副作用処理
  }, [dependencies]);

  // レンダリング
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

export default Component;
```

### カスタムフック

```typescript
// use-cases.ts
export const useCases = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await client.graphql({
        query: listCases
      });

      if (result.data.listCases.success) {
        setCases(result.data.listCases.cases);
      } else {
        setError(result.data.listCases.error.message);
      }
    } catch (err) {
      setError('Failed to fetch cases');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    cases,
    loading,
    error,
    fetchCases
  };
};
```

### 状態管理

```typescript
// store/auth.ts
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: false,

  login: async (email: string, password: string) => {
    set({ loading: true });

    try {
      const result = await Auth.signIn(email, password);
      set({
        user: result.user,
        isAuthenticated: true,
        loading: false
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout: () => {
    Auth.signOut();
    set({
      user: null,
      isAuthenticated: false
    });
  },

  setUser: (user: User | null) => {
    set({ user, isAuthenticated: !!user });
  }
}));
```

## テスト

### ユニットテスト

```typescript
// components/__tests__/CaseList.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { CaseList } from '../CaseList';

describe('CaseList', () => {
  const mockCases = [
    {
      id: '1',
      name: 'Test Case 1',
      status: 'ACTIVE',
      priority: 'HIGH'
    },
    {
      id: '2',
      name: 'Test Case 2',
      status: 'CLOSED',
      priority: 'MEDIUM'
    }
  ];

  it('renders case list correctly', () => {
    render(<CaseList cases={mockCases} />);

    expect(screen.getByText('Test Case 1')).toBeInTheDocument();
    expect(screen.getByText('Test Case 2')).toBeInTheDocument();
  });

  it('handles case selection', () => {
    const onSelectCase = jest.fn();
    render(<CaseList cases={mockCases} onSelectCase={onSelectCase} />);

    fireEvent.click(screen.getByText('Test Case 1'));
    expect(onSelectCase).toHaveBeenCalledWith(mockCases[0]);
  });
});
```

### 統合テスト

```typescript
// tests/integration/case-workflow.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { CaseManagement } from '../CaseManagement';

describe('Case Workflow Integration', () => {
  it('creates and displays a new case', async () => {
    render(<CaseManagement />);

    // ケース作成フォームを開く
    fireEvent.click(screen.getByText('新規ケース'));

    // フォームに入力
    fireEvent.change(screen.getByLabelText('ケース名'), {
      target: { value: 'New Test Case' }
    });

    // ケースを作成
    fireEvent.click(screen.getByText('作成'));

    // ケースが一覧に表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('New Test Case')).toBeInTheDocument();
    });
  });
});
```

### E2Eテスト

```typescript
// e2e/case-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Case Management', () => {
  test('should create a new case', async ({ page }) => {
    await page.goto('/cases');

    // 新規ケースボタンをクリック
    await page.click('text=新規ケース');

    // フォームに入力
    await page.fill('[data-testid="case-name"]', 'E2E Test Case');
    await page.selectOption('[data-testid="case-category"]', 'contract-dispute');

    // 作成ボタンをクリック
    await page.click('text=作成');

    // 成功メッセージを確認
    await expect(page.locator('text=ケースが作成されました')).toBeVisible();

    // ケース一覧に表示されることを確認
    await expect(page.locator('text=E2E Test Case')).toBeVisible();
  });
});
```

## デプロイメント

### 開発環境

```bash
# フロントエンド
cd frontend
npm run build
npm run start

# バックエンド
cd backend/api_service
npm run build
npm run start
```

### 本番環境

```bash
# AWS Amplifyでデプロイ
amplify push

# または、GitHub Actionsで自動デプロイ
git push origin main
```

### 環境変数

```bash
# .env.production
NEXT_PUBLIC_API_URL=https://api.legalflow3.com
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_USER_POOL_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
```

## トラブルシューティング

### よくある問題

#### 1. 認証エラー

```typescript
// 問題: Cognito認証が失敗する
// 解決策: 設定を確認
const authConfig = {
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID,
  userPoolWebClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID
};
```

#### 2. GraphQLエラー

```typescript
// 問題: GraphQLクエリが失敗する
// 解決策: エラーハンドリングを追加
try {
  const result = await client.graphql({ query: getCase, variables: { id } });
  return result.data.getCase;
} catch (error) {
  console.error('GraphQL Error:', error);
  throw new Error('Failed to fetch case');
}
```

#### 3. DynamoDBエラー

```typescript
// 問題: DynamoDBクエリが失敗する
// 解決策: パラメータを確認
const params = {
  TableName: process.env.CASES_TABLE,
  Key: {
    PK: `CASE#${caseId}`,
    SK: 'METADATA'
  }
};
```

### デバッグツール

#### フロントエンド

```typescript
// React Developer Tools
// Redux DevTools
// NetworkタブでAPIリクエストを確認
```

#### バックエンド

```typescript
// CloudWatch Logs
// X-Rayトレーシング
// DynamoDBコンソール
```

### ログ設定

```typescript
// 開発環境
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}

// 本番環境
import { Logger } from '@aws-lambda-powertools/logger';
const logger = new Logger();

logger.info('Application started', { environment: 'production' });
```

## パフォーマンス最適化

### フロントエンド

```typescript
// メモ化
const MemoizedComponent = React.memo(Component);

// 遅延読み込み
const LazyComponent = React.lazy(() => import('./LazyComponent'));

// 仮想化
import { FixedSizeList as List } from 'react-window';
```

### バックエンド

```typescript
// 接続プール
const client = new DynamoDBClient({
  maxAttempts: 3,
  retryMode: 'adaptive'
});

// バッチ処理
const batchWrite = async (items: any[]) => {
  const chunks = chunk(items, 25);
  await Promise.all(chunks.map(chunk =>
    docClient.send(new BatchWriteCommand({
      RequestItems: {
        [TABLE_NAME]: chunk.map(item => ({ PutRequest: { Item: item } }))
      }
    }))
  ));
};
```

## セキュリティ

### 認証・認可

```typescript
// JWTトークンの検証
const verifyToken = async (token: string) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// 権限チェック
const checkPermission = (user: User, resource: string, action: string) => {
  return user.permissions.some(p =>
    p.resource === resource && p.actions.includes(action)
  );
};
```

### データ検証

```typescript
// Zodスキーマ
const CreateCaseSchema = z.object({
  name: z.string().min(1).max(100),
  categoryId: z.string().uuid(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
});

// バリデーション
const validateInput = (input: any) => {
  return CreateCaseSchema.parse(input);
};
```

## まとめ

この開発者ガイドに従うことで、LegalFlow3システムの開発を効率的に進めることができます。質問や改善提案がございましたら、開発チームまでお問い合わせください。

### 参考資料

- [Next.js Documentation](https://nextjs.org/docs)
- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
