// タイムシート機能用クエリリゾルバー

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// タイムシートエントリ取得
exports.getTimesheetEntry = async (event) => {
  try {
    const { id } = event.arguments;

    const result = await docClient.send(new GetCommand({
      TableName: process.env.TIMESHEET_ENTRIES_TABLE,
      Key: {
        PK: `TIMESHEET#${id}`,
        SK: 'METADATA'
      }
    }));

    if (!result.Item) {
      return {
        success: false,
        entry: null,
        error: {
          message: 'Timesheet entry not found',
          code: 'NOT_FOUND'
        }
      };
    }

    return {
      success: true,
      entry: result.Item,
      error: null
    };

  } catch (error) {
    console.error('Error getting timesheet entry:', error);
    return {
      success: false,
      entry: null,
      error: {
        message: 'Failed to get timesheet entry',
        code: 'INTERNAL_ERROR'
      }
    };
  }
};

// タイムシートエントリ一覧取得
exports.listTimesheetEntries = async (event) => {
  try {
    const {
      userId,
      caseId,
      taskId,
      startDate,
      endDate,
      limit = 20,
      nextToken
    } = event.arguments;

    let queryParams = {
      TableName: process.env.TIMESHEET_ENTRIES_TABLE,
      Limit: limit
    };

    if (nextToken) {
      queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(nextToken, 'base64').toString());
    }

    // ユーザーIDが指定されている場合は、そのユーザーのエントリを取得
    if (userId) {
      queryParams.KeyConditionExpression = 'PK = :pk';
      queryParams.ExpressionAttributeValues = {
        ':pk': `TIMESHEET#${userId}`
      };
    } else {
      // 全ユーザーのエントリをスキャン
      queryParams.FilterExpression = 'SK = :sk';
      queryParams.ExpressionAttributeValues = {
        ':sk': 'METADATA'
      };
    }

    // フィルタ条件を追加
    const filterExpressions = [];
    const expressionAttributeValues = { ...queryParams.ExpressionAttributeValues };

    if (caseId) {
      filterExpressions.push('caseId = :caseId');
      expressionAttributeValues[':caseId'] = caseId;
    }

    if (taskId) {
      filterExpressions.push('taskId = :taskId');
      expressionAttributeValues[':taskId'] = taskId;
    }

    if (startDate) {
      filterExpressions.push('startTime >= :startDate');
      expressionAttributeValues[':startDate'] = startDate;
    }

    if (endDate) {
      filterExpressions.push('startTime <= :endDate');
      expressionAttributeValues[':endDate'] = endDate;
    }

    if (filterExpressions.length > 0) {
      if (queryParams.FilterExpression) {
        queryParams.FilterExpression += ' AND ' + filterExpressions.join(' AND ');
      } else {
        queryParams.FilterExpression = filterExpressions.join(' AND ');
      }
      queryParams.ExpressionAttributeValues = expressionAttributeValues;
    }

    const result = await docClient.send(new QueryCommand(queryParams));

    return {
      success: true,
      entries: result.Items || [],
      nextToken: result.NextToken ? Buffer.from(JSON.stringify(result.NextToken)).toString('base64') : null,
      totalCount: result.Count,
      error: null
    };

  } catch (error) {
    console.error('Error listing timesheet entries:', error);
    return {
      success: false,
      entries: [],
      nextToken: null,
      totalCount: 0,
      error: {
        message: 'Failed to list timesheet entries',
        code: 'INTERNAL_ERROR'
      }
    };
  }
};

// ユーザーのタイムシートエントリ取得
exports.getUserTimesheetEntries = async (event) => {
  try {
    const { userId, startDate, endDate, limit = 20, nextToken } = event.arguments;

    let queryParams = {
      TableName: process.env.TIMESHEET_ENTRIES_TABLE,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `TIMESHEET#${userId}`
      },
      Limit: limit,
      ScanIndexForward: false
    };

    if (nextToken) {
      queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(nextToken, 'base64').toString());
    }

    // 日付範囲フィルタ
    if (startDate || endDate) {
      const filterExpressions = [];

      if (startDate) {
        filterExpressions.push('startTime >= :startDate');
        queryParams.ExpressionAttributeValues[':startDate'] = startDate;
      }

      if (endDate) {
        filterExpressions.push('startTime <= :endDate');
        queryParams.ExpressionAttributeValues[':endDate'] = endDate;
      }

      queryParams.FilterExpression = filterExpressions.join(' AND ');
    }

    const result = await docClient.send(new QueryCommand(queryParams));

    return {
      success: true,
      entries: result.Items || [],
      nextToken: result.NextToken ? Buffer.from(JSON.stringify(result.NextToken)).toString('base64') : null,
      totalCount: result.Count,
      error: null
    };

  } catch (error) {
    console.error('Error getting user timesheet entries:', error);
    return {
      success: false,
      entries: [],
      nextToken: null,
      totalCount: 0,
      error: {
        message: 'Failed to get user timesheet entries',
        code: 'INTERNAL_ERROR'
      }
    };
  }
};

