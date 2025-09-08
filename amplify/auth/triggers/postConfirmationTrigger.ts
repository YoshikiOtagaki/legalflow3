import { PostConfirmationTriggerEvent, PostConfirmationTriggerHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler: PostConfirmationTriggerHandler = async (event) => {
  const { userAttributes, userName } = event.request;

  try {
    // ユーザー情報をDynamoDBに保存
    const userData = {
      PK: `USER#${userName}`,
      SK: 'METADATA',
      id: userName,
      email: userAttributes.email,
      firstName: userAttributes.given_name,
      lastName: userAttributes.family_name,
      phoneNumber: userAttributes.phone_number || null,
      role: userAttributes['custom:role'],
      lawFirmId: userAttributes['custom:lawFirmId'] || null,
      position: userAttributes['custom:position'] || null,
      barNumber: userAttributes['custom:barNumber'] || null,
      isActive: userAttributes['custom:isActive'] === 'true',
      preferredLanguage: userAttributes['custom:preferredLanguage'] || 'ja',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null,
      emailVerified: userAttributes.email_verified === 'true',
      phoneVerified: userAttributes.phone_number_verified === 'true'
    };

    await docClient.send(new PutCommand({
      TableName: process.env.USERS_TABLE,
      Item: userData
    }));

    // 役職に応じたデフォルト権限を設定
    const defaultPermissions = getDefaultPermissions(userAttributes['custom:role']);

    if (defaultPermissions.length > 0) {
      const permissionData = {
        PK: `USER#${userName}`,
        SK: 'PERMISSIONS',
        permissions: defaultPermissions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await docClient.send(new PutCommand({
        TableName: process.env.USERS_TABLE,
        Item: permissionData
      }));
    }

    // ウェルカムメール送信（オプション）
    if (process.env.SEND_WELCOME_EMAIL === 'true') {
      await sendWelcomeEmail(userAttributes.email, userAttributes.given_name);
    }

    console.log(`User ${userName} created successfully`);

  } catch (error) {
    console.error('Error in postConfirmation trigger:', error);
    throw error;
  }

  return event;
};

function getDefaultPermissions(role: string): string[] {
  const permissionMap: Record<string, string[]> = {
    'ADMIN': [
      'cases:create',
      'cases:read',
      'cases:update',
      'cases:delete',
      'cases:list',
      'cases:search',
      'users:create',
      'users:read',
      'users:update',
      'users:delete',
      'users:list',
      'parties:create',
      'parties:read',
      'parties:update',
      'parties:delete',
      'parties:list',
      'tasks:create',
      'tasks:read',
      'tasks:update',
      'tasks:delete',
      'tasks:list',
      'timesheet:create',
      'timesheet:read',
      'timesheet:update',
      'timesheet:delete',
      'timesheet:list',
      'system:admin'
    ],
    'LAWYER': [
      'cases:create',
      'cases:read',
      'cases:update',
      'cases:list',
      'cases:search',
      'parties:create',
      'parties:read',
      'parties:update',
      'parties:list',
      'tasks:create',
      'tasks:read',
      'tasks:update',
      'tasks:list',
      'timesheet:create',
      'timesheet:read',
      'timesheet:update',
      'timesheet:list'
    ],
    'PARALEGAL': [
      'cases:read',
      'cases:list',
      'cases:search',
      'parties:create',
      'parties:read',
      'parties:update',
      'parties:list',
      'tasks:create',
      'tasks:read',
      'tasks:update',
      'tasks:list',
      'timesheet:create',
      'timesheet:read',
      'timesheet:update',
      'timesheet:list'
    ],
    'CLIENT': [
      'cases:read',
      'cases:list',
      'tasks:read',
      'tasks:list'
    ]
  };

  return permissionMap[role] || [];
}

async function sendWelcomeEmail(email: string, firstName: string): Promise<void> {
  // SESを使用してウェルカムメールを送信
  // 実装は後で追加
  console.log(`Welcome email sent to ${email} for ${firstName}`);
}
