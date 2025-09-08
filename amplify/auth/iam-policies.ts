import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';

// 基本的なDynamoDBアクセスポリシー
export const dynamoDBPolicy = new PolicyStatement({
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
});

// S3アクセスポリシー
export const s3Policy = new PolicyStatement({
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
});

// CloudWatch Logsポリシー
export const cloudWatchLogsPolicy = new PolicyStatement({
  effect: Effect.ALLOW,
  actions: [
    'logs:CreateLogGroup',
    'logs:CreateLogStream',
    'logs:PutLogEvents',
    'logs:DescribeLogGroups',
    'logs:DescribeLogStreams'
  ],
  resources: [
    'arn:aws:logs:*:*:log-group:/aws/lambda/legalflow3-*',
    'arn:aws:logs:*:*:log-group:/aws/lambda/legalflow3-*:*'
  ]
});

// SESポリシー（メール送信用）
export const sesPolicy = new PolicyStatement({
  effect: Effect.ALLOW,
  actions: [
    'ses:SendEmail',
    'ses:SendRawEmail'
  ],
  resources: [
    'arn:aws:ses:*:*:identity/*'
  ]
});

// SNSポリシー（通知用）
export const snsPolicy = new PolicyStatement({
  effect: Effect.ALLOW,
  actions: [
    'sns:Publish',
    'sns:CreateTopic',
    'sns:Subscribe'
  ],
  resources: [
    'arn:aws:sns:*:*:legalflow3-*'
  ]
});

// 管理者用フルアクセスポリシー
export const adminFullAccessPolicy = new PolicyStatement({
  effect: Effect.ALLOW,
  actions: ['*'],
  resources: ['*']
});

// 弁護士用ポリシー
export const lawyerPolicy = new PolicyStatement({
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
});

// パラリーガル用ポリシー
export const paralegalPolicy = new PolicyStatement({
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
});

// クライアント用読み取り専用ポリシー
export const clientReadOnlyPolicy = new PolicyStatement({
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
});

// ケース管理用ポリシー
export const caseManagementPolicy = new PolicyStatement({
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
    'arn:aws:dynamodb:*:*:table/Cases/index/*'
  ]
});

// 当事者管理用ポリシー
export const partyManagementPolicy = new PolicyStatement({
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
    'arn:aws:dynamodb:*:*:table/Parties',
    'arn:aws:dynamodb:*:*:table/Parties/index/*'
  ]
});

// タスク管理用ポリシー
export const taskManagementPolicy = new PolicyStatement({
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
    'arn:aws:dynamodb:*:*:table/Tasks',
    'arn:aws:dynamodb:*:*:table/Tasks/index/*'
  ]
});

// タイムシート管理用ポリシー
export const timesheetManagementPolicy = new PolicyStatement({
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
    'arn:aws:dynamodb:*:*:table/TimesheetEntries',
    'arn:aws:dynamodb:*:*:table/TimesheetEntries/index/*'
  ]
});

// ユーザー管理用ポリシー
export const userManagementPolicy = new PolicyStatement({
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
    'arn:aws:dynamodb:*:*:table/Users',
    'arn:aws:dynamodb:*:*:table/Users/index/*'
  ]
});

// ファイル管理用ポリシー
export const fileManagementPolicy = new PolicyStatement({
  effect: Effect.ALLOW,
  actions: [
    's3:GetObject',
    's3:PutObject',
    's3:DeleteObject',
    's3:ListBucket'
  ],
  resources: [
    'arn:aws:s3:::legalflow3-documents',
    'arn:aws:s3:::legalflow3-documents/*'
  ]
});

// 通知送信用ポリシー
export const notificationPolicy = new PolicyStatement({
  effect: Effect.ALLOW,
  actions: [
    'sns:Publish',
    'ses:SendEmail'
  ],
  resources: [
    'arn:aws:sns:*:*:legalflow3-*',
    'arn:aws:ses:*:*:identity/*'
  ]
});

// 監査ログ用ポリシー
export const auditLogPolicy = new PolicyStatement({
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
});

// 権限チェック用ポリシー
export const permissionCheckPolicy = new PolicyStatement({
  effect: Effect.ALLOW,
  actions: [
    'dynamodb:GetItem',
    'dynamodb:Query'
  ],
  resources: [
    'arn:aws:dynamodb:*:*:table/Users',
    'arn:aws:dynamodb:*:*:table/Users/index/*'
  ]
});

// ロールベースアクセス制御用のポリシーセット
export const roleBasedPolicies = {
  ADMIN: [
    adminFullAccessPolicy,
    dynamoDBPolicy,
    s3Policy,
    cloudWatchLogsPolicy,
    sesPolicy,
    snsPolicy,
    auditLogPolicy
  ],
  LAWYER: [
    lawyerPolicy,
    caseManagementPolicy,
    partyManagementPolicy,
    taskManagementPolicy,
    timesheetManagementPolicy,
    fileManagementPolicy,
    notificationPolicy,
    cloudWatchLogsPolicy,
    auditLogPolicy
  ],
  PARALEGAL: [
    paralegalPolicy,
    taskManagementPolicy,
    timesheetManagementPolicy,
    fileManagementPolicy,
    cloudWatchLogsPolicy,
    auditLogPolicy
  ],
  CLIENT: [
    clientReadOnlyPolicy,
    fileManagementPolicy,
    cloudWatchLogsPolicy
  ]
};

// リソースベースアクセス制御用のポリシー
export const resourceBasedPolicies = {
  CASES: caseManagementPolicy,
  PARTIES: partyManagementPolicy,
  TASKS: taskManagementPolicy,
  TIMESHEETS: timesheetManagementPolicy,
  USERS: userManagementPolicy,
  FILES: fileManagementPolicy
};
