const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

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
