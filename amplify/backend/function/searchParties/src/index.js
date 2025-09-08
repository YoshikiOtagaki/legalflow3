const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const { filter, limit = 20, nextToken } = event.arguments;

    let scanParams = {
      TableName: process.env.PARTIES_TABLE,
      FilterExpression: 'SK = :sk',
      ExpressionAttributeValues: {
        ':sk': 'METADATA'
      },
      Limit: limit
    };

    if (nextToken) {
      scanParams.ExclusiveStartKey = JSON.parse(Buffer.from(nextToken, 'base64').toString());
    }

    // フィルタ条件を構築
    const filterExpressions = ['SK = :sk'];
    const expressionAttributeValues = { ...scanParams.ExpressionAttributeValues };
    const expressionAttributeNames = {};

    if (filter.isCorporation !== undefined) {
      filterExpressions.push('isCorporation = :isCorporation');
      expressionAttributeValues[':isCorporation'] = filter.isCorporation;
    }

    if (filter.isFormerClient !== undefined) {
      filterExpressions.push('isFormerClient = :isFormerClient');
      expressionAttributeValues[':isFormerClient'] = filter.isFormerClient;
    }

    if (filter.name) {
      filterExpressions.push('(contains(individualProfile.firstName, :name) OR contains(individualProfile.lastName, :name) OR contains(corporateProfile.companyName, :name))');
      expressionAttributeValues[':name'] = filter.name;
    }

    if (filter.email) {
      filterExpressions.push('contains(contacts, :email)');
      expressionAttributeValues[':email'] = filter.email;
    }

    if (filter.phone) {
      filterExpressions.push('contains(contacts, :phone)');
      expressionAttributeValues[':phone'] = filter.phone;
    }

    if (filter.industry) {
      filterExpressions.push('contains(corporateProfile.industry, :industry)');
      expressionAttributeValues[':industry'] = filter.industry;
    }

    if (filter.createdBy) {
      filterExpressions.push('createdBy = :createdBy');
      expressionAttributeValues[':createdBy'] = filter.createdBy;
    }

    if (filter.dateRange) {
      filterExpressions.push('createdAt BETWEEN :startDate AND :endDate');
      expressionAttributeValues[':startDate'] = filter.dateRange.startDate;
      expressionAttributeValues[':endDate'] = filter.dateRange.endDate;
    }

    scanParams.FilterExpression = filterExpressions.join(' AND ');
    scanParams.ExpressionAttributeValues = expressionAttributeValues;

    if (Object.keys(expressionAttributeNames).length > 0) {
      scanParams.ExpressionAttributeNames = expressionAttributeNames;
    }

    const result = await docClient.send(new ScanCommand(scanParams));

    // 監査ログ
    await logAuditEvent({
      action: 'SEARCH_PARTIES',
      resource: 'PARTIES',
      userId: event.identity?.user?.sub,
      details: {
        filter,
        limit,
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
    console.error('Error searching parties:', error);

    // エラーログ
    await logError({
      action: 'SEARCH_PARTIES',
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
        message: 'Failed to search parties',
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
