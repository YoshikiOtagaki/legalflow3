const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const { limit = 20, nextToken, isCorporation, isFormerClient } = event.arguments;

    let queryParams = {
      TableName: process.env.PARTIES_TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :gsi1pk',
      ExpressionAttributeValues: {
        ':gsi1pk': `PARTY_TYPE#${isCorporation}`
      },
      Limit: limit,
      ScanIndexForward: false
    };

    if (nextToken) {
      queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(nextToken, 'base64').toString());
    }

    if (isFormerClient !== undefined) {
      queryParams.FilterExpression = 'isFormerClient = :isFormerClient';
      queryParams.ExpressionAttributeValues[':isFormerClient'] = isFormerClient;
    }

    const result = await docClient.send(new QueryCommand(queryParams));

    // 監査ログ
    await logAuditEvent({
      action: 'LIST_PARTIES',
      resource: 'PARTIES',
      userId: event.identity?.user?.sub,
      details: {
        limit,
        isCorporation,
        isFormerClient,
        resultCount: result.Items?.length || 0
      }
    });

    return {
      success: true,
      parties: result.Items || [],
      nextToken: result.NextToken ? Buffer.from(JSON.stringify(result.NextToken)).toString('base64') : null,
      totalCount: result.Count,
      error: null
    };

  } catch (error) {
    console.error('Error listing parties:', error);

    // エラーログ
    await logError({
      action: 'LIST_PARTIES',
      error: error.message,
      stack: error.stack,
      userId: event.identity?.user?.sub
    });

    return {
      success: false,
      parties: [],
      nextToken: null,
      totalCount: 0,
      error: {
        message: 'Failed to list parties',
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
