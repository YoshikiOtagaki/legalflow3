# LegalFlow3 セキュリティガイド

## 概要

このガイドでは、LegalFlow3システムのセキュリティ対策、ベストプラクティス、インシデント対応について説明します。

## 目次

1. [セキュリティアーキテクチャ](#セキュリティアーキテクチャ)
2. [認証・認可](#認証・認可)
3. [データ保護](#データ保護)
4. [ネットワークセキュリティ](#ネットワークセキュリティ)
5. [アプリケーションセキュリティ](#アプリケーションセキュリティ)
6. [インフラストラクチャセキュリティ](#インフラストラクチャセキュリティ)
7. [監視・ログ](#監視・ログ)
8. [インシデント対応](#インシデント対応)
9. [コンプライアンス](#コンプライアンス)
10. [セキュリティテスト](#セキュリティテスト)

## セキュリティアーキテクチャ

### セキュリティの多層防御

```
┌─────────────────────────────────────────────────────────────┐
│                    セキュリティレイヤー                        │
├─────────────────────────────────────────────────────────────┤
│ 1. ネットワークセキュリティ (WAF, DDoS Protection)           │
├─────────────────────────────────────────────────────────────┤
│ 2. アプリケーションセキュリティ (認証, 認可, 入力検証)          │
├─────────────────────────────────────────────────────────────┤
│ 3. データセキュリティ (暗号化, アクセス制御)                   │
├─────────────────────────────────────────────────────────────┤
│ 4. インフラストラクチャセキュリティ (IAM, VPC, セキュリティグループ) │
├─────────────────────────────────────────────────────────────┤
│ 5. 監視・ログ (CloudWatch, X-Ray, セキュリティ監視)           │
└─────────────────────────────────────────────────────────────┘
```

### セキュリティ原則

1. **最小権限の原則**: 必要最小限の権限のみを付与
2. **防御の深度**: 複数のセキュリティレイヤーを実装
3. **ゼロトラスト**: すべてのアクセスを検証
4. **継続的監視**: 24/7のセキュリティ監視
5. **インシデント対応**: 迅速な対応と復旧

## 認証・認可

### 認証システム

#### Amazon Cognito User Pools

```typescript
// 認証設定
const authConfig = {
  region: process.env.AWS_REGION,
  userPoolId: process.env.USER_POOL_ID,
  userPoolWebClientId: process.env.USER_POOL_CLIENT_ID,
  mandatorySignIn: true,
  authenticationFlowType: 'USER_SRP_AUTH',
  oauth: {
    domain: process.env.OAUTH_DOMAIN,
    scope: ['openid', 'email', 'profile'],
    redirectSignIn: process.env.REDIRECT_SIGN_IN,
    redirectSignOut: process.env.REDIRECT_SIGN_OUT,
    responseType: 'code'
  }
};
```

#### パスワードポリシー

```yaml
PasswordPolicy:
  MinimumLength: 8
  RequireUppercase: true
  RequireLowercase: true
  RequireNumbers: true
  RequireSymbols: true
  TemporaryPasswordValidityDays: 7
```

#### 多要素認証 (MFA)

```typescript
// MFA設定
const mfaConfig = {
  MfaConfiguration: 'ON',
  SoftwareTokenMfaConfiguration: {
    Enabled: true
  },
  SmsMfaConfiguration: {
    SmsAuthenticationMessage: 'Your LegalFlow3 verification code is {####}',
    SmsConfiguration: {
      SnsCallerArn: 'arn:aws:iam::123456789012:role/sns-caller-role',
      ExternalId: 'legalflow3-sms'
    }
  }
};
```

### 認可システム

#### IAMロールベースアクセス制御

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "cognito-identity.amazonaws.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "cognito-identity.amazonaws.com:aud": "us-east-1:12345678-1234-1234-1234-123456789012"
        },
        "ForAnyValue:StringLike": {
          "cognito-identity.amazonaws.com:amr": "authenticated"
        }
      }
    }
  ]
}
```

#### アプリケーションレベル認可

```typescript
// 権限チェック
interface Permission {
  resource: string;
  actions: string[];
  conditions?: Record<string, any>;
}

const checkPermission = (user: User, resource: string, action: string): boolean => {
  return user.permissions.some(permission =>
    permission.resource === resource &&
    permission.actions.includes(action)
  );
};

// ケースアクセス権限
const canAccessCase = (user: User, caseId: string): boolean => {
  // ケースに割り当てられているかチェック
  const assignment = user.caseAssignments.find(a => a.caseId === caseId);
  return !!assignment && assignment.isActive;
};
```

## データ保護

### データ暗号化

#### 保存時暗号化

```yaml
# DynamoDB暗号化設定
DynamoDBEncryption:
  Type: AWS::DynamoDB::Table
  Properties:
    TableName: Cases
    BillingMode: PAY_PER_REQUEST
    AttributeDefinitions:
      - AttributeName: PK
        AttributeType: S
      - AttributeName: SK
        AttributeType: S
    KeySchema:
      - AttributeName: PK
        KeyType: HASH
      - AttributeName: SK
        KeyType: RANGE
    SSESpecification:
      SSEEnabled: true
      KMSMasterKeyId: alias/legalflow3-dynamodb
```

#### 転送時暗号化

```typescript
// HTTPS強制
const httpsRedirect = (req: Request, res: Response, next: NextFunction) => {
  if (req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
};

// HSTSヘッダー
const hstsHeader = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
};
```

#### アプリケーションレベル暗号化

```typescript
import crypto from 'crypto';

// 機密データの暗号化
const encryptSensitiveData = (data: string, key: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher('aes-256-gcm', key);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
};

// 機密データの復号化
const decryptSensitiveData = (encryptedData: string, key: string): string => {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipher('aes-256-gcm', key);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
```

### データマスキング

```typescript
// PIIデータのマスキング
const maskPII = (data: any): any => {
  const masked = { ...data };

  if (masked.email) {
    const [local, domain] = masked.email.split('@');
    masked.email = `${local.substring(0, 2)}***@${domain}`;
  }

  if (masked.phone) {
    masked.phone = masked.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }

  return masked;
};
```

### データバックアップ

```bash
# 暗号化されたバックアップ
aws dynamodb create-backup \
  --table-name Cases \
  --backup-name "Cases-backup-$(date +%Y%m%d-%H%M%S)" \
  --region us-east-1

# バックアップの暗号化確認
aws dynamodb describe-backup \
  --backup-arn arn:aws:dynamodb:us-east-1:123456789012:table/Cases/backup/12345678-1234-1234-1234-123456789012 \
  --region us-east-1
```

## ネットワークセキュリティ

### VPC設定

```yaml
# VPC設定
VPC:
  Type: AWS::EC2::VPC
  Properties:
    CidrBlock: 10.0.0.0/16
    EnableDnsHostnames: true
    EnableDnsSupport: true
    Tags:
      - Key: Name
        Value: LegalFlow3-VPC

# プライベートサブネット
PrivateSubnet:
  Type: AWS::EC2::Subnet
  Properties:
    VpcId: !Ref VPC
    CidrBlock: 10.0.1.0/24
    AvailabilityZone: us-east-1a
    Tags:
      - Key: Name
        Value: LegalFlow3-Private-Subnet
```

### セキュリティグループ

```yaml
# Webサーバー用セキュリティグループ
WebSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: Security group for web servers
    VpcId: !Ref VPC
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 80
        ToPort: 80
        CidrIp: 0.0.0.0/0
      - IpProtocol: tcp
        FromPort: 443
        ToPort: 443
        CidrIp: 0.0.0.0/0
    SecurityGroupEgress:
      - IpProtocol: -1
        CidrIp: 0.0.0.0/0

# データベース用セキュリティグループ
DatabaseSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: Security group for database
    VpcId: !Ref VPC
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 5432
        ToPort: 5432
        SourceSecurityGroupId: !Ref WebSecurityGroup
```

### WAF設定

```yaml
# AWS WAF設定
WebACL:
  Type: AWS::WAFv2::WebACL
  Properties:
    Name: LegalFlow3-WebACL
    Scope: CLOUDFRONT
    DefaultAction:
      Allow: {}
    Rules:
      - Name: AWSManagedRulesCommonRuleSet
        Priority: 1
        OverrideAction:
          None: {}
        Statement:
          ManagedRuleGroupStatement:
            VendorName: AWS
            Name: AWSManagedRulesCommonRuleSet
        VisibilityConfig:
          SampledRequestsEnabled: true
          CloudWatchMetricsEnabled: true
          MetricName: CommonRuleSetMetric
      - Name: AWSManagedRulesKnownBadInputsRuleSet
        Priority: 2
        OverrideAction:
          None: {}
        Statement:
          ManagedRuleGroupStatement:
            VendorName: AWS
            Name: AWSManagedRulesKnownBadInputsRuleSet
        VisibilityConfig:
          SampledRequestsEnabled: true
          CloudWatchMetricsEnabled: true
          MetricName: KnownBadInputsRuleSetMetric
```

## アプリケーションセキュリティ

### 入力検証

```typescript
import { z } from 'zod';

// 入力検証スキーマ
const CreateCaseSchema = z.object({
  name: z.string()
    .min(1, 'ケース名は必須です')
    .max(100, 'ケース名は100文字以内で入力してください')
    .regex(/^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\s\-_]+$/, '無効な文字が含まれています'),
  caseNumber: z.string()
    .max(50, 'ケース番号は50文字以内で入力してください')
    .optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  categoryId: z.string().uuid('無効なカテゴリIDです')
});

// 入力検証ミドルウェア
const validateInput = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            message: '入力値が無効です',
            details: error.errors
          }
        });
      } else {
        next(error);
      }
    }
  };
};
```

### SQLインジェクション対策

```typescript
// パラメータ化クエリの使用
const getCaseById = async (caseId: string): Promise<Case | null> => {
  const params = {
    TableName: 'Cases',
    Key: {
      PK: `CASE#${caseId}`,
      SK: 'METADATA'
    }
  };

  const result = await dynamodb.get(params).promise();
  return result.Item as Case | null;
};

