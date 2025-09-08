import { PostAuthenticationTriggerEvent, PostAuthenticationTriggerHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler: PostAuthenticationTriggerHandler = async (event) => {
  const { userAttributes, userName } = event.request;

  try {
    const currentTime = new Date().toISOString();

    // ログイン時刻を更新
    await docClient.send(new UpdateCommand({
      TableName: process.env.USERS_TABLE,
      Key: {
        PK: `USER#${userName}`,
        SK: 'METADATA'
      },
      UpdateExpression: 'SET lastLoginAt = :loginTime, updatedAt = :updateTime, failedLoginAttempts = :zero',
      ExpressionAttributeValues: {
        ':loginTime': currentTime,
        ':updateTime': currentTime,
        ':zero': 0
      }
    }));

    // ログイン履歴を記録
    await docClient.send(new PutCommand({
      TableName: process.env.USERS_TABLE,
      Item: {
        PK: `USER#${userName}`,
        SK: `LOGIN#${currentTime}`,
        loginTime: currentTime,
        ipAddress: event.request.userContext?.ipAddress || 'unknown',
        userAgent: event.request.userContext?.userAgent || 'unknown',
        deviceType: detectDeviceType(event.request.userContext?.userAgent || ''),
        location: event.request.userContext?.location || 'unknown'
      }
    }));

    // セッション情報を更新
    event.response.claimsOverrideDetails = {
      claimsToAddOrOverride: {
        'custom:lastLoginAt': currentTime,
        'custom:loginCount': await getLoginCount(userName)
      }
    };

    console.log(`Post-authentication successful for user: ${userName}`);

  } catch (error) {
    console.error('Post-authentication error:', error);
    // エラーが発生してもログインは継続
  }

  return event;
};

function detectDeviceType(userAgent: string): string {
  if (userAgent.includes('Mobile')) {
    return 'mobile';
  } else if (userAgent.includes('Tablet')) {
    return 'tablet';
  } else {
    return 'desktop';
  }
}

async function getLoginCount(userName: string): Promise<number> {
  try {
    // 過去30日間のログイン回数を取得
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 簡略化された実装（実際はQueryを使用）
    return 1;
  } catch (error) {
    console.error('Error getting login count:', error);
    return 1;
  }
}