// ケースのタイムシートエントリ取得
exports.getCaseTimesheetEntries = async (event) => {
  try {
    const { caseId, startDate, endDate, limit = 20, nextToken } = event.arguments;

    let queryParams = {
      TableName: process.env.TIMESHEET_ENTRIES_TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :gsi1pk',
      ExpressionAttributeValues: {
        ':gsi1pk': `CASE#${caseId}`
      },
      Limit: limit,
      ScanIndexForward: false
    };

    if (nextToken) {
      queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(nextToken, 'base64').toString());
    }

    // 日付範囲フィルタ
    if (startDate || endDate) {
      const filterExpressions = [];

      if (startDate) {
        filterExpressions.push('startTime >= :startDate');
        queryParams.ExpressionAttributeValues[':startDate'] = startDate;
      }

      if (endDate) {
        filterExpressions.push('startTime <= :endDate');
        queryParams.ExpressionAttributeValues[':endDate'] = endDate;
      }

      queryParams.FilterExpression = filterExpressions.join(' AND ');
    }

    const result = await docClient.send(new QueryCommand(queryParams));

    return {
      success: true,
      entries: result.Items || [],
      nextToken: result.NextToken ? Buffer.from(JSON.stringify(result.NextToken)).toString('base64') : null,
      totalCount: result.Count,
      error: null
    };

  } catch (error) {
    console.error('Error getting case timesheet entries:', error);
    return {
      success: false,
      entries: [],
      nextToken: null,
      totalCount: 0,
      error: {
        message: 'Failed to get case timesheet entries',
        code: 'INTERNAL_ERROR'
      }
    };
  }
};

// タスクのタイムシートエントリ取得
exports.getTaskTimesheetEntries = async (event) => {
  try {
    const { taskId, startDate, endDate, limit = 20, nextToken } = event.arguments;

    let queryParams = {
      TableName: process.env.TIMESHEET_ENTRIES_TABLE,
      IndexName: 'GSI3',
      KeyConditionExpression: 'GSI3PK = :gsi3pk',
      ExpressionAttributeValues: {
        ':gsi3pk': `TASK#${taskId}`
      },
      Limit: limit,
      ScanIndexForward: false
    };

    if (nextToken) {
      queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(nextToken, 'base64').toString());
    }

    // 日付範囲フィルタ
    if (startDate || endDate) {
      const filterExpressions = [];

      if (startDate) {
        filterExpressions.push('startTime >= :startDate');
        queryParams.ExpressionAttributeValues[':startDate'] = startDate;
      }

      if (endDate) {
        filterExpressions.push('startTime <= :endDate');
        queryParams.ExpressionAttributeValues[':endDate'] = endDate;
      }

      queryParams.FilterExpression = filterExpressions.join(' AND ');
    }

    const result = await docClient.send(new QueryCommand(queryParams));

    return {
      success: true,
      entries: result.Items || [],
      nextToken: result.NextToken ? Buffer.from(JSON.stringify(result.NextToken)).toString('base64') : null,
      totalCount: result.Count,
      error: null
    };

  } catch (error) {
    console.error('Error getting task timesheet entries:', error);
    return {
      success: false,
      entries: [],
      nextToken: null,
      totalCount: 0,
      error: {
        message: 'Failed to get task timesheet entries',
        code: 'INTERNAL_ERROR'
      }
    };
  }
};

// タイマー取得
exports.getTimer = async (event) => {
  try {
    const { id } = event.arguments;

    const result = await docClient.send(new GetCommand({
      TableName: process.env.TIMERS_TABLE,
      Key: {
        PK: `TIMER#${id}`,
        SK: 'METADATA'
      }
    }));

    if (!result.Item) {
      return {
        success: false,
        timer: null,
        error: {
          message: 'Timer not found',
          code: 'NOT_FOUND'
        }
      };
    }

    return {
      success: true,
      timer: result.Item,
      error: null
    };

  } catch (error) {
    console.error('Error getting timer:', error);
    return {
      success: false,
      timer: null,
      error: {
        message: 'Failed to get timer',
        code: 'INTERNAL_ERROR'
      }
    };
  }
};

