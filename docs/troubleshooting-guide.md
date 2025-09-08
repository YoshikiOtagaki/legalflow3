# LegalFlow3 トラブルシューティングガイド

## 概要

このガイドでは、LegalFlow3システムで発生する可能性のある問題とその解決方法を説明します。

## 目次

1. [一般的な問題](#一般的な問題)
2. [認証・認可の問題](#認証・認可の問題)
3. [データベースの問題](#データベースの問題)
4. [APIの問題](#apiの問題)
5. [フロントエンドの問題](#フロントエンドの問題)
6. [パフォーマンスの問題](#パフォーマンスの問題)
7. [デプロイメントの問題](#デプロイメントの問題)
8. [ログの確認方法](#ログの確認方法)
9. [緊急時の対応](#緊急時の対応)
10. [FAQ](#faq)

## 一般的な問題

### 1. システムにアクセスできない

#### 症状
- ブラウザでページが表示されない
- エラーメッセージが表示される
- タイムアウトが発生する

#### 原因と解決方法

**原因1: ネットワーク接続の問題**
```bash
# ネットワーク接続を確認
ping legalflow3.com
nslookup legalflow3.com
traceroute legalflow3.com
```

**原因2: DNS設定の問題**
```bash
# DNS設定を確認
dig legalflow3.com
dig api.legalflow3.com

# 別のDNSサーバーで確認
nslookup legalflow3.com 8.8.8.8
```

**原因3: SSL証明書の問題**
```bash
# SSL証明書を確認
openssl s_client -connect legalflow3.com:443 -servername legalflow3.com

# 証明書の有効期限を確認
echo | openssl s_client -connect legalflow3.com:443 -servername legalflow3.com 2>/dev/null | openssl x509 -noout -dates
```

### 2. ページの読み込みが遅い

#### 症状
- ページの表示に時間がかかる
- 画像やCSSが読み込まれない
- タイムアウトエラーが発生する

#### 原因と解決方法

**原因1: サーバーの負荷**
```bash
# CloudWatchメトリクスを確認
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name TargetResponseTime \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 300 \
  --statistics Average
```

**原因2: データベースの負荷**
```bash
# DynamoDBのメトリクスを確認
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=Cases \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 300 \
  --statistics Sum
```

**原因3: CDNの問題**
```bash
# CloudFrontのメトリクスを確認
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name Requests \
  --dimensions Name=DistributionId,Value=E1234567890ABCD \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 300 \
  --statistics Sum
```

## 認証・認可の問題

### 1. ログインできない

#### 症状
- ログインフォームでエラーが発生する
- 認証エラーメッセージが表示される
- セッションが切れる

#### 原因と解決方法

**原因1: ユーザー情報の不整合**
```bash
# Cognitoユーザープールを確認
aws cognito-idp list-users \
  --user-pool-id us-east-1_XXXXXXXXX \
  --region us-east-1

# 特定のユーザーを確認
aws cognito-idp admin-get-user \
  --user-pool-id us-east-1_XXXXXXXXX \
  --username user@example.com \
  --region us-east-1
```

**原因2: パスワードポリシーの問題**
```bash
# パスワードポリシーを確認
aws cognito-idp get-user-pool-policy \
  --user-pool-id us-east-1_XXXXXXXXX \
  --region us-east-1
```

**原因3: MFA設定の問題**
```bash
# MFA設定を確認
aws cognito-idp get-user-pool-mfa-config \
  --user-pool-id us-east-1_XXXXXXXXX \
  --region us-east-1
```

### 2. 権限エラー

#### 症状
- アクセス拒否エラーが発生する
- 特定の機能が使用できない
- データが表示されない

#### 原因と解決方法

**原因1: IAMポリシーの問題**
```bash
# IAMポリシーを確認
aws iam get-policy-version \
  --policy-arn arn:aws:iam::123456789012:policy/LegalFlow3Policy \
  --version-id v1

# ユーザーの権限を確認
aws iam list-attached-user-policies \
  --user-name legalflow3-user
```

**原因2: DynamoDBのアクセス権限**
```bash
# DynamoDBテーブルのポリシーを確認
aws dynamodb describe-table \
  --table-name Cases \
  --region us-east-1
```

## データベースの問題

### 1. データが表示されない

#### 症状
- ケース一覧が空になる
- 検索結果が表示されない
- データの更新が反映されない

#### 原因と解決方法

**原因1: DynamoDBテーブルの問題**
```bash
# テーブルの状態を確認
aws dynamodb describe-table \
  --table-name Cases \
  --region us-east-1

# テーブルの項目数を確認
aws dynamodb scan \
  --table-name Cases \
  --select COUNT \
  --region us-east-1
```

**原因2: インデックスの問題**
```bash
# グローバルセカンドインデックスを確認
aws dynamodb describe-table \
  --table-name Cases \
  --region us-east-1 | grep -A 20 "GlobalSecondaryIndexes"
```

**原因3: クエリの問題**
```bash
# クエリをテスト
aws dynamodb query \
  --table-name Cases \
  --key-condition-expression "PK = :pk" \
  --expression-attribute-values '{
    ":pk": {"S": "CASE#case-001"}
  }' \
  --region us-east-1
```

### 2. データの整合性エラー

#### 症状
- データの更新が失敗する
- 重複データが作成される
- データが消失する

#### 原因と解決方法

**原因1: トランザクションの問題**
```bash
# トランザクションログを確認
aws logs filter-log-events \
  --log-group-name /aws/lambda/legalflow3-createCase \
  --filter-pattern "ERROR" \
  --start-time 1640995200000 \
  --region us-east-1
```

**原因2: 同時アクセスの問題**
```bash
# 同時実行数を確認
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name ConcurrentExecutions \
  --dimensions Name=FunctionName,Value=legalflow3-createCase \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 300 \
  --statistics Maximum
```

## APIの問題

### 1. GraphQLエラー

#### 症状
- GraphQLクエリが失敗する
- エラーメッセージが表示される
- レスポンスが返されない

#### 原因と解決方法

**原因1: スキーマの問題**
```bash
# GraphQLスキーマを確認
aws appsync get-schema-creation-status \
  --api-id 1234567890abcdef \
  --region us-east-1
```

**原因2: リゾルバーの問題**
```bash
# リゾルバーを確認
aws appsync list-resolvers \
  --api-id 1234567890abcdef \
  --type-name Query \
  --region us-east-1
```

**原因3: データソースの問題**
```bash
# データソースを確認
aws appsync list-data-sources \
  --api-id 1234567890abcdef \
  --region us-east-1
```

### 2. Lambda関数のエラー

#### 症状
- Lambda関数が実行されない
- タイムアウトエラーが発生する
- メモリ不足エラーが発生する

#### 原因と解決方法

**原因1: 関数の設定問題**
```bash
# 関数の設定を確認
aws lambda get-function-configuration \
  --function-name legalflow3-createCase \
  --region us-east-1
```

**原因2: メモリ不足**
```bash
# メモリ使用量を確認
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name MemoryUtilization \
  --dimensions Name=FunctionName,Value=legalflow3-createCase \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 300 \
  --statistics Average
```

**原因3: タイムアウト**
```bash
# 実行時間を確認
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=legalflow3-createCase \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 300 \
  --statistics Average
```

## フロントエンドの問題

### 1. JavaScriptエラー

#### 症状
- ブラウザのコンソールにエラーが表示される
- ページが正常に動作しない
- 機能が使用できない

#### 原因と解決方法

**原因1: 依存関係の問題**
```bash
# 依存関係を確認
cd frontend
npm list
npm audit

# 依存関係を更新
npm update
npm audit fix
```

**原因2: ビルドの問題**
```bash
# ビルドを実行
npm run build

# ビルドエラーを確認
npm run build 2>&1 | tee build.log
```

**原因3: 環境変数の問題**
```bash
# 環境変数を確認
cat .env.production
echo $NEXT_PUBLIC_API_URL
```

### 2. スタイリングの問題

#### 症状
- CSSが適用されない
- レイアウトが崩れる
- レスポンシブデザインが動作しない

#### 原因と解決方法

**原因1: Tailwind CSSの問題**
```bash
# Tailwind設定を確認
cat tailwind.config.ts

# CSSを再ビルド
npm run build:css
```

**原因2: ビルドの問題**
```bash
# ビルドをクリーンアップ
rm -rf .next
npm run build
```

## パフォーマンスの問題

### 1. レスポンス時間が遅い

#### 症状
- ページの読み込みが遅い
- APIのレスポンスが遅い
- データベースクエリが遅い

#### 原因と解決方法

**原因1: データベースクエリの最適化**
```bash
# クエリの実行時間を確認
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name SuccessfulRequestLatency \
  --dimensions Name=TableName,Value=Cases \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 300 \
  --statistics Average
```

**原因2: Lambda関数の最適化**
```bash
# 関数の実行時間を確認
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=legalflow3-createCase \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 300 \
  --statistics Average
```

**原因3: CDNの最適化**
```bash
# CloudFrontのキャッシュヒット率を確認
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name CacheHitRate \
  --dimensions Name=DistributionId,Value=E1234567890ABCD \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 300 \
  --statistics Average
```

### 2. メモリ使用量の問題

#### 症状
- メモリ不足エラーが発生する
- システムが遅くなる
- クラッシュが発生する

#### 原因と解決方法

**原因1: Lambda関数のメモリ不足**
```bash
# メモリ使用量を確認
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name MemoryUtilization \
  --dimensions Name=FunctionName,Value=legalflow3-createCase \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 300 \
  --statistics Average
```

**原因2: データベースのメモリ不足**
```bash
# DynamoDBのメモリ使用量を確認
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=Cases \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 300 \
  --statistics Sum
```

## デプロイメントの問題

### 1. デプロイメント失敗

#### 症状
- デプロイメントが途中で止まる
- エラーメッセージが表示される
- システムが使用できない状態になる

#### 原因と解決方法

**原因1: 権限の問題**
```bash
# IAMロールを確認
aws iam get-role --role-name legalflow3-deployment-role

# ポリシーを確認
aws iam list-attached-role-policies \
  --role-name legalflow3-deployment-role
```

**原因2: リソースの制限**
```bash
# リソースの制限を確認
aws service-quotas get-service-quota \
  --service-code lambda \
  --quota-code L-B99A9384 \
  --region us-east-1
```

**原因3: 依存関係の問題**
```bash
# 依存関係を確認
aws cloudformation describe-stack-events \
  --stack-name legalflow3-stack \
  --region us-east-1
```

### 2. ロールバックが必要

#### 症状
- デプロイメント後に問題が発生する
- システムが正常に動作しない
- データが失われる

#### 原因と解決方法

**原因1: コードの問題**
```bash
# 前のバージョンにロールバック
git checkout previous-version
npm run build
aws s3 sync dist/ s3://legalflow3-frontend-prod --delete
```

**原因2: 設定の問題**
```bash
# 設定を前のバージョンに戻す
aws lambda update-function-configuration \
  --function-name legalflow3-createCase \
  --environment Variables='{
    "NODE_ENV":"production",
    "AWS_REGION":"us-east-1",
    "CASES_TABLE":"Cases"
  }' \
  --region us-east-1
```

## ログの確認方法

### 1. CloudWatch Logs

```bash
# ロググループを一覧表示
aws logs describe-log-groups --region us-east-1

# ログストリームを一覧表示
aws logs describe-log-streams \
  --log-group-name /aws/lambda/legalflow3-createCase \
  --region us-east-1

# ログイベントを取得
aws logs get-log-events \
  --log-group-name /aws/lambda/legalflow3-createCase \
  --log-stream-name 2024/01/01/[$LATEST]1234567890abcdef \
  --region us-east-1
```

### 2. アプリケーションログ

```bash
# アプリケーションログを確認
aws logs filter-log-events \
  --log-group-name /aws/lambda/legalflow3-createCase \
  --filter-pattern "ERROR" \
  --start-time 1640995200000 \
  --region us-east-1
```

### 3. アクセスログ

```bash
# アクセスログを確認
aws logs filter-log-events \
  --log-group-name /aws/cloudfront/access-logs \
  --filter-pattern "404" \
  --start-time 1640995200000 \
  --region us-east-1
```

## 緊急時の対応

### 1. システムダウン

#### 対応手順

1. **状況確認**
   ```bash
   # システムの状態を確認
   aws cloudwatch get-metric-statistics \
     --namespace AWS/ApplicationELB \
     --metric-name HealthyHostCount \
     --start-time 2024-01-01T00:00:00Z \
     --end-time 2024-01-01T23:59:59Z \
     --period 300 \
     --statistics Average
   ```

2. **ログ確認**
   ```bash
   # エラーログを確認
   aws logs filter-log-events \
     --log-group-name /aws/lambda/legalflow3-createCase \
     --filter-pattern "ERROR" \
     --start-time 1640995200000 \
     --region us-east-1
   ```

3. **緊急対応**
   ```bash
   # 緊急メンテナンスモードを有効化
   aws s3 cp maintenance.html s3://legalflow3-frontend-prod/index.html
   ```

### 2. データ損失

#### 対応手順

1. **バックアップ確認**
   ```bash
   # バックアップを確認
   aws dynamodb list-backups \
     --table-name Cases \
     --region us-east-1
   ```

2. **復元実行**
   ```bash
   # バックアップから復元
   aws dynamodb restore-table-from-backup \
     --target-table-name Cases-restored \
     --backup-arn arn:aws:dynamodb:us-east-1:123456789012:table/Cases/backup/12345678-1234-1234-1234-123456789012 \
     --region us-east-1
   ```

3. **データ検証**
   ```bash
   # データの整合性を確認
   aws dynamodb scan \
     --table-name Cases-restored \
     --select COUNT \
     --region us-east-1
   ```

### 3. セキュリティインシデント

#### 対応手順

1. **アクセス制限**
   ```bash
   # セキュリティグループを更新
   aws ec2 modify-security-group-rules \
     --group-id sg-12345678 \
     --security-group-rules '[{
       "SecurityGroupRuleId": "sgr-12345678",
       "SecurityGroupRule": {
         "IpProtocol": "tcp",
         "FromPort": 443,
         "ToPort": 443,
         "CidrIpv4": "0.0.0.0/0"
       }
     }]'
   ```

2. **ログ分析**
   ```bash
   # アクセスログを分析
   aws logs filter-log-events \
     --log-group-name /aws/cloudfront/access-logs \
     --filter-pattern "suspicious" \
     --start-time 1640995200000 \
     --region us-east-1
   ```

3. **通知**
   ```bash
   # 関係者に通知
   aws sns publish \
     --topic-arn arn:aws:sns:us-east-1:123456789012:legalflow3-alerts \
     --message "Security incident detected" \
     --region us-east-1
   ```

## FAQ

### Q: システムが遅いのですが、どうすればよいですか？

A: 以下の手順で確認してください：

1. CloudWatchメトリクスでパフォーマンスを確認
2. データベースクエリを最適化
3. Lambda関数のメモリとタイムアウトを調整
4. CDNのキャッシュ設定を確認

### Q: ログインできません。どうすればよいですか？

A: 以下の手順で確認してください：

1. ユーザー名とパスワードが正しいか確認
2. パスワードポリシーに準拠しているか確認
3. MFA設定を確認
4. Cognitoユーザープールの状態を確認

### Q: データが表示されません。どうすればよいですか？

A: 以下の手順で確認してください：

1. DynamoDBテーブルの状態を確認
2. インデックスの状態を確認
3. クエリの条件を確認
4. 権限設定を確認

### Q: エラーメッセージが表示されます。どうすればよいですか？

A: 以下の手順で確認してください：

1. ブラウザのコンソールでエラーを確認
2. CloudWatch Logsでエラーログを確認
3. エラーメッセージの内容を確認
4. 必要に応じてサポートに連絡

### Q: システムを更新したいのですが、どうすればよいですか？

A: 以下の手順で更新してください：

1. コードを最新版に更新
2. 依存関係を更新
3. テストを実行
4. ステージング環境でテスト
5. 本番環境にデプロイ

## サポート

### 連絡先

- **技術サポート**: tech-support@legalflow3.com
- **緊急時連絡先**: +81-3-1234-5678
- **営業時間**: 平日 9:00-18:00

### エスカレーション手順

1. **レベル1**: 基本的な問題の解決
2. **レベル2**: 複雑な問題の解決
3. **レベル3**: 緊急時の対応

### ドキュメント

- **ユーザーマニュアル**: https://docs.legalflow3.com/user-manual
- **開発者ガイド**: https://docs.legalflow3.com/developer-guide
- **API仕様書**: https://docs.legalflow3.com/api-specification

---

このトラブルシューティングガイドで問題が解決しない場合は、サポートチームまでお問い合わせください。
