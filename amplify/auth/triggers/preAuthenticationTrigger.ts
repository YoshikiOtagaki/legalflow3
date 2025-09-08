import { PreAuthenticationTriggerEvent, PreAuthenticationTriggerHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler: PreAuthenticationTriggerHandler = async (event) => {
  const { userAttributes, userName } = event.request;

  try {
    // ユーザーのアクティブ状態を確認
    const userData = await docClient.send(new GetCommand({
      TableName: process.env.USERS_TABLE,
      Key: {
        PK: `USER#${userName}`,
        SK: 'METADATA'
      }
    }));

    if (!userData.Item) {
      throw new Error('ユーザーが見つかりません');
    }

    // アカウントがアクティブかチェック
    if (!userData.Item.isActive) {
      throw new Error('アカウントが無効化されています。管理者にお問い合わせください。');
    }

    // アカウントロックアウトのチェック
    const lockoutUntil = userData.Item.lockoutUntil;
    if (lockoutUntil && new Date(lockoutUntil) > new Date()) {
      throw new Error(`アカウントがロックされています。ロック解除時刻: ${lockoutUntil}`);
    }

    // ログイン試行回数のチェック
    const failedLoginAttempts = userData.Item.failedLoginAttempts || 0;
    if (failedLoginAttempts >= 5) {
      // アカウントを一時的にロック
      const lockoutTime = new Date();
      lockoutTime.setMinutes(lockoutTime.getMinutes() + 30);

      await docClient.send(new PutCommand({
        TableName: process.env.USERS_TABLE,
        Key: {
          PK: `USER#${userName}`,
          SK: 'METADATA'
        },
        UpdateExpression: 'SET lockoutUntil = :lockoutTime, failedLoginAttempts = :attempts',
        ExpressionAttributeValues: {
          ':lockoutTime': lockoutTime.toISOString(),
          ':attempts': 0
        }
      }));

      throw new Error('ログイン試行回数が上限に達しました。30分後に再試行してください。');
    }

    // IPアドレスの制限チェック（オプション）
    const clientIp = event.request.userContext?.ipAddress;
    if (clientIp && process.env.ALLOWED_IP_RANGES) {
      const allowedRanges = process.env.ALLOWED_IP_RANGES.split(',');
      const isAllowed = allowedRanges.some(range => isIPInRange(clientIp, range.trim()));

      if (!isAllowed) {
        throw new Error('許可されていないIPアドレスからのアクセスです');
      }
    }

    console.log(`Pre-authentication successful for user: ${userName}`);

  } catch (error) {
    console.error('Pre-authentication error:', error);
    throw error;
  }

  return event;
};

function isIPInRange(ip: string, range: string): boolean {
  // 簡単なIP範囲チェック（実装は簡略化）
  if (range.includes('/')) {
    // CIDR記法の処理
    return checkCIDR(ip, range);
  } else if (range.includes('-')) {
    // IP範囲の処理
    return checkIPRange(ip, range);
  } else {
    // 単一IPの処理
    return ip === range;
  }
}

function checkCIDR(ip: string, cidr: string): boolean {
  // CIDR記法のチェック（簡略化）
  return true; // 実装は後で追加
}

function checkIPRange(ip: string, range: string): boolean {
  // IP範囲のチェック（簡略化）
  return true; // 実装は後で追加
}
