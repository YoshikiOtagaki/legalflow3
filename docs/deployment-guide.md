# LegalFlow3 デプロイメントガイド

## 概要

このガイドでは、LegalFlow3システムの本番環境へのデプロイメント手順を説明します。

## 目次

1. [前提条件](#前提条件)
2. [環境準備](#環境準備)
3. [AWS Amplify設定](#aws-amplify設定)
4. [データベース設定](#データベース設定)
5. [Lambda関数デプロイ](#lambda関数デプロイ)
6. [フロントエンドデプロイ](#フロントエンドデプロイ)
7. [ドメイン設定](#ドメイン設定)
8. [SSL証明書設定](#ssl証明書設定)
9. [環境変数設定](#環境変数設定)
10. [監視設定](#監視設定)
11. [バックアップ設定](#バックアップ設定)
12. [ロールバック手順](#ロールバック手順)

## 前提条件

### 必要なツール

- AWS CLI 2.x以上
- AWS Amplify CLI
- Node.js 18.x以上
- npm 8.x以上
- Git

### 必要な権限

- AWS AdministratorAccess
- Route 53 Hosted Zone管理権限
- ACM証明書管理権限

## 環境準備

### 1. AWSアカウント設定

```bash
# AWS CLI設定
aws configure

# プロファイル設定
aws configure --profile legalflow3-prod
export AWS_PROFILE=legalflow3-prod
```

### 2. リポジトリ設定

```bash
# リポジトリのクローン
git clone https://github.com/legalflow3/legalflow3.git
cd legalflow3

# 本番ブランチの作成
git checkout -b production
```

### 3. 環境変数設定

```bash
# 本番環境用の環境変数ファイルを作成
cp .env.example .env.production

# 環境変数を設定
export NODE_ENV=production
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=123456789012
```

## AWS Amplify設定

### 1. Amplifyプロジェクトの初期化

```bash
# Amplifyプロジェクトを初期化
amplify init

# プロジェクト名: legalflow3-prod
# 環境名: production
# デフォルトエディタ: vim
# アプリタイプ: javascript
# フレームワーク: react
# ソースディレクトリ: frontend
# ビルドコマンド: npm run build
# スタートコマンド: npm run start
# ディストリビューション: dist
```

### 2. 認証設定

```bash
# Cognito User Poolを追加
amplify add auth

# 設定内容:
# - 認証フロー: ユーザー名とパスワード
# - 必須属性: email, given_name, family_name
# - パスワードポリシー: 8文字以上、大文字、小文字、数字、記号
# - MFA: 有効
# - ユーザープール名: legalflow3-users
```

### 3. データベース設定

```bash
# DynamoDBテーブルを追加
amplify add storage

# 設定内容:
# - サービス: DynamoDB
# - テーブル名: Cases
# - パーティションキー: PK (String)
# - ソートキー: SK (String)
# - グローバルセカンドインデックス: 有効
```

### 4. API設定

```bash
# GraphQL APIを追加
amplify add api

# 設定内容:
# - サービス: GraphQL
# - API名: legalflow3-api
# - 認証: Amazon Cognito User Pool
# - 追加の認証: API Key
# - スキーマテンプレート: Single Object with Fields
```

## データベース設定

### 1. DynamoDBテーブル作成

```bash
# テーブル作成スクリプトを実行
cd scripts/database
./create-tables.sh

# または、AWS CLIで直接作成
aws dynamodb create-table \
  --table-name Cases \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### 2. グローバルセカンドインデックス作成

```bash
# GSI作成スクリプト
aws dynamodb update-table \
  --table-name Cases \
  --attribute-definitions \
    AttributeName=GSI1PK,AttributeType=S \
    AttributeName=GSI1SK,AttributeType=S \
  --global-secondary-index-updates \
    '[{
      "Create": {
        "IndexName": "GSI1",
        "KeySchema": [
          {"AttributeName": "GSI1PK", "KeyType": "HASH"},
          {"AttributeName": "GSI1SK", "KeyType": "RANGE"}
        ],
        "Projection": {"ProjectionType": "ALL"}
      }
    }]' \
  --region us-east-1
```

### 3. 初期データ投入

```bash
# 初期データ投入スクリプト
cd scripts/data
./seed-data.sh

# または、個別にデータを投入
aws dynamodb put-item \
  --table-name Cases \
  --item '{
    "PK": {"S": "CASE#case-001"},
    "SK": {"S": "METADATA"},
    "name": {"S": "サンプルケース"},
    "status": {"S": "ACTIVE"},
    "priority": {"S": "HIGH"}
  }' \
  --region us-east-1
```

## Lambda関数デプロイ

### 1. 関数パッケージ作成

```bash
# 各Lambda関数のパッケージを作成
cd amplify/backend/function/createCase
npm install --production
zip -r createCase.zip .

cd ../updateCase
npm install --production
zip -r updateCase.zip .

cd ../deleteCase
npm install --production
zip -r deleteCase.zip .

cd ../getCase
npm install --production
zip -r getCase.zip .

cd ../listCases
npm install --production
zip -r listCases.zip .

cd ../searchCases
npm install --production
zip -r searchCases.zip .
```

### 2. 関数デプロイ

```bash
# 各関数をデプロイ
aws lambda create-function \
  --function-name legalflow3-createCase \
  --runtime nodejs18.x \
  --role arn:aws:iam::123456789012:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://createCase.zip \
  --timeout 30 \
  --memory-size 256 \
  --environment Variables='{
    "CASES_TABLE":"Cases",
    "REGION":"us-east-1"
  }' \
  --region us-east-1

# 同様に他の関数もデプロイ
```

### 3. 関数設定

```bash
# 環境変数設定
aws lambda update-function-configuration \
  --function-name legalflow3-createCase \
  --environment Variables='{
    "CASES_TABLE":"Cases",
    "REGION":"us-east-1",
    "LOG_LEVEL":"INFO"
  }' \
  --region us-east-1

# タイムアウト設定
aws lambda update-function-configuration \
  --function-name legalflow3-createCase \
  --timeout 60 \
  --region us-east-1

# メモリ設定
aws lambda update-function-configuration \
  --function-name legalflow3-createCase \
  --memory-size 512 \
  --region us-east-1
```

## フロントエンドデプロイ

### 1. ビルド設定

```bash
# フロントエンドディレクトリに移動
cd frontend

# 依存関係のインストール
npm install

# 本番用ビルド
npm run build

# ビルド結果の確認
ls -la dist/
```

### 2. 環境変数設定

```bash
# 本番用の環境変数ファイルを作成
cat > .env.production << EOF
NEXT_PUBLIC_API_URL=https://api.legalflow3.com
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_USER_POOL_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_APP_VERSION=1.0.0
EOF
```

### 3. S3バケット設定

```bash
# S3バケットを作成
aws s3 mb s3://legalflow3-frontend-prod --region us-east-1

# 静的ファイルをアップロード
aws s3 sync dist/ s3://legalflow3-frontend-prod --delete

# バケットポリシーを設定
aws s3api put-bucket-policy \
  --bucket legalflow3-frontend-prod \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "PublicReadGetObject",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::legalflow3-frontend-prod/*"
      }
    ]
  }'
```

### 4. CloudFront設定

```bash
# CloudFrontディストリビューションを作成
aws cloudfront create-distribution \
  --distribution-config '{
    "CallerReference": "legalflow3-prod-2024-01-01",
    "Comment": "LegalFlow3 Production Distribution",
    "DefaultRootObject": "index.html",
    "Origins": {
      "Quantity": 1,
      "Items": [
        {
          "Id": "S3-legalflow3-frontend-prod",
          "DomainName": "legalflow3-frontend-prod.s3.amazonaws.com",
          "S3OriginConfig": {
            "OriginAccessIdentity": ""
          }
        }
      ]
    },
    "DefaultCacheBehavior": {
      "TargetOriginId": "S3-legalflow3-frontend-prod",
      "ViewerProtocolPolicy": "redirect-to-https",
      "TrustedSigners": {
        "Enabled": false,
        "Quantity": 0
      },
      "ForwardedValues": {
        "QueryString": false,
        "Cookies": {
          "Forward": "none"
        }
      },
      "MinTTL": 0,
      "DefaultTTL": 3600,
      "MaxTTL": 86400
    },
    "Enabled": true,
    "PriceClass": "PriceClass_100"
  }'
```

## ドメイン設定

### 1. Route 53設定

```bash
# ホストゾーンを作成
aws route53 create-hosted-zone \
  --name legalflow3.com \
  --caller-reference legalflow3-prod-2024-01-01

# ネームサーバーを確認
aws route53 get-hosted-zone --id Z1234567890ABCDEFGHIJ
```

### 2. DNS設定

```bash
# Aレコードを作成（CloudFront用）
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABCDEFGHIJ \
  --change-batch '{
    "Changes": [
      {
        "Action": "CREATE",
        "ResourceRecordSet": {
          "Name": "legalflow3.com",
          "Type": "A",
          "AliasTarget": {
            "DNSName": "d1234567890.cloudfront.net",
            "EvaluateTargetHealth": false,
            "HostedZoneId": "Z2FDTNDATAQYW2"
          }
        }
      }
    ]
  }'

# CNAMEレコードを作成（API用）
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABCDEFGHIJ \
  --change-batch '{
    "Changes": [
      {
        "Action": "CREATE",
        "ResourceRecordSet": {
          "Name": "api.legalflow3.com",
          "Type": "CNAME",
          "TTL": 300,
          "ResourceRecords": [
            {
              "Value": "d1234567890.execute-api.us-east-1.amazonaws.com"
            }
          ]
        }
      }
    ]
  }'
```

## SSL証明書設定

### 1. ACM証明書作成

```bash
# 証明書をリクエスト
aws acm request-certificate \
  --domain-name legalflow3.com \
  --subject-alternative-names "*.legalflow3.com" \
  --validation-method DNS \
  --region us-east-1

# 検証用のCNAMEレコードを取得
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012 \
  --region us-east-1
```

### 2. 証明書検証

```bash
# DNS検証用のCNAMEレコードを作成
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABCDEFGHIJ \
  --change-batch '{
    "Changes": [
      {
        "Action": "CREATE",
        "ResourceRecordSet": {
          "Name": "_1234567890.legalflow3.com",
          "Type": "CNAME",
          "TTL": 300,
          "ResourceRecords": [
            {
              "Value": "_1234567890.acm-validations.aws."
            }
          ]
        }
      }
    ]
  }'
```

### 3. CloudFrontに証明書を適用

```bash
# CloudFrontディストリビューションを更新
aws cloudfront update-distribution \
  --id E1234567890ABCD \
  --distribution-config '{
    "CallerReference": "legalflow3-prod-2024-01-01",
    "Comment": "LegalFlow3 Production Distribution",
    "DefaultRootObject": "index.html",
    "Origins": {
      "Quantity": 1,
      "Items": [
        {
          "Id": "S3-legalflow3-frontend-prod",
          "DomainName": "legalflow3-frontend-prod.s3.amazonaws.com",
          "S3OriginConfig": {
            "OriginAccessIdentity": ""
          }
        }
      ]
    },
    "DefaultCacheBehavior": {
      "TargetOriginId": "S3-legalflow3-frontend-prod",
      "ViewerProtocolPolicy": "redirect-to-https",
      "TrustedSigners": {
        "Enabled": false,
        "Quantity": 0
      },
      "ForwardedValues": {
        "QueryString": false,
        "Cookies": {
          "Forward": "none"
        }
      },
      "MinTTL": 0,
      "DefaultTTL": 3600,
      "MaxTTL": 86400
    },
    "Aliases": {
      "Quantity": 1,
      "Items": ["legalflow3.com"]
    },
    "ViewerCertificate": {
      "ACMCertificateArn": "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012",
      "SSLSupportMethod": "sni-only",
      "MinimumProtocolVersion": "TLSv1.2_2021"
    },
    "Enabled": true,
    "PriceClass": "PriceClass_100"
  }'
```

## 環境変数設定

### 1. システム環境変数

```bash
# 本番環境用の環境変数を設定
export NODE_ENV=production
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=123456789012
export APP_VERSION=1.0.0
export LOG_LEVEL=INFO
```

### 2. Lambda関数環境変数

```bash
# 各Lambda関数の環境変数を設定
aws lambda update-function-configuration \
  --function-name legalflow3-createCase \
  --environment Variables='{
    "NODE_ENV":"production",
    "AWS_REGION":"us-east-1",
    "CASES_TABLE":"Cases",
    "USERS_TABLE":"Users",
    "LOG_LEVEL":"INFO",
    "APP_VERSION":"1.0.0"
  }' \
  --region us-east-1
```

### 3. シークレット管理

```bash
# AWS Secrets Managerにシークレットを保存
aws secretsmanager create-secret \
  --name "legalflow3/database" \
  --description "Database connection string" \
  --secret-string '{
    "host": "localhost",
    "port": 5432,
    "database": "legalflow3",
    "username": "admin",
    "password": "secure-password"
  }' \
  --region us-east-1

# シークレットを取得
aws secretsmanager get-secret-value \
  --secret-id "legalflow3/database" \
  --region us-east-1
```

## 監視設定

### 1. CloudWatchアラーム設定

```bash
# Lambda関数のエラー率アラーム
aws cloudwatch put-metric-alarm \
  --alarm-name "legalflow3-createCase-errors" \
  --alarm-description "CreateCase function error rate" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=legalflow3-createCase \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:123456789012:legalflow3-alerts

# DynamoDBの読み取り容量アラーム
aws cloudwatch put-metric-alarm \
  --alarm-name "legalflow3-cases-read-capacity" \
  --alarm-description "Cases table read capacity" \
  --metric-name ConsumedReadCapacityUnits \
  --namespace AWS/DynamoDB \
  --statistic Sum \
  --period 300 \
  --threshold 1000 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=TableName,Value=Cases \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:123456789012:legalflow3-alerts
```

### 2. ログ設定

```bash
# CloudWatch Logsグループを作成
aws logs create-log-group \
  --log-group-name /aws/lambda/legalflow3-createCase \
  --region us-east-1

# ログ保持期間を設定
aws logs put-retention-policy \
  --log-group-name /aws/lambda/legalflow3-createCase \
  --retention-in-days 30 \
  --region us-east-1
```

### 3. ダッシュボード設定

```bash
# CloudWatchダッシュボードを作成
aws cloudwatch put-dashboard \
  --dashboard-name "LegalFlow3-Production" \
  --dashboard-body '{
    "widgets": [
      {
        "type": "metric",
        "x": 0,
        "y": 0,
        "width": 12,
        "height": 6,
        "properties": {
          "metrics": [
            ["AWS/Lambda", "Invocations", "FunctionName", "legalflow3-createCase"],
            ["AWS/Lambda", "Errors", "FunctionName", "legalflow3-createCase"]
          ],
          "period": 300,
          "stat": "Sum",
          "region": "us-east-1",
          "title": "Lambda Function Metrics"
        }
      }
    ]
  }' \
  --region us-east-1
```

## バックアップ設定

### 1. DynamoDBバックアップ

```bash
# ポイントインタイムリカバリを有効化
aws dynamodb update-continuous-backups \
  --table-name Cases \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
  --region us-east-1

# オンデマンドバックアップを作成
aws dynamodb create-backup \
  --table-name Cases \
  --backup-name "Cases-backup-$(date +%Y%m%d-%H%M%S)" \
  --region us-east-1
```

### 2. S3バックアップ

```bash
# バックアップ用S3バケットを作成
aws s3 mb s3://legalflow3-backup-prod --region us-east-1

# ライフサイクルポリシーを設定
aws s3api put-bucket-lifecycle-configuration \
  --bucket legalflow3-backup-prod \
  --lifecycle-configuration '{
    "Rules": [
      {
        "ID": "BackupLifecycle",
        "Status": "Enabled",
        "Transitions": [
          {
            "Days": 30,
            "StorageClass": "STANDARD_IA"
          },
          {
            "Days": 90,
            "StorageClass": "GLACIER"
          }
        ]
      }
    ]
  }'
```

### 3. 自動バックアップスクリプト

```bash
#!/bin/bash
# backup.sh

# 日付を取得
DATE=$(date +%Y%m%d-%H%M%S)

# DynamoDBバックアップ
aws dynamodb create-backup \
  --table-name Cases \
  --backup-name "Cases-backup-$DATE" \
  --region us-east-1

# S3バックアップ
aws s3 sync s3://legalflow3-frontend-prod s3://legalflow3-backup-prod/frontend/$DATE

# 古いバックアップを削除（30日以上前）
aws s3 rm s3://legalflow3-backup-prod/frontend/ --recursive --exclude "*" --include "*/" | while read line; do
  if [[ $line == *"DELETE"* ]]; then
    echo "Deleted old backup: $line"
  fi
done
```

## ロールバック手順

### 1. フロントエンドロールバック

```bash
# 前のバージョンのビルドをデプロイ
cd frontend
git checkout previous-version
npm run build
aws s3 sync dist/ s3://legalflow3-frontend-prod --delete

# CloudFrontキャッシュを無効化
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABCD \
  --paths "/*"
```

### 2. Lambda関数ロールバック

```bash
# 前のバージョンの関数をデプロイ
aws lambda update-function-code \
  --function-name legalflow3-createCase \
  --zip-file fileb://createCase-previous.zip \
  --region us-east-1
```

### 3. データベースロールバック

```bash
# バックアップから復元
aws dynamodb restore-table-from-backup \
  --target-table-name Cases-restored \
  --backup-arn arn:aws:dynamodb:us-east-1:123456789012:table/Cases/backup/12345678-1234-1234-1234-123456789012 \
  --region us-east-1

# テーブルを切り替え
aws dynamodb delete-table --table-name Cases --region us-east-1
aws dynamodb rename-table --source-table-name Cases-restored --target-table-name Cases --region us-east-1
```

## デプロイメント確認

### 1. ヘルスチェック

```bash
# フロントエンドの確認
curl -I https://legalflow3.com

# APIの確認
curl -I https://api.legalflow3.com/health

# データベースの確認
aws dynamodb describe-table --table-name Cases --region us-east-1
```

### 2. 機能テスト

```bash
# 自動テストの実行
cd frontend
npm run test:e2e

# 手動テストの実行
npm run test:manual
```

### 3. パフォーマンステスト

```bash
# 負荷テストの実行
npm run test:load

# メトリクスの確認
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=legalflow3-createCase \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 300 \
  --statistics Average
```

## トラブルシューティング

### よくある問題

#### 1. デプロイメント失敗

```bash
# ログを確認
aws logs describe-log-groups --region us-east-1
aws logs get-log-events --log-group-name /aws/lambda/legalflow3-createCase --region us-east-1

# エラーの詳細を確認
aws lambda get-function --function-name legalflow3-createCase --region us-east-1
```

#### 2. 認証エラー

```bash
# Cognito設定を確認
aws cognito-idp describe-user-pool --user-pool-id us-east-1_XXXXXXXXX --region us-east-1

# ユーザープールクライアントを確認
aws cognito-idp describe-user-pool-client --user-pool-id us-east-1_XXXXXXXXX --client-id XXXXXXXXXXXXXXXXXXXXXXXXXX --region us-east-1
```

#### 3. データベース接続エラー

```bash
# DynamoDBテーブルの状態を確認
aws dynamodb describe-table --table-name Cases --region us-east-1

# テーブルの項目数を確認
aws dynamodb scan --table-name Cases --select COUNT --region us-east-1
```

## まとめ

このデプロイメントガイドに従うことで、LegalFlow3システムを本番環境に安全にデプロイできます。問題が発生した場合は、ログを確認し、必要に応じてロールバックを実行してください。

### サポート

- **技術サポート**: tech-support@legalflow3.com
- **緊急時連絡先**: +81-3-1234-5678
- **ドキュメント**: https://docs.legalflow3.com
