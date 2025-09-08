const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const { id } = event.arguments;
    const { user } = event.identity;
    const currentTime = new Date().toISOString();

    // 既存のタイマーを取得
    const existingTimer = await docClient.send(new GetCommand({
      TableName: process.env.TIMERS_TABLE,
      Key: {
        PK: `TIMER#${user.sub}`,
        SK: `ACTIVE#${id}`
      }
    }));

    if (!existingTimer.Item || existingTimer.Item.status !== 'PAUSED') {
      return {
        success: false,
        timer: null,
        error: {
          message: 'Timer not found or not paused',
          code: 'NOT_FOUND'
        }
      };
    }

    // タイマーを再開
    const now = new Date();
    const pausedAt = new Date(existingTimer.Item.pausedAt);
    const pausedDuration = now.getTime() - pausedAt.getTime();

    const updatedTimer = {
      ...existingTimer.Item,
      status: 'RUNNING',
      startTime: new Date(now.getTime() - existingTimer.Item.currentSessionTime).toISOString(),
      totalPausedTime: existingTimer.Item.totalPausedTime + pausedDuration,
      pausedAt: null,
      lastUpdated: currentTime
    };

    await docClient.send(new PutCommand({
      TableName: process.env.TIMERS_TABLE,
      Item: updatedTimer
    }));

    // 監査ログ
    await logAuditEvent({
      action: 'RESUME_TIMER',
      resource: `TIMER#${id}`,
      userId: user.sub,
      details: {
        timerId: id,
        pausedDuration,
        totalPausedTime: updatedTimer.totalPausedTime
      }
    });

    return {
      success: true,
      timer: updatedTimer,
      error: null
    };

  } catch (error) {
    console.error('Error resuming timer:', error);

    // エラーログ
    await logError({
      action: 'RESUME_TIMER',
      error: error.message,
      stack: error.stack,
      userId: event.identity?.user?.sub,
      timerId: event.arguments?.id
    });

    return {
      success: false,
      timer: null,
      error: {
        message: 'Failed to resume timer',
        code: 'INTERNAL_ERROR'
      }
    };
  }
};

// 監査ログ記録
async function logAuditEvent(event) {
  try {
    await docClient.send(new PutCommand({
      TableName: process.env.AUDIT_LOGS_TABLE,
      Item: {
        PK: `AUDIT#${new Date().toISOString()}`,
        SK: `EVENT#${event.action}`,
        ...event,
        timestamp: new Date().toISOString()
      }
    }));
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
}

// エラーログ記録
async function logError(event) {
  try {
    await docClient.send(new PutCommand({
      TableName: process.env.ERROR_LOGS_TABLE,
      Item: {
        PK: `ERROR#${new Date().toISOString()}`,
        SK: `EVENT#${event.action}`,
        ...event,
        timestamp: new Date().toISOString()
      }
    }));
  } catch (error) {
    console.error('Error logging error event:', error);
  }
}
