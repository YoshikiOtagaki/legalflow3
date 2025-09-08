const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const { input } = event.arguments;
    const { user } = event.identity;
    const currentTime = new Date().toISOString();

    // 既存の当事者情報を取得
    const existingParty = await docClient.send(new GetCommand({
      TableName: process.env.PARTIES_TABLE,
      Key: {
        PK: `PARTY#${input.id}`,
        SK: 'METADATA'
      }
    }));

    if (!existingParty.Item) {
      return {
        success: false,
        party: null,
        error: {
          message: 'Party not found',
          code: 'NOT_FOUND'
        }
      };
    }

    // 更新用の属性を構築
    const updateExpressions = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    if (input.isCorporation !== undefined) {
      updateExpressions.push('isCorporation = :isCorporation');
      expressionAttributeValues[':isCorporation'] = input.isCorporation;
    }

    if (input.isFormerClient !== undefined) {
      updateExpressions.push('isFormerClient = :isFormerClient');
      expressionAttributeValues[':isFormerClient'] = input.isFormerClient;
    }

    if (input.individualProfile) {
      updateExpressions.push('individualProfile = :individualProfile');
      expressionAttributeValues[':individualProfile'] = input.individualProfile;
    }

    if (input.corporateProfile) {
      updateExpressions.push('corporateProfile = :corporateProfile');
      expressionAttributeValues[':corporateProfile'] = input.corporateProfile;
    }

    updateExpressions.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = currentTime;

    updateExpressions.push('updatedBy = :updatedBy');
    expressionAttributeValues[':updatedBy'] = user.sub;

    // GSI更新
    if (input.isCorporation !== undefined) {
      updateExpressions.push('GSI1PK = :gsi1pk');
      expressionAttributeValues[':gsi1pk'] = `PARTY_TYPE#${input.isCorporation}`;
    }

    updateExpressions.push('GSI3PK = :gsi3pk');
    expressionAttributeValues[':gsi3pk'] = `UPDATED_BY#${user.sub}`;

    updateExpressions.push('GSI3SK = :gsi3sk');
    expressionAttributeValues[':gsi3sk'] = `UPDATED#${currentTime}`;

    const updateParams = {
      TableName: process.env.PARTIES_TABLE,
      Key: {
        PK: `PARTY#${input.id}`,
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
      action: 'UPDATE_PARTY',
      resource: `PARTY#${input.id}`,
      userId: user.sub,
      details: {
        partyId: input.id,
        updatedFields: Object.keys(input).filter(key => key !== 'id'),
        isCorporation: input.isCorporation !== undefined ? input.isCorporation : existingParty.Item.isCorporation
      }
    });

    return {
      success: true,
      party: result.Attributes,
      error: null
    };

  } catch (error) {
    console.error('Error updating party:', error);

    // エラーログ
    await logError({
      action: 'UPDATE_PARTY',
      error: error.message,
      stack: error.stack,
      userId: event.identity?.user?.sub,
      partyId: event.arguments?.input?.id
    });

    return {
      success: false,
      party: null,
      error: {
        message: 'Failed to update party',
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
