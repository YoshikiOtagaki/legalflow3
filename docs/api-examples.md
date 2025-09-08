# LegalFlow3 API使用例

## 概要

このドキュメントでは、LegalFlow3 APIの具体的な使用例を提供します。

## 認証設定

### AWS Amplify設定

```javascript
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';

Amplify.configure({
  API: {
    GraphQL: {
      endpoint: 'https://api.legalflow3.com/graphql',
      region: 'us-east-1',
      defaultAuthMode: 'userPool'
    }
  },
  Auth: {
    Cognito: {
      userPoolId: 'us-east-1_XXXXXXXXX',
      userPoolClientId: 'XXXXXXXXXXXXXXXXXXXXXXXXXX',
      loginWith: {
        oauth: {
          domain: 'legalflow3.auth.us-east-1.amazoncognito.com',
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: ['http://localhost:3000/'],
          redirectSignOut: ['http://localhost:3000/'],
          responseType: 'code'
        }
      }
    }
  }
});

const client = generateClient();
```

## ケース管理

### ケース作成

```javascript
import { createCase } from './graphql/mutations';

const createNewCase = async (caseData) => {
  try {
    const result = await client.graphql({
      query: createCase,
      variables: {
        input: {
          name: caseData.name,
          caseNumber: caseData.caseNumber,
          categoryId: caseData.categoryId,
          priority: caseData.priority || 'MEDIUM',
          status: 'ACTIVE',
          hourlyRate: caseData.hourlyRate,
          remarks: caseData.remarks,
          tags: caseData.tags || [],
          customProperties: caseData.customProperties || null
        }
      }
    });

    if (result.data.createCase.success) {
      console.log('ケースが作成されました:', result.data.createCase.case);
      return result.data.createCase.case;
    } else {
      throw new Error(result.data.createCase.error.message);
    }
  } catch (error) {
    console.error('ケース作成エラー:', error);
    throw error;
  }
};

// 使用例
const newCase = await createNewCase({
  name: '契約紛争事件',
  caseNumber: 'CASE-2024-001',
  categoryId: 'contract-dispute',
  priority: 'HIGH',
  hourlyRate: 50000,
  remarks: '契約書の解釈に関する紛争',
  tags: ['contract', 'dispute', 'urgent'],
  customProperties: {
    clientType: 'corporate',
    estimatedDuration: '6 months'
  }
});
```

### ケース一覧取得

```javascript
import { listCases } from './graphql/queries';

const getCases = async (filters = {}) => {
  try {
    const result = await client.graphql({
      query: listCases,
      variables: {
        limit: filters.limit || 20,
        nextToken: filters.nextToken,
        status: filters.status,
        categoryId: filters.categoryId
      }
    });

    if (result.data.listCases.success) {
      return {
        cases: result.data.listCases.cases,
        nextToken: result.data.listCases.nextToken,
        totalCount: result.data.listCases.totalCount
      };
    } else {
      throw new Error(result.data.listCases.error.message);
    }
  } catch (error) {
    console.error('ケース一覧取得エラー:', error);
    throw error;
  }
};

// 使用例
const cases = await getCases({
  limit: 10,
  status: 'ACTIVE',
  categoryId: 'contract-dispute'
});
```

### ケース検索

```javascript
import { searchCases } from './graphql/queries';

const searchCasesByFilter = async (searchFilter) => {
  try {
    const result = await client.graphql({
      query: searchCases,
      variables: {
        filter: searchFilter,
        limit: 20
      }
    });

    if (result.data.searchCases.success) {
      return {
        cases: result.data.searchCases.cases,
        nextToken: result.data.searchCases.nextToken,
        totalCount: result.data.searchCases.totalCount
      };
    } else {
      throw new Error(result.data.searchCases.error.message);
    }
  } catch (error) {
    console.error('ケース検索エラー:', error);
    throw error;
  }
};

// 使用例
const searchResults = await searchCasesByFilter({
  name: '契約',
  status: 'ACTIVE',
  priority: 'HIGH',
  tags: ['urgent'],
  dateRange: {
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  }
});
```

### ケース詳細取得

```javascript
import { getCase } from './graphql/queries';

const getCaseDetails = async (caseId) => {
  try {
    const result = await client.graphql({
      query: getCase,
      variables: {
        id: caseId
      }
    });

    if (result.data.getCase.success) {
      return result.data.getCase.case;
    } else {
      throw new Error(result.data.getCase.error.message);
    }
  } catch (error) {
    console.error('ケース詳細取得エラー:', error);
    throw error;
  }
};

// 使用例
const caseDetails = await getCaseDetails('CASE#123');
```

