const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const { filter } = event.arguments;
    const { userId, caseId, startDate, endDate, period } = filter;

    // 統計を計算
    const stats = await calculateTimesheetStats(userId, caseId, startDate, endDate, period);

    // 監査ログ
    await logAuditEvent({
      action: 'GET_TIMESHEET_STATS',
      resource: 'TIMESHEET_STATS',
      userId: event.identity?.user?.sub,
      details: {
        userId,
        caseId,
        startDate,
        endDate,
        period
      }
    });

    return {
      success: true,
      stats,
      error: null
    };

  } catch (error) {
    console.error('Error getting timesheet stats:', error);

    // エラーログ
    await logError({
      action: 'GET_TIMESHEET_STATS',
      error: error.message,
      stack: error.stack,
      userId: event.identity?.user?.sub
    });

    return {
      success: false,
      stats: null,
      error: {
        message: 'Failed to get timesheet stats',
        code: 'INTERNAL_ERROR'
      }
    };
  }
};

// タイムシート統計計算ヘルパー関数
async function calculateTimesheetStats(userId, caseId, startDate, endDate, period) {
  try {
    let queryParams = {
      TableName: process.env.TIMESHEET_ENTRIES_TABLE,
      FilterExpression: 'SK = :sk',
      ExpressionAttributeValues: {
        ':sk': 'METADATA'
      }
    };

    const filterExpressions = ['SK = :sk'];
    const expressionAttributeValues = { ':sk': 'METADATA' };

    if (userId) {
      filterExpressions.push('userId = :userId');
      expressionAttributeValues[':userId'] = userId;
    }

    if (caseId) {
      filterExpressions.push('caseId = :caseId');
      expressionAttributeValues[':caseId'] = caseId;
    }

    if (startDate) {
      filterExpressions.push('startTime >= :startDate');
      expressionAttributeValues[':startDate'] = startDate;
    }

    if (endDate) {
      filterExpressions.push('startTime <= :endDate');
      expressionAttributeValues[':endDate'] = endDate;
    }

    queryParams.FilterExpression = filterExpressions.join(' AND ');
    queryParams.ExpressionAttributeValues = expressionAttributeValues;

    const result = await docClient.send(new ScanCommand(queryParams));
    const entries = result.Items || [];

    // 統計計算
    const totalHours = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0) / 60;
    const totalMinutes = Math.round(totalHours * 60);
    const totalSeconds = Math.round(totalHours * 3600);

    // 日別、週別、月別の時間を計算
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const dailyHours = entries
      .filter(entry => new Date(entry.startTime) >= today)
      .reduce((sum, entry) => sum + (entry.duration || 0), 0) / 60;

    const weeklyHours = entries
      .filter(entry => new Date(entry.startTime) >= weekStart)
      .reduce((sum, entry) => sum + (entry.duration || 0), 0) / 60;

    const monthlyHours = entries
      .filter(entry => new Date(entry.startTime) >= monthStart)
      .reduce((sum, entry) => sum + (entry.duration || 0), 0) / 60;

    // ケース別の時間を計算
    const caseHours = {};
    entries.forEach(entry => {
      if (entry.caseId) {
        caseHours[entry.caseId] = (caseHours[entry.caseId] || 0) + (entry.duration || 0) / 60;
      }
    });

    // タスク別の時間を計算
    const taskHours = {};
    entries.forEach(entry => {
      if (entry.taskId) {
        taskHours[entry.taskId] = (taskHours[entry.taskId] || 0) + (entry.duration || 0) / 60;
      }
    });

    // 平均セッション時間を計算
    const averageSessionLength = entries.length > 0 ? totalHours / entries.length : 0;

    return {
      id: `stats_${userId || 'all'}_${caseId || 'all'}_${period || 'custom'}`,
      userId,
      caseId,
      period: period || 'CUSTOM',
      periodValue: startDate && endDate ? `${startDate}_${endDate}` : 'all',
      totalHours: Math.round(totalHours * 100) / 100,
      totalMinutes,
      totalSeconds,
      dailyHours: Math.round(dailyHours * 100) / 100,
      weeklyHours: Math.round(weeklyHours * 100) / 100,
      monthlyHours: Math.round(monthlyHours * 100) / 100,
      caseHours: JSON.stringify(caseHours),
      taskHours: JSON.stringify(taskHours),
      averageSessionLength: Math.round(averageSessionLength * 100) / 100,
      totalSessions: entries.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error calculating timesheet stats:', error);
    throw error;
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
