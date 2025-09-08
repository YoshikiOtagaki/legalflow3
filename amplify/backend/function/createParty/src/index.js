const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, TransactWriteCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const { input } = event.arguments;
    const { user } = event.identity;
    const partyId = uuidv4();
    const currentTime = new Date().toISOString();

    // バリデーション
    if (input.isCorporation && !input.corporateProfile) {
      return {
        success: false,
        party: null,
        error: {
          message: 'Corporate profile is required for corporations',
          code: 'VALIDATION_ERROR'
        }
      };
    }

    if (!input.isCorporation && !input.individualProfile) {
      return {
        success: false,
        party: null,
        error: {
          message: 'Individual profile is required for individuals',
          code: 'VALIDATION_ERROR'
        }
      };
    }

    // トランザクション用のアイテム
    const transactItems = [];

    // 当事者基本情報
    const partyItem = {
      PK: `PARTY#${partyId}`,
      SK: 'METADATA',
      id: partyId,
      isCorporation: input.isCorporation,
      isFormerClient: input.isFormerClient || false,
      individualProfile: input.individualProfile || null,
      corporateProfile: input.corporateProfile || null,
      createdAt: currentTime,
      updatedAt: currentTime,
      createdBy: user.sub,
      updatedBy: user.sub,
      // GSI用の属性
      GSI1PK: `PARTY_TYPE#${input.isCorporation}`,
      GSI1SK: `CREATED#${currentTime}`,
      GSI2PK: `CREATED_BY#${user.sub}`,
      GSI2SK: `CREATED#${currentTime}`,
      GSI3PK: `UPDATED_BY#${user.sub}`,
      GSI3SK: `UPDATED#${currentTime}`
    };

    transactItems.push({
      Put: {
        TableName: process.env.PARTIES_TABLE,
        Item: partyItem
      }
    });

    // 住所情報
    if (input.addresses && input.addresses.length > 0) {
      for (let i = 0; i < input.addresses.length; i++) {
        const address = input.addresses[i];
        const addressId = uuidv4();

        transactItems.push({
          Put: {
            TableName: process.env.PARTIES_TABLE,
            Item: {
              PK: `PARTY#${partyId}`,
              SK: `ADDRESS#${address.addressType}#${currentTime}`,
              id: addressId,
              partyId: partyId,
              addressType: address.addressType,
              isPrimary: address.isPrimary || false,
              address: address.address,
              createdAt: currentTime,
              updatedAt: currentTime
            }
          }
        });
      }
    }

    // 連絡先情報
    if (input.contacts && input.contacts.length > 0) {
      for (let i = 0; i < input.contacts.length; i++) {
        const contact = input.contacts[i];
        const contactId = uuidv4();

        transactItems.push({
          Put: {
            TableName: process.env.PARTIES_TABLE,
            Item: {
              PK: `PARTY#${partyId}`,
              SK: `CONTACT#${contact.contactType}#${currentTime}`,
              id: contactId,
              partyId: partyId,
              contactType: contact.contactType,
              isPrimary: contact.isPrimary || false,
              contact: contact.contact,
              createdAt: currentTime,
              updatedAt: currentTime
            }
          }
        });
      }
    }

    // トランザクション実行
    await docClient.send(new TransactWriteCommand({
      TransactItems: transactItems
    }));

    // 監査ログ
    await logAuditEvent({
      action: 'CREATE_PARTY',
      resource: `PARTY#${partyId}`,
      userId: user.sub,
      details: {
        partyId,
        isCorporation: input.isCorporation,
        hasAddresses: input.addresses ? input.addresses.length > 0 : false,
        hasContacts: input.contacts ? input.contacts.length > 0 : false
      }
    });

    return {
      success: true,
      party: partyItem,
      error: null
    };

  } catch (error) {
    console.error('Error creating party:', error);

    // エラーログ
    await logError({
      action: 'CREATE_PARTY',
      error: error.message,
      stack: error.stack,
      userId: event.identity?.user?.sub
    });

    return {
      success: false,
      party: null,
      error: {
        message: 'Failed to create party',
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
