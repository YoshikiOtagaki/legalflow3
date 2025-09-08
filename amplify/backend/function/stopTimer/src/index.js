const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const { id, saveEntry = true } = event.arguments;
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

    if (!existingTimer.Item) {
      return {
        success: false,
        timer: null,
        entry: null,
        error: {
          message: 'Timer not found',
          code: 'NOT_FOUND'
        }
      };
    }

    // タイマーを停止
    const updatedTimer = {
      ...existingTimer.Item,
      status: 'STOPPED',
      lastUpdated: currentTime,
      isActive: false
    };

    // 実行中のタイマーの場合、現在の時間を更新
    if (existingTimer.Item.status === 'RUNNING') {
      const now = new Date();
      const startTime = new Date(existingTimer.Item.startTime);
      updatedTimer.currentSessionTime = now.getTime() - startTime.getTime();
      updatedTimer.totalTime += updatedTimer.currentSessionTime;
    }

    await docClient.send(new PutCommand({
      TableName: process.env.TIMERS_TABLE,
      Item: updatedTimer
    }));

    let timesheetEntry = null;

    // タイムシートエントリを保存
    if (saveEntry && updatedTimer.totalTime > 0) {
      const startTime = new Date(updatedTimer.startTime);
      const endTime = new Date(startTime.getTime() + updatedTimer.totalTime);
      const duration = Math.round(updatedTimer.totalTime / (1000 * 60));

      const entryId = uuidv4();
      const entryItem = {
        PK: `TIMESHEET#${user.sub}`,
        SK: `ENTRY#${updatedTimer.startTime}#${entryId}`,
        id: entryId,
        caseId: updatedTimer.caseId,
        userId: user.sub,
        taskId: updatedTimer.taskId,
        startTime: updatedTimer.startTime,
        endTime: endTime.toISOString(),
        duration: duration,
        description: updatedTimer.description,
        category: null,
        billable: true,
        hourlyRate: null,
        totalAmount: 0,
        isActive: true,
        createdAt: currentTime,
        updatedAt: currentTime,
        createdBy: user.sub,
        updatedBy: user.sub,
        // GSI用の属性
        GSI1PK: updatedTimer.caseId ? `CASE#${updatedTimer.caseId}` : null,
        GSI1SK: updatedTimer.caseId ? `ENTRY#${updatedTimer.startTime}` : null,
        GSI2PK: `DATE#${updatedTimer.startTime.split('T')[0]}`,
        GSI2SK: `USER#${user.sub}#${updatedTimer.startTime}`,
        GSI3PK: updatedTimer.taskId ? `TASK#${updatedTimer.taskId}` : null,
        GSI3SK: updatedTimer.taskId ? `ENTRY#${updatedTimer.startTime}` : null
      };

      await docClient.send(new PutCommand({
        TableName: process.env.TIMESHEET_ENTRIES_TABLE,
        Item: entryItem
      }));

      timesheetEntry = entryItem;
    }

    // 監査ログ
    await logAuditEvent({
      action: 'STOP_TIMER',
      resource: `TIMER#${id}`,
      userId: user.sub,
      details: {
        timerId: id,
        totalTime: updatedTimer.totalTime,
        duration: Math.round(updatedTimer.totalTime / (1000 * 60)),
        savedEntry: !!timesheetEntry
      }
    });

    return {
      success: true,
      timer: updatedTimer,
      entry: timesheetEntry,
      error: null
    };

  } catch (error) {
    console.error('Error stopping timer:', error);

    // エラーログ
    await logError({
      action: 'STOP_TIMER',
      error: error.message,
      stack: error.stack,
      userId: event.identity?.user?.sub,
      timerId: event.arguments?.id
    });

    return {
      success: false,
      timer: null,
      entry: null,
      error: {
        message: 'Failed to stop timer',
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
