const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, TransactWriteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const { id } = event.arguments;
    const { user } = event.identity;

    // 関連データを取得
    const addressesResult = await docClient.send(new QueryCommand({
      TableName: process.env.PARTIES_TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `PARTY#${id}`,
        ':sk': 'ADDRESS#'
      }
    }));

    const contactsResult = await docClient.send(new QueryCommand({
      TableName: process.env.PARTIES_TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `PARTY#${id}`,
        ':sk': 'CONTACT#'
      }
    }));

    const relationsResult = await docClient.send(new QueryCommand({
      TableName: process.env.PARTIES_TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `PARTY#${id}`,
        ':sk': 'RELATION#'
      }
    }));

    // ケース関連を取得
    const casePartiesResult = await docClient.send(new QueryCommand({
      TableName: process.env.CASE_PARTIES_TABLE,
      IndexName: 'GSI5',
      KeyConditionExpression: 'GSI5PK = :gsi5pk',
      ExpressionAttributeValues: {
        ':gsi5pk': `PARTY#${id}`
      }
    }));

    // 削除用のトランザクションアイテム
    const transactItems = [];

    // 当事者基本情報を削除
    transactItems.push({
      Delete: {
        TableName: process.env.PARTIES_TABLE,
        Key: {
          PK: `PARTY#${id}`,
          SK: 'METADATA'
        }
      }
    });

    // 住所情報を削除
    for (const address of addressesResult.Items || []) {
      transactItems.push({
        Delete: {
          TableName: process.env.PARTIES_TABLE,
          Key: {
            PK: address.PK,
            SK: address.SK
          }
        }
      });
    }

    // 連絡先情報を削除
    for (const contact of contactsResult.Items || []) {
      transactItems.push({
        Delete: {
          TableName: process.env.PARTIES_TABLE,
          Key: {
            PK: contact.PK,
            SK: contact.SK
          }
        }
      });
    }

    // 関係情報を削除
    for (const relation of relationsResult.Items || []) {
      transactItems.push({
        Delete: {
          TableName: process.env.PARTIES_TABLE,
          Key: {
            PK: relation.PK,
            SK: relation.SK
          }
        }
      });
    }

    // ケース関連を削除
    for (const caseParty of casePartiesResult.Items || []) {
      transactItems.push({
        Delete: {
          TableName: process.env.CASE_PARTIES_TABLE,
          Key: {
            PK: caseParty.PK,
            SK: caseParty.SK
          }
        }
      });
    }

    // トランザクション実行
    await docClient.send(new TransactWriteCommand({
      TransactItems: transactItems
    }));

    // 監査ログ
    await logAuditEvent({
      action: 'DELETE_PARTY',
      resource: `PARTY#${id}`,
      userId: user.sub,
      details: {
        partyId: id,
        deletedAddresses: addressesResult.Items?.length || 0,
        deletedContacts: contactsResult.Items?.length || 0,
        deletedRelations: relationsResult.Items?.length || 0,
        deletedCaseParties: casePartiesResult.Items?.length || 0
      }
    });

    return {
      success: true,
      party: { id },
      message: 'Party deleted successfully',
      error: null
    };

  } catch (error) {
    console.error('Error deleting party:', error);

    // エラーログ
    await logError({
      action: 'DELETE_PARTY',
      error: error.message,
      stack: error.stack,
      userId: event.identity?.user?.sub,
      partyId: event.arguments?.id
    });

    return {
      success: false,
      party: null,
      message: 'Failed to delete party',
      error: {
        message: 'Failed to delete party',
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
