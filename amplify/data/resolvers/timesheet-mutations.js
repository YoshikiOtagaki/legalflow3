// タイムシート機能用ミューテーションリゾルバー

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, UpdateCommand, DeleteCommand, TransactWriteCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// タイムシートエントリ作成
exports.createTimesheetEntry = async (event) => {
  try {
    const { input } = event.arguments;
    const { user } = event.identity;
    const entryId = uuidv4();
    const currentTime = new Date().toISOString();

    // 作業時間を計算（分単位）
    const startTime = new Date(input.startTime);
    const endTime = new Date(input.endTime);
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    // 総金額を計算
    const totalAmount = input.hourlyRate ? (duration / 60) * input.hourlyRate : 0;

    const entryItem = {
      PK: `TIMESHEET#${input.userId || user.sub}`,
      SK: `ENTRY#${input.startTime}#${entryId}`,
      id: entryId,
      caseId: input.caseId,
      userId: input.userId || user.sub,
      taskId: input.taskId || null,
      startTime: input.startTime,
      endTime: input.endTime,
      duration: duration,
      description: input.description || null,
      category: input.category || null,
      billable: input.billable,
      hourlyRate: input.hourlyRate || null,
      totalAmount: totalAmount,
      isActive: true,
      createdAt: currentTime,
      updatedAt: currentTime,
      createdBy: user.sub,
      updatedBy: user.sub,
      // GSI用の属性
      GSI1PK: `CASE#${input.caseId}`,
      GSI1SK: `ENTRY#${input.startTime}`,
      GSI2PK: `DATE#${input.startTime.split('T')[0]}`,
      GSI2SK: `USER#${input.userId || user.sub}#${input.startTime}`,
      GSI3PK: input.taskId ? `TASK#${input.taskId}` : null,
      GSI3SK: input.taskId ? `ENTRY#${input.startTime}` : null,
      GSI4PK: input.category ? `CATEGORY#${input.category}` : null,
      GSI4SK: input.category ? `ENTRY#${input.startTime}` : null
    };

    await docClient.send(new PutCommand({
      TableName: process.env.TIMESHEET_ENTRIES_TABLE,
      Item: entryItem
    }));

    // 監査ログ
    await logAuditEvent({
      action: 'CREATE_TIMESHEET_ENTRY',
      resource: `TIMESHEET_ENTRY#${entryId}`,
      userId: user.sub,
      details: {
        entryId,
        caseId: input.caseId,
        duration,
        billable: input.billable
      }
    });

    return {
      success: true,
      entry: entryItem,
      error: null
    };

  } catch (error) {
    console.error('Error creating timesheet entry:', error);

    // エラーログ
    await logError({
      action: 'CREATE_TIMESHEET_ENTRY',
      error: error.message,
      stack: error.stack,
      userId: event.identity?.user?.sub
    });

    return {
      success: false,
      entry: null,
      error: {
        message: 'Failed to create timesheet entry',
        code: 'INTERNAL_ERROR'
      }
    };
  }
};

