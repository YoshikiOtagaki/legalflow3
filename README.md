# LegalFlow - 弁護士向け案件管理Webサービス

## プロジェクト概要

弁護士向け案件管理Webサービスの開発プロジェクトです。TDD（テスト駆動開発）の原則に従って開発されています。

## プロジェクト構造

```
legalflow3/
├── backend/
│   ├── api_service/          # Node.js/Express.js/Prisma API
│   └── docgen_service/       # Python/FastAPI 文書生成サービス
├── frontend/                 # Next.js/React フロントエンド
├── contracts/                # API仕様書
├── specs/                    # 機能仕様書
└── memory/                   # プロジェクトメモリ
```

## 開発環境セットアップ

### 前提条件

- Node.js 18+
- Python 3.11+
- Git

### セットアップ手順

1. **リポジトリのクローン**
   ```bash
   git clone <repository-url>
   cd legalflow3
   ```

2. **Backend API Service**
   ```bash
   cd backend/api_service
   npm install
   npm run prisma:generate
   ```

3. **Backend Document Generation Service**
   ```bash
   cd backend/docgen_service
   pipenv install --dev
   ```

4. **Frontend**
   ```bash
   cd frontend
   npm install
   ```

## Pre-commitフック

各サービスでpre-commitフックが設定されており、コミット前に自動的にコードの品質チェックが実行されます。

### Backend API Service (Node.js)

- **ESLint**: TypeScript/JavaScriptのリンティング
- **Prettier**: コードフォーマット
- **Husky**: Gitフック管理
- **lint-staged**: ステージされたファイルのみをチェック

```bash
cd backend/api_service
npm run pre-commit  # 手動実行
```

### Backend Document Generation Service (Python)

- **Black**: コードフォーマット
- **Flake8**: リンティング
- **MyPy**: 型チェック
- **pre-commit**: Gitフック管理

```bash
cd backend/docgen_service
pipenv run pre-commit run --all-files  # 手動実行
```

### Frontend (Next.js)

- **ESLint**: TypeScript/JavaScriptのリンティング
- **Prettier**: コードフォーマット
- **Husky**: Gitフック管理
- **lint-staged**: ステージされたファイルのみをチェック

```bash
cd frontend
npm run pre-commit  # 手動実行
```

## 開発コマンド

### Backend API Service

```bash
cd backend/api_service
npm run dev          # 開発サーバー起動
npm run build        # ビルド
npm run test         # テスト実行
npm run lint         # リンティング
npm run format       # フォーマット
```

### Backend Document Generation Service

```bash
cd backend/docgen_service
pipenv run uvicorn main:app --reload  # 開発サーバー起動
pipenv run pytest                     # テスト実行
pipenv run flake8 .                   # リンティング
pipenv run black .                    # フォーマット
pipenv run mypy .                     # 型チェック
```

### Frontend

```bash
cd frontend
npm run dev          # 開発サーバー起動
npm run build        # ビルド
npm run lint         # リンティング
npm run format       # フォーマット
```

## 開発の原則

- **TDD（テスト駆動開発）**: テストを先に書き、実装を後から行う
- **コード品質**: ESLint、Prettier、Black、Flake8、MyPyによる品質管理
- **自動化**: pre-commitフックによる自動チェック
- **型安全性**: TypeScriptとMyPyによる型チェック

## ライセンス

ISC
