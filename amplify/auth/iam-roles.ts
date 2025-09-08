import { Role, ServicePrincipal, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

// Lambda実行用ロール
export const createLambdaExecutionRole = (scope: Construct): Role => {
  const role = new Role(scope, 'LegalFlow3LambdaExecutionRole', {
    assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    description: 'LegalFlow3 Lambda functions execution role',
    managedPolicies: [
      {
        managedPolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      }
    ]
  });

  // DynamoDBアクセス権限
  role.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'dynamodb:GetItem',
      'dynamodb:PutItem',
      'dynamodb:UpdateItem',
      'dynamodb:DeleteItem',
      'dynamodb:Query',
      'dynamodb:Scan',
      'dynamodb:BatchGetItem',
      'dynamodb:BatchWriteItem'
    ],
    resources: [
      'arn:aws:dynamodb:*:*:table/Cases',
      'arn:aws:dynamodb:*:*:table/Cases/index/*',
      'arn:aws:dynamodb:*:*:table/Users',
      'arn:aws:dynamodb:*:*:table/Users/index/*',
      'arn:aws:dynamodb:*:*:table/Parties',
      'arn:aws:dynamodb:*:*:table/Parties/index/*',
      'arn:aws:dynamodb:*:*:table/Tasks',
      'arn:aws:dynamodb:*:*:table/Tasks/index/*',
      'arn:aws:dynamodb:*:*:table/TimesheetEntries',
      'arn:aws:dynamodb:*:*:table/TimesheetEntries/index/*',
      'arn:aws:dynamodb:*:*:table/Memos',
      'arn:aws:dynamodb:*:*:table/Memos/index/*'
    ]
  }));

  // S3アクセス権限
  role.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      's3:GetObject',
      's3:PutObject',
      's3:DeleteObject',
      's3:ListBucket'
    ],
    resources: [
      'arn:aws:s3:::legalflow3-documents',
      'arn:aws:s3:::legalflow3-documents/*',
      'arn:aws:s3:::legalflow3-uploads',
      'arn:aws:s3:::legalflow3-uploads/*'
    ]
  }));

  // SESアクセス権限
  role.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'ses:SendEmail',
      'ses:SendRawEmail'
    ],
    resources: ['*']
  }));

  // SNSアクセス権限
  role.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'sns:Publish'
    ],
    resources: ['arn:aws:sns:*:*:legalflow3-*']
  }));

  return role;
};

// Cognito認証用ロール
export const createCognitoAuthRole = (scope: Construct): Role => {
  const role = new Role(scope, 'LegalFlow3CognitoAuthRole', {
    assumedBy: new ServicePrincipal('cognito-identity.amazonaws.com'),
    description: 'LegalFlow3 Cognito authenticated users role'
  });

  // 基本的なDynamoDB読み取り権限
  role.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'dynamodb:GetItem',
      'dynamodb:Query'
    ],
    resources: [
      'arn:aws:dynamodb:*:*:table/Users',
      'arn:aws:dynamodb:*:*:table/Users/index/*'
    ]
  }));

  return role;
};

// Cognito未認証用ロール
export const createCognitoUnauthRole = (scope: Construct): Role => {
  const role = new Role(scope, 'LegalFlow3CognitoUnauthRole', {
    assumedBy: new ServicePrincipal('cognito-identity.amazonaws.com'),
    description: 'LegalFlow3 Cognito unauthenticated users role'
  });

  // 最小限の権限のみ
  role.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'cognito-identity:GetId',
      'cognito-identity:GetCredentialsForIdentity'
    ],
    resources: ['*']
  }));

  return role;
};

// AppSync実行用ロール
export const createAppSyncExecutionRole = (scope: Construct): Role => {
  const role = new Role(scope, 'LegalFlow3AppSyncExecutionRole', {
    assumedBy: new ServicePrincipal('appsync.amazonaws.com'),
    description: 'LegalFlow3 AppSync execution role'
  });

  // DynamoDBアクセス権限
  role.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'dynamodb:GetItem',
      'dynamodb:PutItem',
      'dynamodb:UpdateItem',
      'dynamodb:DeleteItem',
      'dynamodb:Query',
      'dynamodb:Scan'
    ],
    resources: [
      'arn:aws:dynamodb:*:*:table/Cases',
      'arn:aws:dynamodb:*:*:table/Cases/index/*',
      'arn:aws:dynamodb:*:*:table/Users',
      'arn:aws:dynamodb:*:*:table/Users/index/*',
      'arn:aws:dynamodb:*:*:table/Parties',
      'arn:aws:dynamodb:*:*:table/Parties/index/*',
      'arn:aws:dynamodb:*:*:table/Tasks',
      'arn:aws:dynamodb:*:*:table/Tasks/index/*',
      'arn:aws:dynamodb:*:*:table/TimesheetEntries',
      'arn:aws:dynamodb:*:*:table/TimesheetEntries/index/*',
      'arn:aws:dynamodb:*:*:table/Memos',
      'arn:aws:dynamodb:*:*:table/Memos/index/*'
    ]
  }));

  // Lambda呼び出し権限
  role.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'lambda:InvokeFunction'
    ],
    resources: [
      'arn:aws:lambda:*:*:function:legalflow3-*'
    ]
  }));

  return role;
};