// 入力値のサニタイゼーション
const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // HTMLタグを除去
    .replace(/['"]/g, '') // クォートを除去
    .replace(/[;]/g, '')  // セミコロンを除去
    .trim();
};
```

### XSS対策

```typescript
import DOMPurify from 'isomorphic-dompurify';

// XSS対策
const sanitizeHTML = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
};

// ReactコンポーネントでのXSS対策
const SafeHTML = ({ content }: { content: string }) => {
  const sanitizedContent = sanitizeHTML(content);
  return <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
};
```

### CSRF対策

```typescript
import csrf from 'csurf';

// CSRFトークン生成
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// CSRFトークン検証
app.use(csrfProtection);

// フロントエンドでのCSRFトークン使用
const getCSRFToken = (): string => {
  const token = document.querySelector('meta[name="csrf-token"]');
  return token ? token.getAttribute('content') || '' : '';
};
```

## インフラストラクチャセキュリティ

### IAMポリシー

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:123456789012:table/Cases",
        "arn:aws:dynamodb:us-east-1:123456789012:table/Cases/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:us-east-1:123456789012:log-group:/aws/lambda/legalflow3-*"
    }
  ]
}
```

### セキュリティグループ

```yaml
# Lambda関数用セキュリティグループ
LambdaSecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: Security group for Lambda functions
    VpcId: !Ref VPC
    SecurityGroupEgress:
      - IpProtocol: tcp
        FromPort: 443
        ToPort: 443
        CidrIp: 0.0.0.0/0
        Description: HTTPS outbound
      - IpProtocol: tcp
        FromPort: 5432
        ToPort: 5432
        SourceSecurityGroupId: !Ref DatabaseSecurityGroup
        Description: Database access
```