### ケース更新

```javascript
import { updateCase } from './graphql/mutations';

const updateCaseData = async (caseId, updateData) => {
  try {
    const result = await client.graphql({
      query: updateCase,
      variables: {
        input: {
          id: caseId,
          ...updateData
        }
      }
    });

    if (result.data.updateCase.success) {
      console.log('ケースが更新されました:', result.data.updateCase.case);
      return result.data.updateCase.case;
    } else {
      throw new Error(result.data.updateCase.error.message);
    }
  } catch (error) {
    console.error('ケース更新エラー:', error);
    throw error;
  }
};

// 使用例
const updatedCase = await updateCaseData('CASE#123', {
  status: 'CLOSED',
  caseClosedDate: '2024-12-31',
  remarks: '和解により解決'
});
```

### ケース削除

```javascript
import { deleteCase } from './graphql/mutations';

const deleteCaseData = async (caseId) => {
  try {
    const result = await client.graphql({
      query: deleteCase,
      variables: {
        id: caseId
      }
    });

    if (result.data.deleteCase.success) {
      console.log('ケースが削除されました:', result.data.deleteCase.case);
      return result.data.deleteCase.case;
    } else {
      throw new Error(result.data.deleteCase.error.message);
    }
  } catch (error) {
    console.error('ケース削除エラー:', error);
    throw error;
  }
};

// 使用例
const deletedCase = await deleteCaseData('CASE#123');
```

## リアルタイム更新

### サブスクリプション設定

```javascript
import { onCaseCreated, onCaseUpdated, onCaseDeleted } from './graphql/subscriptions';

// ケース作成の監視
const subscribeToCaseCreated = () => {
  const subscription = client.graphql({
    query: onCaseCreated
  }).subscribe({
    next: (data) => {
      console.log('新しいケースが作成されました:', data.data.onCaseCreated);
      // UIを更新
      updateCaseList(data.data.onCaseCreated);
    },
    error: (error) => {
      console.error('サブスクリプションエラー:', error);
    }
  });

  return subscription;
};

// ケース更新の監視
const subscribeToCaseUpdated = () => {
  const subscription = client.graphql({
    query: onCaseUpdated
  }).subscribe({
    next: (data) => {
      console.log('ケースが更新されました:', data.data.onCaseUpdated);
      // UIを更新
      updateCaseInList(data.data.onCaseUpdated);
    },
    error: (error) => {
      console.error('サブスクリプションエラー:', error);
    }
  });

  return subscription;
};

// ケース削除の監視
const subscribeToCaseDeleted = () => {
  const subscription = client.graphql({
    query: onCaseDeleted
  }).subscribe({
    next: (data) => {
      console.log('ケースが削除されました:', data.data.onCaseDeleted);
      // UIを更新
      removeCaseFromList(data.data.onCaseDeleted.id);
    },
    error: (error) => {
      console.error('サブスクリプションエラー:', error);
    }
  });

  return subscription;
};

// サブスクリプションの開始
const subscriptions = [
  subscribeToCaseCreated(),
  subscribeToCaseUpdated(),
  subscribeToCaseDeleted()
];

// サブスクリプションの停止
const stopSubscriptions = () => {
  subscriptions.forEach(subscription => subscription.unsubscribe());
};
```

## エラーハンドリング

### 包括的なエラーハンドリング

```javascript
class APIError extends Error {
  constructor(message, code, details = null) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.details = details;
  }
}

const handleAPIError = (error) => {
  if (error.errors) {
    // GraphQLエラー
    const graphqlError = error.errors[0];
    throw new APIError(
      graphqlError.message,
      graphqlError.extensions?.code || 'GRAPHQL_ERROR',
      graphqlError.extensions
    );
  } else if (error.data) {
    // アプリケーションエラー
    const appError = error.data[Object.keys(error.data)[0]].error;
    throw new APIError(
      appError.message,
      appError.code,
      appError
    );
  } else {
    // ネットワークエラー
    throw new APIError(
      error.message || 'ネットワークエラーが発生しました',
      'NETWORK_ERROR',
      error
    );
  }
};

// 使用例
const safeCreateCase = async (caseData) => {
  try {
    const result = await createNewCase(caseData);
    return result;
  } catch (error) {
    handleAPIError(error);
  }
};
```

