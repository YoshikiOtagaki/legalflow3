# LegalFlow3 自動テストスクリプト

## 概要

このドキュメントは、LegalFlow3システムの自動テストを実行するためのスクリプトと手順を説明します。

## 前提条件

- Node.js 18以上がインストールされている
- npm または yarn がインストールされている
- バックエンドAPIサービスが起動している
- フロントエンドアプリケーションが起動している
- テスト用データベースが設定されている

## テストスクリプトの実行

### 1. バックエンドAPIテスト

```bash
# バックエンドディレクトリに移動
cd backend/api_service

# 依存関係をインストール
npm install

# ユニットテストを実行
npm run test

# パフォーマンステストを実行
npm run test:performance

# カバレッジレポートを生成
npm run test:coverage
```

### 2. フロントエンドテスト

```bash
# フロントエンドディレクトリに移動
cd frontend

# 依存関係をインストール
npm install

# ユニットテストを実行
npm run test

# E2Eテストを実行
npm run test:e2e

# カバレッジレポートを生成
npm run test:coverage
```

### 3. 統合テスト

```bash
# プロジェクトルートディレクトリに移動
cd ../../

# 統合テストを実行
npm run test:integration

# 全体的なテストを実行
npm run test:all
```

## テスト結果の確認

### 1. テストレポート

テスト実行後、以下のディレクトリにレポートが生成されます：

- `backend/api_service/coverage/` - バックエンドのカバレッジレポート
- `frontend/coverage/` - フロントエンドのカバレッジレポート
- `test-results/` - 統合テストの結果

### 2. カバレッジレポートの確認

```bash
# バックエンドのカバレッジレポートを開く
open backend/api_service/coverage/lcov-report/index.html

# フロントエンドのカバレッジレポートを開く
open frontend/coverage/lcov-report/index.html
```

### 3. パフォーマンステスト結果

パフォーマンステストの結果は以下のファイルに保存されます：

- `backend/api_service/test-results/performance-report.json`
- `backend/api_service/test-results/performance-report.html`

## 継続的インテグレーション（CI）

### GitHub Actions設定

```yaml
name: LegalFlow3 Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd backend/api_service
          npm ci
      - name: Run tests
        run: |
          cd backend/api_service
          npm run test
      - name: Run performance tests
        run: |
          cd backend/api_service
          npm run test:performance

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      - name: Run tests
        run: |
          cd frontend
          npm run test
      - name: Run E2E tests
        run: |
          cd frontend
          npm run test:e2e

  integration-tests:
    runs-on: ubuntu-latest
    needs: [backend-tests, frontend-tests]
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          npm ci
      - name: Run integration tests
        run: |
          npm run test:integration
```

## テストデータの管理

### 1. テストデータベースの設定

```bash
# テスト用データベースを作成
createdb legalflow3_test

# テスト用の環境変数を設定
export DATABASE_URL="postgresql://username:password@localhost:5432/legalflow3_test"
export NODE_ENV="test"
```

### 2. テストデータの投入

```bash
# テストデータを投入
npm run seed:test

# テストデータをリセット
npm run reset:test
```

## テストのカスタマイズ

### 1. テスト設定ファイル

#### Jest設定（backend/api_service/jest.config.js）

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
```

#### Jest設定（frontend/jest.config.js）

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/**/*.{js,jsx,ts,tsx}',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
}

module.exports = createJestConfig(customJestConfig)
```

### 2. テストヘルパー関数

#### バックエンドテストヘルパー（backend/api_service/tests/helpers/test-helpers.ts）

```typescript
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/index';
import request from 'supertest';

export const prisma = new PrismaClient();
export const app = createApp();

export const createTestUser = async (userData: any) => {
  return await prisma.user.create({
    data: userData,
  });
};

export const createTestCase = async (caseData: any) => {
  return await prisma.case.create({
    data: caseData,
  });
};

export const cleanupTestData = async () => {
  await prisma.timesheet.deleteMany();
  await prisma.document.deleteMany();
  await prisma.caseAssignment.deleteMany();
  await prisma.case.deleteMany();
  await prisma.party.deleteMany();
  await prisma.user.deleteMany();
};
```

#### フロントエンドテストヘルパー（frontend/src/__tests__/helpers/test-helpers.tsx）

```typescript
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactElement } from 'react';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

## テストの実行時間の最適化

### 1. 並列実行

```bash
# 並列でテストを実行
npm run test -- --maxWorkers=4

# 特定のテストファイルのみ実行
npm run test -- --testPathPattern="auth"
```

### 2. テストの分割

```bash
# ユニットテストのみ実行
npm run test:unit

# 統合テストのみ実行
npm run test:integration

# E2Eテストのみ実行
npm run test:e2e
```

## テスト結果の分析

### 1. カバレッジ分析

```bash
# カバレッジレポートを生成
npm run test:coverage

# カバレッジのしきい値を設定
npm run test:coverage -- --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80,"statements":80}}'
```

### 2. パフォーマンス分析

```bash
# パフォーマンステストを実行
npm run test:performance

# メモリ使用量を監視
npm run test:performance -- --detectMemoryLeaks
```

## トラブルシューティング

### 1. よくある問題

#### テストが失敗する場合

```bash
# テストデータベースをリセット
npm run reset:test

# 依存関係を再インストール
rm -rf node_modules package-lock.json
npm install
```

#### メモリ不足エラー

```bash
# Node.jsのメモリ制限を増やす
export NODE_OPTIONS="--max-old-space-size=4096"
npm run test
```

#### タイムアウトエラー

```bash
# タイムアウト時間を増やす
npm run test -- --testTimeout=10000
```

### 2. デバッグ

```bash
# 詳細なログを出力
npm run test -- --verbose

# 特定のテストをデバッグ
npm run test -- --testNamePattern="should create a case" --verbose
```

## テストの継続的改善

### 1. テストメトリクスの監視

- テストカバレッジの推移
- テスト実行時間の推移
- 失敗率の監視
- フレイキーテストの特定

### 2. テストの品質向上

- テストケースの網羅性の向上
- テストの可読性の向上
- テストの保守性の向上
- テストの実行速度の最適化

---

この自動テストスクリプトを使用して、LegalFlow3システムの品質を継続的に保証してください。