### 暗号化キー管理

```yaml
# KMSキー
EncryptionKey:
  Type: AWS::KMS::Key
  Properties:
    Description: LegalFlow3 encryption key
    KeyPolicy:
      Statement:
        - Sid: Enable IAM User Permissions
          Effect: Allow
          Principal:
            AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
          Action: 'kms:*'
          Resource: '*'
        - Sid: Allow Lambda functions
          Effect: Allow
          Principal:
            AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:role/legalflow3-lambda-role'
          Action:
            - kms:Encrypt
            - kms:Decrypt
            - kms:ReEncrypt*
            - kms:GenerateDataKey*
            - kms:DescribeKey
          Resource: '*'
```

## 監視・ログ

### CloudWatch監視

```yaml
# セキュリティアラーム
SecurityAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: LegalFlow3-Security-Alarm
    AlarmDescription: Security events alarm
    MetricName: SecurityEvents
    Namespace: LegalFlow3/Security
    Statistic: Sum
    Period: 300
    EvaluationPeriods: 1
    Threshold: 1
    ComparisonOperator: GreaterThanOrEqualToThreshold
    AlarmActions:
      - !Ref SecuritySNSTopic
```

### セキュリティログ

```typescript
// セキュリティイベントログ
interface SecurityEvent {
  timestamp: string;
  eventType: 'AUTH_FAILURE' | 'AUTH_SUCCESS' | 'UNAUTHORIZED_ACCESS' | 'DATA_BREACH';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  resource: string;
  details: Record<string, any>;
}

const logSecurityEvent = (event: SecurityEvent) => {
  console.log(JSON.stringify({
    ...event,
    timestamp: new Date().toISOString(),
    source: 'legalflow3-security'
  }));
};

// 認証失敗ログ
const logAuthFailure = (email: string, ipAddress: string, reason: string) => {
  logSecurityEvent({
    eventType: 'AUTH_FAILURE',
    ipAddress,
    userAgent: req.headers['user-agent'] || '',
    resource: 'authentication',
    details: { email, reason }
  });
};
```