// ユーザーのアクティブタイマー取得
exports.getUserActiveTimers = async (event) => {
  try {
    const { userId } = event.arguments;

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

    return {
      success: true,
      timers: result.Items || [],
      nextToken: null,
      totalCount: result.Count,
      error: null
    };

  } catch (error) {
    console.error('Error getting user active timers:', error);
    return {
      success: false,
      timers: [],
      nextToken: null,
      totalCount: 0,
      error: {
        message: 'Failed to get user active timers',
        code: 'INTERNAL_ERROR'
      }
    };
  }
};

// タイマー一覧取得
exports.listTimers = async (event) => {
  try {
    const { userId, status, limit = 20, nextToken } = event.arguments;

    let queryParams = {
      TableName: process.env.TIMERS_TABLE,
      Limit: limit
    };

    if (nextToken) {
      queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(nextToken, 'base64').toString());
    }

    if (userId) {
      queryParams.KeyConditionExpression = 'PK = :pk';
      queryParams.ExpressionAttributeValues = {
        ':pk': `TIMER#${userId}`
      };
    } else {
      queryParams.FilterExpression = 'SK = :sk';
      queryParams.ExpressionAttributeValues = {
        ':sk': 'METADATA'
      };
    }

    if (status) {
      const filterExpressions = [];
      if (queryParams.FilterExpression) {
        filterExpressions.push(queryParams.FilterExpression);
      }
      filterExpressions.push('status = :status');
      queryParams.FilterExpression = filterExpressions.join(' AND ');
      queryParams.ExpressionAttributeValues[':status'] = status;
    }

    const result = await docClient.send(new QueryCommand(queryParams));

    return {
      success: true,
      timers: result.Items || [],
      nextToken: result.NextToken ? Buffer.from(JSON.stringify(result.NextToken)).toString('base64') : null,
      totalCount: result.Count,
      error: null
    };

  } catch (error) {
    console.error('Error listing timers:', error);
    return {
      success: false,
      timers: [],
      nextToken: null,
      totalCount: 0,
      error: {
        message: 'Failed to list timers',
        code: 'INTERNAL_ERROR'
      }
    };
  }
};

// 時間カテゴリ一覧取得
exports.listTimeCategories = async (event) => {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: process.env.TIME_CATEGORIES_TABLE,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': 'CATEGORY'
      }
    }));

    return result.Items || [];

  } catch (error) {
    console.error('Error listing time categories:', error);
    return [];
  }
};

// 時間カテゴリ取得
exports.getTimeCategory = async (event) => {
  try {
    const { id } = event.arguments;

    const result = await docClient.send(new GetCommand({
      TableName: process.env.TIME_CATEGORIES_TABLE,
      Key: {
        PK: 'CATEGORY',
        SK: `CATEGORY#${id}`
      }
    }));

    return result.Item || null;

  } catch (error) {
    console.error('Error getting time category:', error);
    return null;
  }
};

// タイムシート統計取得
exports.getTimesheetStats = async (event) => {
  try {
    const { filter } = event.arguments;
    const { userId, caseId, startDate, endDate, period } = filter;

    // 統計を計算
    const stats = await calculateTimesheetStats(userId, caseId, startDate, endDate, period);

    return {
      success: true,
      stats,
      error: null
    };

  } catch (error) {
    console.error('Error getting timesheet stats:', error);
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

// ユーザーのタイムシート統計取得
exports.getUserTimesheetStats = async (event) => {
  try {
    const { userId, startDate, endDate } = event.arguments;

    const stats = await calculateTimesheetStats(userId, null, startDate, endDate, 'CUSTOM');

    return {
      success: true,
      stats,
      error: null
    };

  } catch (error) {
    console.error('Error getting user timesheet stats:', error);
    return {
      success: false,
      stats: null,
      error: {
        message: 'Failed to get user timesheet stats',
        code: 'INTERNAL_ERROR'
      }
    };
  }
};

// ケースのタイムシート統計取得
exports.getCaseTimesheetStats = async (event) => {
  try {
    const { caseId, startDate, endDate } = event.arguments;

    const stats = await calculateTimesheetStats(null, caseId, startDate, endDate, 'CUSTOM');

    return {
      success: true,
      stats,
      error: null
    };

  } catch (error) {
    console.error('Error getting case timesheet stats:', error);
    return {
      success: false,
      stats: null,
      error: {
        message: 'Failed to get case timesheet stats',
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