// 管理者用ロール
export const createAdminRole = (scope: Construct): Role => {
  const role = new Role(scope, 'LegalFlow3AdminRole', {
    assumedBy: new ServicePrincipal('cognito-identity.amazonaws.com'),
    description: 'LegalFlow3 Admin role with full access'
  });

  // フルアクセス権限
  role.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['*'],
    resources: ['*']
  }));

  return role;
};

// 弁護士用ロール
export const createLawyerRole = (scope: Construct): Role => {
  const role = new Role(scope, 'LegalFlow3LawyerRole', {
    assumedBy: new ServicePrincipal('cognito-identity.amazonaws.com'),
    description: 'LegalFlow3 Lawyer role'
  });

  // ケース管理権限
  role.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'dynamodb:GetItem',
      'dynamodb:PutItem',
      'dynamodb:UpdateItem',
      'dynamodb:DeleteItem',
      'dynamodb:Query',
      'dynamodb:Scan'
    ],
    resources: [
      'arn:aws:dynamodb:*:*:table/Cases',
      'arn:aws:dynamodb:*:*:table/Cases/index/*',
      'arn:aws:dynamodb:*:*:table/Parties',
      'arn:aws:dynamodb:*:*:table/Parties/index/*',
      'arn:aws:dynamodb:*:*:table/Tasks',
      'arn:aws:dynamodb:*:*:table/Tasks/index/*',
      'arn:aws:dynamodb:*:*:table/TimesheetEntries',
      'arn:aws:dynamodb:*:*:table/TimesheetEntries/index/*'
    ]
  }));

  // S3アクセス権限
  role.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      's3:GetObject',
      's3:PutObject',
      's3:DeleteObject'
    ],
    resources: [
      'arn:aws:s3:::legalflow3-documents/*'
    ]
  }));

  return role;
};

// パラリーガル用ロール
export const createParalegalRole = (scope: Construct): Role => {
  const role = new Role(scope, 'LegalFlow3ParalegalRole', {
    assumedBy: new ServicePrincipal('cognito-identity.amazonaws.com'),
    description: 'LegalFlow3 Paralegal role'
  });

  // 読み取り権限
  role.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'dynamodb:GetItem',
      'dynamodb:Query',
      'dynamodb:Scan'
    ],
    resources: [
      'arn:aws:dynamodb:*:*:table/Cases',
      'arn:aws:dynamodb:*:*:table/Cases/index/*',
      'arn:aws:dynamodb:*:*:table/Parties',
      'arn:aws:dynamodb:*:*:table/Parties/index/*',
      'arn:aws:dynamodb:*:*:table/Tasks',
      'arn:aws:dynamodb:*:*:table/Tasks/index/*'
    ]
  }));

  // タスクとタイムシートの書き込み権限
  role.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'dynamodb:PutItem',
      'dynamodb:UpdateItem'
    ],
    resources: [
      'arn:aws:dynamodb:*:*:table/Tasks',
      'arn:aws:dynamodb:*:*:table/TimesheetEntries'
    ]
  }));

  return role;
};

// クライアント用ロール
export const createClientRole = (scope: Construct): Role => {
  const role = new Role(scope, 'LegalFlow3ClientRole', {
    assumedBy: new ServicePrincipal('cognito-identity.amazonaws.com'),
    description: 'LegalFlow3 Client role with read-only access'
  });

  // 読み取り専用権限
  role.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'dynamodb:GetItem',
      'dynamodb:Query'
    ],
    resources: [
      'arn:aws:dynamodb:*:*:table/Cases',
      'arn:aws:dynamodb:*:*:table/Cases/index/*'
    ],
    conditions: {
      'ForAllValues:StringEquals': {
        'dynamodb:Attributes': ['PK', 'SK', 'name', 'status', 'createdAt']
      }
    }
  }));

  // クライアント専用ファイルアクセス権限
  role.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      's3:GetObject'
    ],
    resources: [
      'arn:aws:s3:::legalflow3-documents/client/*'
    ]
  }));

  return role;
};

// 監査ログ用ロール
export const createAuditLogRole = (scope: Construct): Role => {
  const role = new Role(scope, 'LegalFlow3AuditLogRole', {
    assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    description: 'LegalFlow3 Audit logging role'
  });

  // CloudWatch Logs権限
  role.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'logs:CreateLogGroup',
      'logs:CreateLogStream',
      'logs:PutLogEvents'
    ],
    resources: [
      'arn:aws:logs:*:*:log-group:/aws/lambda/legalflow3-audit-*',
      'arn:aws:logs:*:*:log-group:/aws/lambda/legalflow3-audit-*:*'
    ]
  }));

  // DynamoDB読み取り権限（監査ログ用）
  role.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'dynamodb:GetItem',
      'dynamodb:Query'
    ],
    resources: [
      'arn:aws:dynamodb:*:*:table/Users',
      'arn:aws:dynamodb:*:*:table/Users/index/*'
    ]
  }));

  return role;
};

// 通知送信用ロール
export const createNotificationRole = (scope: Construct): Role => {
  const role = new Role(scope, 'LegalFlow3NotificationRole', {
    assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    description: 'LegalFlow3 Notification sending role'
  });

  // SNS権限
  role.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'sns:Publish'
    ],
    resources: [
      'arn:aws:sns:*:*:legalflow3-*'
    ]
  }));

  // SES権限
  role.addToPolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'ses:SendEmail',
      'ses:SendRawEmail'
    ],
    resources: ['*']
  }));

  return role;
};