### セキュリティ監視

```typescript
// 異常なアクセスパターンの検出
const detectAnomalousAccess = (userId: string, ipAddress: string) => {
  // 過去24時間のアクセス回数を確認
  const accessCount = getAccessCount(userId, ipAddress, 24);

  if (accessCount > 100) {
    logSecurityEvent({
      eventType: 'UNAUTHORIZED_ACCESS',
      userId,
      ipAddress,
      userAgent: req.headers['user-agent'] || '',
      resource: 'application',
      details: { accessCount, threshold: 100 }
    });
  }
};
```

## インシデント対応

### インシデント分類

| レベル | 説明 | 対応時間 | エスカレーション |
|--------|------|----------|------------------|
| P1 | システムダウン、データ漏洩 | 15分 | 即座 |
| P2 | セキュリティ侵害、サービス停止 | 1時間 | 30分以内 |
| P3 | パフォーマンス問題、機能障害 | 4時間 | 2時間以内 |
| P4 | 軽微な問題 | 24時間 | 8時間以内 |

### インシデント対応手順

#### 1. 検出・報告

```bash
# セキュリティイベントの検出
aws logs filter-log-events \
  --log-group-name /aws/lambda/legalflow3-security \
  --filter-pattern "ERROR" \
  --start-time 1640995200000 \
  --region us-east-1

# アラートの送信
aws sns publish \
  --topic-arn arn:aws:sns:us-east-1:123456789012:legalflow3-security-alerts \
  --message "Security incident detected" \
  --region us-east-1
```

#### 2. 初期対応

```bash
# 影響範囲の特定
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name TargetResponseTime \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 300 \
  --statistics Average

# 緊急対応の実施
aws s3 cp maintenance.html s3://legalflow3-frontend-prod/index.html
```

#### 3. 復旧作業

```bash
# バックアップからの復元
aws dynamodb restore-table-from-backup \
  --target-table-name Cases-restored \
  --backup-arn arn:aws:dynamodb:us-east-1:123456789012:table/Cases/backup/12345678-1234-1234-1234-123456789012 \
  --region us-east-1

# システムの復旧確認
curl -I https://legalflow3.com/health
```

### インシデント報告書