// タイムシートエントリ更新
exports.updateTimesheetEntry = async (event) => {
  try {
    const { input } = event.arguments;
    const { user } = event.identity;
    const currentTime = new Date().toISOString();

    // 既存のエントリを取得
    const existingEntry = await docClient.send(new GetCommand({
      TableName: process.env.TIMESHEET_ENTRIES_TABLE,
      Key: {
        PK: `TIMESHEET#${input.id}`,
        SK: 'METADATA'
      }
    }));

    if (!existingEntry.Item) {
      return {
        success: false,
        entry: null,
        error: {
          message: 'Timesheet entry not found',
          code: 'NOT_FOUND'
        }
      };
    }

    // 更新用の属性を構築
    const updateExpressions = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    if (input.startTime) {
      updateExpressions.push('startTime = :startTime');
      expressionAttributeValues[':startTime'] = input.startTime;
    }

    if (input.endTime) {
      updateExpressions.push('endTime = :endTime');
      expressionAttributeValues[':endTime'] = input.endTime;
    }

    if (input.description !== undefined) {
      updateExpressions.push('description = :description');
      expressionAttributeValues[':description'] = input.description;
    }

    if (input.category !== undefined) {
      updateExpressions.push('category = :category');
      expressionAttributeValues[':category'] = input.category;
    }

    if (input.billable !== undefined) {
      updateExpressions.push('billable = :billable');
      expressionAttributeValues[':billable'] = input.billable;
    }

    if (input.hourlyRate !== undefined) {
      updateExpressions.push('hourlyRate = :hourlyRate');
      expressionAttributeValues[':hourlyRate'] = input.hourlyRate;
    }

    updateExpressions.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = currentTime;

    updateExpressions.push('updatedBy = :updatedBy');
    expressionAttributeValues[':updatedBy'] = user.sub;

    // 作業時間と総金額を再計算
    const startTime = input.startTime ? new Date(input.startTime) : new Date(existingEntry.Item.startTime);
    const endTime = input.endTime ? new Date(input.endTime) : new Date(existingEntry.Item.endTime);
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    const hourlyRate = input.hourlyRate !== undefined ? input.hourlyRate : existingEntry.Item.hourlyRate;
    const totalAmount = hourlyRate ? (duration / 60) * hourlyRate : 0;

    updateExpressions.push('duration = :duration');
    expressionAttributeValues[':duration'] = duration;

    updateExpressions.push('totalAmount = :totalAmount');
    expressionAttributeValues[':totalAmount'] = totalAmount;

    const updateParams = {
      TableName: process.env.TIMESHEET_ENTRIES_TABLE,
      Key: {
        PK: `TIMESHEET#${input.id}`,
        SK: 'METADATA'
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    if (Object.keys(expressionAttributeNames).length > 0) {
      updateParams.ExpressionAttributeNames = expressionAttributeNames;
    }

    const result = await docClient.send(new UpdateCommand(updateParams));

    // 監査ログ
    await logAuditEvent({
      action: 'UPDATE_TIMESHEET_ENTRY',
      resource: `TIMESHEET_ENTRY#${input.id}`,
      userId: user.sub,
      details: {
        entryId: input.id,
        updatedFields: Object.keys(input).filter(key => key !== 'id'),
        duration,
        totalAmount
      }
    });

    return {
      success: true,
      entry: result.Attributes,
      error: null
    };

  } catch (error) {
    console.error('Error updating timesheet entry:', error);

    // エラーログ
    await logError({
      action: 'UPDATE_TIMESHEET_ENTRY',
      error: error.message,
      stack: error.stack,
      userId: event.identity?.user?.sub,
      entryId: event.arguments?.input?.id
    });

    return {
      success: false,
      entry: null,
      error: {
        message: 'Failed to update timesheet entry',
        code: 'INTERNAL_ERROR'
      }
    };
  }
};

// タイムシートエントリ削除
exports.deleteTimesheetEntry = async (event) => {
  try {
    const { id } = event.arguments;
    const { user } = event.identity;

    // 既存のエントリを取得
    const existingEntry = await docClient.send(new GetCommand({
      TableName: process.env.TIMESHEET_ENTRIES_TABLE,
      Key: {
        PK: `TIMESHEET#${id}`,
        SK: 'METADATA'
      }
    }));

    if (!existingEntry.Item) {
      return {
        success: false,
        entry: null,
        message: 'Timesheet entry not found',
        error: {
          message: 'Timesheet entry not found',
          code: 'NOT_FOUND'
        }
      };
    }

    await docClient.send(new DeleteCommand({
      TableName: process.env.TIMESHEET_ENTRIES_TABLE,
      Key: {
        PK: `TIMESHEET#${id}`,
        SK: 'METADATA'
      }
    }));

    // 監査ログ
    await logAuditEvent({
      action: 'DELETE_TIMESHEET_ENTRY',
      resource: `TIMESHEET_ENTRY#${id}`,
      userId: user.sub,
      details: {
        entryId: id,
        caseId: existingEntry.Item.caseId,
        duration: existingEntry.Item.duration
      }
    });

    return {
      success: true,
      entry: existingEntry.Item,
      message: 'Timesheet entry deleted successfully',
      error: null
    };

  } catch (error) {
    console.error('Error deleting timesheet entry:', error);

    // エラーログ
    await logError({
      action: 'DELETE_TIMESHEET_ENTRY',
      error: error.message,
      stack: error.stack,
      userId: event.identity?.user?.sub,
      entryId: event.arguments?.id
    });

    return {
      success: false,
      entry: null,
      message: 'Failed to delete timesheet entry',
      error: {
        message: 'Failed to delete timesheet entry',
        code: 'INTERNAL_ERROR'
      }
    };
  }
};

// タイマー開始
exports.startTimer = async (event) => {
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

// タイマー停止
exports.stopTimer = async (event) => {
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

// タイマー一時停止
exports.pauseTimer = async (event) => {
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

    if (!existingTimer.Item || existingTimer.Item.status !== 'RUNNING') {
      return {
        success: false,
        timer: null,
        error: {
          message: 'Timer not found or not running',
          code: 'NOT_FOUND'
        }
      };
    }

    // タイマーを一時停止
    const now = new Date();
    const startTime = new Date(existingTimer.Item.startTime);
    const currentSessionTime = now.getTime() - startTime.getTime();

    const updatedTimer = {
      ...existingTimer.Item,
      status: 'PAUSED',
      pausedAt: currentTime,
      currentSessionTime: currentSessionTime,
      totalTime: existingTimer.Item.totalTime + currentSessionTime,
      lastUpdated: currentTime
    };

    await docClient.send(new PutCommand({
      TableName: process.env.TIMERS_TABLE,
      Item: updatedTimer
    }));

    // 監査ログ
    await logAuditEvent({
      action: 'PAUSE_TIMER',
      resource: `TIMER#${id}`,
      userId: user.sub,
      details: {
        timerId: id,
        currentSessionTime,
        totalTime: updatedTimer.totalTime
      }
    });

    return {
      success: true,
      timer: updatedTimer,
      error: null
    };

  } catch (error) {
    console.error('Error pausing timer:', error);

    // エラーログ
    await logError({
      action: 'PAUSE_TIMER',
      error: error.message,
      stack: error.stack,
      userId: event.identity?.user?.sub,
      timerId: event.arguments?.id
    });

    return {
      success: false,
      timer: null,
      error: {
        message: 'Failed to pause timer',
        code: 'INTERNAL_ERROR'
      }
    };
  }
};

// タイマー再開
exports.resumeTimer = async (event) => {
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

// タイマー更新
exports.updateTimer = async (event) => {
  try {
    const { input } = event.arguments;
    const { user } = event.identity;
    const currentTime = new Date().toISOString();

    // 既存のタイマーを取得
    const existingTimer = await docClient.send(new GetCommand({
      TableName: process.env.TIMERS_TABLE,
      Key: {
        PK: `TIMER#${user.sub}`,
        SK: `ACTIVE#${input.id}`
      }
    }));

    if (!existingTimer.Item) {
      return {
        success: false,
        timer: null,
        error: {
          message: 'Timer not found',
          code: 'NOT_FOUND'
        }
      };
    }

    // 更新用の属性を構築
    const updateExpressions = [];
    const expressionAttributeValues = {};

    if (input.description !== undefined) {
      updateExpressions.push('description = :description');
      expressionAttributeValues[':description'] = input.description;
    }

    updateExpressions.push('lastUpdated = :lastUpdated');
    expressionAttributeValues[':lastUpdated'] = currentTime;

    const updateParams = {
      TableName: process.env.TIMERS_TABLE,
      Key: {
        PK: `TIMER#${user.sub}`,
        SK: `ACTIVE#${input.id}`
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(updateParams));

    // 監査ログ
    await logAuditEvent({
      action: 'UPDATE_TIMER',
      resource: `TIMER#${input.id}`,
      userId: user.sub,
      details: {
        timerId: input.id,
        updatedFields: Object.keys(input).filter(key => key !== 'id')
      }
    });

    return {
      success: true,
      timer: result.Attributes,
      error: null
    };

  } catch (error) {
    console.error('Error updating timer:', error);

    // エラーログ
    await logError({
      action: 'UPDATE_TIMER',
      error: error.message,
      stack: error.stack,
      userId: event.identity?.user?.sub,
      timerId: event.arguments?.input?.id
    });

    return {
      success: false,
      timer: null,
      error: {
        message: 'Failed to update timer',
        code: 'INTERNAL_ERROR'
      }
    };
  }
};

// 時間カテゴリ作成
exports.createTimeCategory = async (event) => {
  try {
    const { input } = event.arguments;
    const { user } = event.identity;
    const categoryId = uuidv4();
    const currentTime = new Date().toISOString();

    const categoryItem = {
      PK: 'CATEGORY',
      SK: `CATEGORY#${categoryId}`,
      id: categoryId,
      name: input.name,
      description: input.description || null,
      color: input.color || '#3B82F6',
      isDefault: input.isDefault || false,
      isActive: true,
      createdAt: currentTime,
      updatedAt: currentTime
    };

    await docClient.send(new PutCommand({
      TableName: process.env.TIME_CATEGORIES_TABLE,
      Item: categoryItem
    }));

    // 監査ログ
    await logAuditEvent({
      action: 'CREATE_TIME_CATEGORY',
      resource: `TIME_CATEGORY#${categoryId}`,
      userId: user.sub,
      details: {
        categoryId,
        name: input.name,
        isDefault: input.isDefault
      }
    });

    return categoryItem;

  } catch (error) {
    console.error('Error creating time category:', error);
    throw new Error('Failed to create time category');
  }
};

// 時間カテゴリ更新
exports.updateTimeCategory = async (event) => {
  try {
    const { input } = event.arguments;
    const { user } = event.identity;
    const currentTime = new Date().toISOString();

    // 更新用の属性を構築
    const updateExpressions = [];
    const expressionAttributeValues = {};

    if (input.name !== undefined) {
      updateExpressions.push('name = :name');
      expressionAttributeValues[':name'] = input.name;
    }

    if (input.description !== undefined) {
      updateExpressions.push('description = :description');
      expressionAttributeValues[':description'] = input.description;
    }

    if (input.color !== undefined) {
      updateExpressions.push('color = :color');
      expressionAttributeValues[':color'] = input.color;
    }

    if (input.isActive !== undefined) {
      updateExpressions.push('isActive = :isActive');
      expressionAttributeValues[':isActive'] = input.isActive;
    }

    updateExpressions.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = currentTime;

    const updateParams = {
      TableName: process.env.TIME_CATEGORIES_TABLE,
      Key: {
        PK: 'CATEGORY',
        SK: `CATEGORY#${input.id}`
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(updateParams));

    // 監査ログ
    await logAuditEvent({
      action: 'UPDATE_TIME_CATEGORY',
      resource: `TIME_CATEGORY#${input.id}`,
      userId: user.sub,
      details: {
        categoryId: input.id,
        updatedFields: Object.keys(input).filter(key => key !== 'id')
      }
    });

    return result.Attributes;

  } catch (error) {
    console.error('Error updating time category:', error);
    throw new Error('Failed to update time category');
  }
};

// 時間カテゴリ削除
exports.deleteTimeCategory = async (event) => {
  try {
    const { id } = event.arguments;
    const { user } = event.identity;

    // 既存のカテゴリを取得
    const existingCategory = await docClient.send(new GetCommand({
      TableName: process.env.TIME_CATEGORIES_TABLE,
      Key: {
        PK: 'CATEGORY',
        SK: `CATEGORY#${id}`
      }
    }));

    if (!existingCategory.Item) {
      return {
        success: false,
        entry: null,
        message: 'Time category not found',
        error: {
          message: 'Time category not found',
          code: 'NOT_FOUND'
        }
      };
    }

    await docClient.send(new DeleteCommand({
      TableName: process.env.TIME_CATEGORIES_TABLE,
      Key: {
        PK: 'CATEGORY',
        SK: `CATEGORY#${id}`
      }
    }));

    // 監査ログ
    await logAuditEvent({
      action: 'DELETE_TIME_CATEGORY',
      resource: `TIME_CATEGORY#${id}`,
      userId: user.sub,
      details: {
        categoryId: id,
        name: existingCategory.Item.name
      }
    });

    return {
      success: true,
      entry: existingCategory.Item,
      message: 'Time category deleted successfully',
      error: null
    };

  } catch (error) {
    console.error('Error deleting time category:', error);

    // エラーログ
    await logError({
      action: 'DELETE_TIME_CATEGORY',
      error: error.message,
      stack: error.stack,
      userId: event.identity?.user?.sub,
      categoryId: event.arguments?.id
    });

    return {
      success: false,
      entry: null,
      message: 'Failed to delete time category',
      error: {
        message: 'Failed to delete time category',
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