### リトライ機能

```javascript
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, i);
      console.log(`${delay}ms後にリトライします...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// 使用例
const createCaseWithRetry = async (caseData) => {
  return await retryWithBackoff(() => createNewCase(caseData));
};
```

## ページネーション

### 無限スクロール実装

```javascript
const useInfiniteCases = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [nextToken, setNextToken] = useState(null);

  const loadMore = async () => {
    if (loading || !hasNextPage) return;

    setLoading(true);
    try {
      const result = await getCases({
        limit: 20,
        nextToken: nextToken
      });

      setCases(prev => [...prev, ...result.cases]);
      setNextToken(result.nextToken);
      setHasNextPage(!!result.nextToken);
    } catch (error) {
      console.error('ページネーションエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setCases([]);
    setNextToken(null);
    setHasNextPage(true);
  };

  return {
    cases,
    loading,
    hasNextPage,
    loadMore,
    reset
  };
};
```

## キャッシュ管理

### Apollo Client設定

```javascript
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: 'https://api.legalflow3.com/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    typePolicies: {
      Case: {
        fields: {
          assignments: {
            merge: false
          },
          parties: {
            merge: false
          },
          tasks: {
            merge: false
          }
        }
      }
    }
  })
});
```

## テスト

### ユニットテスト例

```javascript
import { renderHook, waitFor } from '@testing-library/react';
import { useCases } from './hooks/use-cases';

describe('useCases', () => {
  it('should fetch cases successfully', async () => {
    const { result } = renderHook(() => useCases());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.cases).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it('should handle error gracefully', async () => {
    // モックでエラーを返す
    mockGraphQL.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useCases());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.cases).toHaveLength(0);
  });
});
```

### 統合テスト例

```javascript
import { createCase, getCase } from './api/cases';

describe('Case API Integration', () => {
  it('should create and retrieve a case', async () => {
    const caseData = {
      name: 'Test Case',
      categoryId: 'test-category',
      priority: 'MEDIUM'
    };

    const createdCase = await createCase(caseData);
    expect(createdCase.id).toBeDefined();
    expect(createdCase.name).toBe(caseData.name);

    const retrievedCase = await getCase(createdCase.id);
    expect(retrievedCase.id).toBe(createdCase.id);
    expect(retrievedCase.name).toBe(caseData.name);
  });
});
```

## パフォーマンス最適化

### クエリ最適化

```javascript
// 必要なフィールドのみ取得
const GET_CASE_SUMMARY = gql`
  query GetCaseSummary($id: ID!) {
    getCase(id: $id) {
      success
      case {
        id
        name
        status
        priority
        createdAt
      }
    }
  }
`;

// バッチ処理
const batchCreateCases = async (casesData) => {
  const promises = casesData.map(caseData => createNewCase(caseData));
  return await Promise.all(promises);
};
```

### メモ化

```javascript
import { useMemo } from 'react';

const CaseList = ({ cases, filters }) => {
  const filteredCases = useMemo(() => {
    return cases.filter(case => {
      if (filters.status && case.status !== filters.status) return false;
      if (filters.priority && case.priority !== filters.priority) return false;
      if (filters.search && !case.name.includes(filters.search)) return false;
      return true;
    });
  }, [cases, filters]);

  return (
    <div>
      {filteredCases.map(case => (
        <CaseItem key={case.id} case={case} />
      ))}
    </div>
  );
};
```

## デバッグ

### ログ設定

```javascript
const debugLog = (operation, data) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${operation}]`, data);
  }
};

const createCaseWithLogging = async (caseData) => {
  debugLog('CREATE_CASE_START', caseData);

  try {
    const result = await createNewCase(caseData);
    debugLog('CREATE_CASE_SUCCESS', result);
    return result;
  } catch (error) {
    debugLog('CREATE_CASE_ERROR', error);
    throw error;
  }
};
```

### ネットワーク監視

```javascript
const monitorAPI = () => {
  const originalFetch = window.fetch;

  window.fetch = async (...args) => {
    const start = performance.now();
    const response = await originalFetch(...args);
    const end = performance.now();

    console.log(`API Request: ${args[0]} - ${end - start}ms`);
    return response;
  };
};
```

## まとめ

このドキュメントでは、LegalFlow3 APIの主要な使用例を紹介しました。これらの例を参考に、効率的で堅牢なアプリケーションを構築してください。

詳細な情報については、[API仕様書](./api-specification.md)を参照してください。