```markdown
# セキュリティインシデント報告書

## 基本情報
- インシデントID: INC-2024-001
- 発生日時: 2024-01-01 10:00:00 JST
- 発見者: システム監視
- 報告者: セキュリティチーム

## 概要
- 影響範囲: 認証システム
- 影響度: P2
- ステータス: 解決済み

## 詳細
- 原因: 認証トークンの検証エラー
- 影響: ユーザーがログインできない
- 対応: 認証システムの再起動

## 対策
- 根本原因の修正
- 監視の強化
- 手順書の更新
```

## コンプライアンス

### 個人情報保護法対応

```typescript
// 個人情報の取り扱い
interface PersonalData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 個人情報の暗号化
const encryptPersonalData = (data: PersonalData): PersonalData => {
  return {
    ...data,
    email: encryptSensitiveData(data.email, process.env.ENCRYPTION_KEY),
    phone: data.phone ? encryptSensitiveData(data.phone, process.env.ENCRYPTION_KEY) : undefined,
    address: data.address ? encryptSensitiveData(data.address, process.env.ENCRYPTION_KEY) : undefined
  };
};

// 個人情報の削除
const deletePersonalData = async (userId: string): Promise<void> => {
  // 関連するすべてのデータを削除
  await Promise.all([
    deleteUserData(userId),
    deleteCaseData(userId),
    deleteTimesheetData(userId)
  ]);
};
```

### 監査ログ

```typescript
// 監査ログの記録
interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
}

const logAuditEvent = (userId: string, action: string, resource: string, details: Record<string, any>) => {
  const auditLog: AuditLog = {
    id: generateId(),
    timestamp: new Date(),
    userId,
    action,
    resource,
    details,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'] || ''
  };

  // 監査ログを保存
  saveAuditLog(auditLog);
};
```

## セキュリティテスト

### 脆弱性スキャン

```bash
# OWASP ZAPを使用した脆弱性スキャン
docker run -t owasp/zap2docker-stable zap-baseline.py -t https://legalflow3.com

# npm auditを使用した依存関係の脆弱性チェック
cd frontend
npm audit
npm audit fix

# Snykを使用したセキュリティスキャン
npx snyk test
npx snyk monitor
```

### ペネトレーションテスト

```bash
# Nmapを使用したポートスキャン
nmap -sS -O legalflow3.com

# Niktoを使用したWebアプリケーションスキャン
nikto -h https://legalflow3.com

# SQLMapを使用したSQLインジェクションテスト
sqlmap -u "https://api.legalflow3.com/graphql" --data="query=test" --batch
```

### セキュリティテスト自動化

```yaml
# GitHub Actionsでのセキュリティテスト
name: Security Tests
on: [push, pull_request]
jobs:
  security-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run npm audit
        run: npm audit --audit-level high
      - name: Run Snyk
        run: npx snyk test
      - name: Run OWASP ZAP
        run: |
          docker run -t owasp/zap2docker-stable zap-baseline.py -t ${{ secrets.TARGET_URL }}
```

## セキュリティ教育

### 開発者向け教育

1. **セキュアコーディング研修**
   - OWASP Top 10
   - セキュアコーディングガイドライン
   - コードレビューのポイント

2. **セキュリティテスト研修**
   - 脆弱性の種類と対策
   - テストツールの使用方法
   - インシデント対応手順

### ユーザー向け教育

1. **パスワード管理**
   - 強力なパスワードの作成
   - パスワードマネージャーの使用
   - 二要素認証の設定

2. **フィッシング対策**
   - 疑わしいメールの見分け方
   - 安全なWebサイトの見分け方
   - 個人情報の保護

## まとめ

このセキュリティガイドに従うことで、LegalFlow3システムのセキュリティを確保できます。定期的な見直しと更新を行い、新しい脅威に対応してください。

### 参考資料

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [AWS Security Best Practices](https://aws.amazon.com/security/security-resources/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [個人情報保護法](https://www.ppc.go.jp/)

### 連絡先

- **セキュリティチーム**: security@legalflow3.com
- **緊急時連絡先**: +81-3-1234-5678
- **インシデント報告**: incident@legalflow3.com
