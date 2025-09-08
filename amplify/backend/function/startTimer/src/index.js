const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const { input } = event.arguments;
    const { user } = event.identity;
    const timerId = uuidv4();
    const currentTime = new Date().toISOString();

    // 既存のアクティブタイマーを停止
    await stopAllUserTimers(user.sub);

    const timerItem = {
      PK: `TIMER#${user.sub}`,
      SK: `ACTIVE#${timerId}`,
      id: timerId,
      userId: user.sub,
      caseId: input.caseId || null,
      taskId: input.taskId || null,
      status: 'RUNNING',
      startTime: currentTime,
      pausedAt: null,
      totalPausedTime: 0,
      currentSessionTime: 0,
      totalTime: 0,
      description: input.description,
      lastUpdated: currentTime,
      createdAt: currentTime,
      isActive: true
    };

    await docClient.send(new PutCommand({
      TableName: process.env.TIMERS_TABLE,
      Item: timerItem
    }));

    // 監査ログ
    await logAuditEvent({
      action: 'START_TIMER',
      resource: `TIMER#${timerId}`,
      userId: user.sub,
      details: {
        timerId,
        caseId: input.caseId,
        taskId: input.taskId,
        description: input.description
      }
    });

    return {
      success: true,
      timer: timerItem,
      error: null
    };

  } catch (error) {
    console.error('Error starting timer:', error);

    // エラーログ
    await logError({
      action: 'START_TIMER',
      error: error.message,
      stack: error.stack,
      userId: event.identity?.user?.sub
    });

    return {
      success: false,
      timer: null,
      error: {
        message: 'Failed to start timer',
        code: 'INTERNAL_ERROR'
      }
    };
  }
};

// ユーザーのすべてのアクティブタイマーを停止
async function stopAllUserTimers(userId) {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: process.env.TIMERS_TABLE,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `TIMER#${userId}`
      },
      FilterExpression: 'isActive = :isActive',
      ExpressionAttributeValues: {
        ':isActive': true
      }
    }));

    for (const timer of result.Items || []) {
      const updatedTimer = {
        ...timer,
        status: 'STOPPED',
        isActive: false,
        lastUpdated: new Date().toISOString()
      };

      await docClient.send(new PutCommand({
        TableName: process.env.TIMERS_TABLE,
        Item: updatedTimer
      }));
    }
  } catch (error) {
    console.error('Error stopping all user timers:', error);
  }
}

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
