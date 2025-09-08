// 当事者管理用ミューテーションリゾルバー

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, UpdateCommand, DeleteCommand, TransactWriteCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// 当事者作成
exports.createParty = async (event) => {
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

    return {
      success: true,
      party: partyItem,
      error: null
    };

  } catch (error) {
    console.error('Error creating party:', error);
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

// 当事者更新
exports.updateParty = async (event) => {
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

    return {
      success: true,
      party: result.Attributes,
      error: null
    };

  } catch (error) {
    console.error('Error updating party:', error);
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

// 当事者削除
exports.deleteParty = async (event) => {
  try {
    const { id } = event.arguments;

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
      IndexName: 'GSI4',
      KeyConditionExpression: 'GSI4PK = :gsi4pk',
      ExpressionAttributeValues: {
        ':gsi4pk': `PARTY#${id}`
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

    return {
      success: true,
      party: { id },
      message: 'Party deleted successfully',
      error: null
    };

  } catch (error) {
    console.error('Error deleting party:', error);
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

// 住所追加
exports.addAddress = async (event) => {
  try {
    const { input } = event.arguments;
    const { user } = event.identity;
    const addressId = uuidv4();
    const currentTime = new Date().toISOString();

    const addressItem = {
      PK: `PARTY#${input.partyId}`,
      SK: `ADDRESS#${input.addressType}#${currentTime}`,
      id: addressId,
      partyId: input.partyId,
      addressType: input.addressType,
      isPrimary: input.isPrimary || false,
      address: input.address,
      createdAt: currentTime,
      updatedAt: currentTime
    };

    await docClient.send(new PutCommand({
      TableName: process.env.PARTIES_TABLE,
      Item: addressItem
    }));

    return {
      success: true,
      address: addressItem,
      error: null
    };

  } catch (error) {
    console.error('Error adding address:', error);
    return {
      success: false,
      address: null,
      error: {
        message: 'Failed to add address',
        code: 'INTERNAL_ERROR'
      }
    };
  }
};

// 連絡先追加
exports.addContact = async (event) => {
  try {
    const { input } = event.arguments;
    const { user } = event.identity;
    const contactId = uuidv4();
    const currentTime = new Date().toISOString();

    const contactItem = {
      PK: `PARTY#${input.partyId}`,
      SK: `CONTACT#${input.contactType}#${currentTime}`,
      id: contactId,
      partyId: input.partyId,
      contactType: input.contactType,
      isPrimary: input.isPrimary || false,
      contact: input.contact,
      createdAt: currentTime,
      updatedAt: currentTime
    };

    await docClient.send(new PutCommand({
      TableName: process.env.PARTIES_TABLE,
      Item: contactItem
    }));

    return {
      success: true,
      contact: contactItem,
      error: null
    };

  } catch (error) {
    console.error('Error adding contact:', error);
    return {
      success: false,
      contact: null,
      error: {
        message: 'Failed to add contact',
        code: 'INTERNAL_ERROR'
      }
    };
  }
};

// 関係追加
exports.addRelation = async (event) => {
  try {
    const { input } = event.arguments;
    const { user } = event.identity;
    const relationId = uuidv4();
    const currentTime = new Date().toISOString();

    const relationItem = {
      PK: `PARTY#${input.partyId1}`,
      SK: `RELATION#${input.partyId2}#${input.relationType}`,
      id: relationId,
      partyId1: input.partyId1,
      partyId2: input.partyId2,
      relationType: input.relationType,
      description: input.description || null,
      isActive: true,
      createdAt: currentTime,
      updatedAt: currentTime
    };

    await docClient.send(new PutCommand({
      TableName: process.env.PARTIES_TABLE,
      Item: relationItem
    }));

    return {
      success: true,
      relation: relationItem,
      error: null
    };

  } catch (error) {
    console.error('Error adding relation:', error);
    return {
      success: false,
      relation: null,
      error: {
        message: 'Failed to add relation',
        code: 'INTERNAL_ERROR'
      }
    };
  }
};

// ケース当事者追加
exports.addCaseParty = async (event) => {
  try {
    const { input } = event.arguments;
    const { user } = event.identity;
    const casePartyId = uuidv4();
    const currentTime = new Date().toISOString();

    const casePartyItem = {
      PK: `CASE#${input.caseId}`,
      SK: `PARTY#${input.partyId}`,
      id: casePartyId,
      caseId: input.caseId,
      partyId: input.partyId,
      partyRole: input.partyRole,
      isPrimary: input.isPrimary || false,
      assignedAt: currentTime,
      assignedBy: user.sub,
      isActive: true,
      createdAt: currentTime,
      updatedAt: currentTime,
      // GSI用の属性
      GSI4PK: `PARTY_ROLE#${input.partyRole}`,
      GSI4SK: `CASE#${input.caseId}`,
      GSI5PK: `PARTY#${input.partyId}`,
      GSI5SK: `CASE#${input.caseId}`
    };

    await docClient.send(new PutCommand({
      TableName: process.env.CASE_PARTIES_TABLE,
      Item: casePartyItem
    }));

    return {
      success: true,
      caseParty: casePartyItem,
      error: null
    };

  } catch (error) {
    console.error('Error adding case party:', error);
    return {
      success: false,
      caseParty: null,
      error: {
        message: 'Failed to add case party',
        code: 'INTERNAL_ERROR'
      }
    };
  }
};
