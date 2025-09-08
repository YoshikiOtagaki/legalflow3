// 当事者管理用クエリリゾルバー

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// 当事者取得
exports.getParty = async (event) => {
  try {
    const { id } = event.arguments;

    // 当事者基本情報を取得
    const partyResult = await docClient.send(new GetCommand({
      TableName: process.env.PARTIES_TABLE,
      Key: {
        PK: `PARTY#${id}`,
        SK: 'METADATA'
      }
    }));

    if (!partyResult.Item) {
      return {
        success: false,
        party: null,
        error: {
          message: 'Party not found',
          code: 'NOT_FOUND'
        }
      };
    }

    // 住所情報を取得
    const addressesResult = await docClient.send(new QueryCommand({
      TableName: process.env.PARTIES_TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `PARTY#${id}`,
        ':sk': 'ADDRESS#'
      }
    }));

    // 連絡先情報を取得
    const contactsResult = await docClient.send(new QueryCommand({
      TableName: process.env.PARTIES_TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `PARTY#${id}`,
        ':sk': 'CONTACT#'
      }
    }));

    // 関係情報を取得
    const relationsResult = await docClient.send(new QueryCommand({
      TableName: process.env.PARTIES_TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `PARTY#${id}`,
        ':sk': 'RELATION#'
      }
    }));

    // ケース情報を取得
    const casesResult = await docClient.send(new QueryCommand({
      TableName: process.env.CASE_PARTIES_TABLE,
      IndexName: 'GSI4',
      KeyConditionExpression: 'GSI4PK = :gsi4pk',
      ExpressionAttributeValues: {
        ':gsi4pk': `PARTY#${id}`
      }
    }));

    const party = {
      ...partyResult.Item,
      addresses: addressesResult.Items || [],
      contacts: contactsResult.Items || [],
      relations: relationsResult.Items || [],
      cases: casesResult.Items || []
    };

    return {
      success: true,
      party,
      error: null
    };

  } catch (error) {
    console.error('Error getting party:', error);
    return {
      success: false,
      party: null,
      error: {
        message: 'Failed to get party',
        code: 'INTERNAL_ERROR'
      }
    };
  }
};

// 当事者一覧取得
exports.listParties = async (event) => {
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

    return {
      success: true,
      parties: result.Items || [],
      nextToken: result.NextToken ? Buffer.from(JSON.stringify(result.NextToken)).toString('base64') : null,
      totalCount: result.Count,
      error: null
    };

  } catch (error) {
    console.error('Error listing parties:', error);
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

// 当事者検索
exports.searchParties = async (event) => {
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
    const filterExpressions = [];
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

    if (filterExpressions.length > 0) {
      scanParams.FilterExpression = filterExpressions.join(' AND ');
      scanParams.ExpressionAttributeValues = expressionAttributeValues;
    }

    if (Object.keys(expressionAttributeNames).length > 0) {
      scanParams.ExpressionAttributeNames = expressionAttributeNames;
    }

    const result = await docClient.send(new ScanCommand(scanParams));

    return {
      success: true,
      parties: result.Items || [],
      nextToken: result.NextToken ? Buffer.from(JSON.stringify(result.NextToken)).toString('base64') : null,
      totalCount: result.Count,
      error: null
    };

  } catch (error) {
    console.error('Error searching parties:', error);
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

// ケースの当事者一覧取得
exports.getCaseParties = async (event) => {
  try {
    const { caseId, limit = 20, nextToken } = event.arguments;

    let queryParams = {
      TableName: process.env.CASE_PARTIES_TABLE,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `CASE#${caseId}`
      },
      Limit: limit
    };

    if (nextToken) {
      queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(nextToken, 'base64').toString());
    }

    const result = await docClient.send(new QueryCommand(queryParams));

    // 当事者詳細情報を取得
    const parties = [];
    for (const caseParty of result.Items || []) {
      const partyResult = await docClient.send(new GetCommand({
        TableName: process.env.PARTIES_TABLE,
        Key: {
          PK: `PARTY#${caseParty.partyId}`,
          SK: 'METADATA'
        }
      }));

      if (partyResult.Item) {
        parties.push({
          ...caseParty,
          party: partyResult.Item
        });
      }
    }

    return {
      success: true,
      parties,
      nextToken: result.NextToken ? Buffer.from(JSON.stringify(result.NextToken)).toString('base64') : null,
      totalCount: result.Count,
      error: null
    };

  } catch (error) {
    console.error('Error getting case parties:', error);
    return {
      success: false,
      parties: [],
      nextToken: null,
      totalCount: 0,
      error: {
        message: 'Failed to get case parties',
        code: 'INTERNAL_ERROR'
      }
    };
  }
};

// 当事者の住所一覧取得
exports.getPartyAddresses = async (event) => {
  try {
    const { partyId, limit = 20, nextToken } = event.arguments;

    let queryParams = {
      TableName: process.env.PARTIES_TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `PARTY#${partyId}`,
        ':sk': 'ADDRESS#'
      },
      Limit: limit
    };

    if (nextToken) {
      queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(nextToken, 'base64').toString());
    }

    const result = await docClient.send(new QueryCommand(queryParams));

    return result.Items || [];

  } catch (error) {
    console.error('Error getting party addresses:', error);
    return [];
  }
};

// 当事者の連絡先一覧取得
exports.getPartyContacts = async (event) => {
  try {
    const { partyId, limit = 20, nextToken } = event.arguments;

    let queryParams = {
      TableName: process.env.PARTIES_TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `PARTY#${partyId}`,
        ':sk': 'CONTACT#'
      },
      Limit: limit
    };

    if (nextToken) {
      queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(nextToken, 'base64').toString());
    }

    const result = await docClient.send(new QueryCommand(queryParams));

    return result.Items || [];

  } catch (error) {
    console.error('Error getting party contacts:', error);
    return [];
  }
};

// 当事者の関係一覧取得
exports.getPartyRelations = async (event) => {
  try {
    const { partyId, limit = 20, nextToken } = event.arguments;

    let queryParams = {
      TableName: process.env.PARTIES_TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `PARTY#${partyId}`,
        ':sk': 'RELATION#'
      },
      Limit: limit
    };

    if (nextToken) {
      queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(nextToken, 'base64').toString());
    }

    const result = await docClient.send(new QueryCommand(queryParams));

    return result.Items || [];

  } catch (error) {
    console.error('Error getting party relations:', error);
    return [];
  }
};
