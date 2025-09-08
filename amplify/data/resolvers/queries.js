// LegalFlow3 GraphQL Query Resolvers
// AWS AppSync with DynamoDB integration

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, GetCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

// =============================================================================
// User Queries
// =============================================================================

exports.getUserByEmail = async (ctx) => {
  const { email } = ctx.arguments;

  try {
    const command = new QueryCommand({
      TableName: 'LegalFlow3-Users',
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    });

    const result = await docClient.send(command);
    return result.Items?.[0] || null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw new Error('Failed to get user by email');
  }
};

exports.getUsersByRole = async (ctx) => {
  const { role } = ctx.arguments;

  try {
    const command = new QueryCommand({
      TableName: 'LegalFlow3-Users',
      IndexName: 'RoleIndex',
      KeyConditionExpression: '#role = :role',
      ExpressionAttributeNames: {
        '#role': 'role'
      },
      ExpressionAttributeValues: {
        ':role': role
      }
    });

    const result = await docClient.send(command);
    return result.Items || [];
  } catch (error) {
    console.error('Error getting users by role:', error);
    throw new Error('Failed to get users by role');
  }
};

// =============================================================================
// Case Queries
// =============================================================================

exports.getCasesByCategory = async (ctx) => {
  const { categoryId } = ctx.arguments;

  try {
    const command = new QueryCommand({
      TableName: 'LegalFlow3-Cases',
      IndexName: 'CategoryIndex',
      KeyConditionExpression: 'categoryId = :categoryId',
      ExpressionAttributeValues: {
        ':categoryId': categoryId
      }
    });

    const result = await docClient.send(command);
    return result.Items || [];
  } catch (error) {
    console.error('Error getting cases by category:', error);
    throw new Error('Failed to get cases by category');
  }
};

exports.getCasesByStatus = async (ctx) => {
  const { status } = ctx.arguments;

  try {
    const command = new QueryCommand({
      TableName: 'LegalFlow3-Cases',
      IndexName: 'StatusIndex',
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': status
      }
    });

    const result = await docClient.send(command);
    return result.Items || [];
  } catch (error) {
    console.error('Error getting cases by status:', error);
    throw new Error('Failed to get cases by status');
  }
};

exports.getCasesByUser = async (ctx) => {
  const { userId } = ctx.arguments;

  try {
    // First get case assignments for the user
    const assignmentsCommand = new QueryCommand({
      TableName: 'LegalFlow3-CaseAssignments',
      IndexName: 'UserCasesIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    });

    const assignmentsResult = await docClient.send(assignmentsCommand);
    const caseIds = assignmentsResult.Items?.map(item => item.caseId) || [];

    if (caseIds.length === 0) {
      return [];
    }

    // Get case details for each case ID
    const cases = [];
    for (const caseId of caseIds) {
      const caseCommand = new GetCommand({
        TableName: 'LegalFlow3-Cases',
        Key: { id: caseId }
      });

      const caseResult = await docClient.send(caseCommand);
      if (caseResult.Item) {
        cases.push(caseResult.Item);
      }
    }

    return cases;
  } catch (error) {
    console.error('Error getting cases by user:', error);
    throw new Error('Failed to get cases by user');
  }
};

exports.searchCases = async (ctx) => {
  const { filter } = ctx.arguments;

  try {
    let filterExpression = '';
    let expressionAttributeNames = {};
    let expressionAttributeValues = {};

    // Build filter expression based on provided filters
    const conditions = [];

    if (filter.name) {
      conditions.push('contains(#name, :name)');
      expressionAttributeNames['#name'] = 'name';
      expressionAttributeValues[':name'] = filter.name;
    }

    if (filter.caseNumber) {
      conditions.push('contains(caseNumber, :caseNumber)');
      expressionAttributeValues[':caseNumber'] = filter.caseNumber;
    }

    if (filter.status) {
      conditions.push('#status = :status');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = filter.status;
    }

    if (filter.categoryId) {
      conditions.push('categoryId = :categoryId');
      expressionAttributeValues[':categoryId'] = filter.categoryId;
    }

    if (filter.priority) {
      conditions.push('#priority = :priority');
      expressionAttributeNames['#priority'] = 'priority';
      expressionAttributeValues[':priority'] = filter.priority;
    }

    if (filter.tags && filter.tags.length > 0) {
      conditions.push('contains(tags, :tags)');
      expressionAttributeValues[':tags'] = filter.tags[0]; // DynamoDB doesn't support array contains directly
    }

    if (filter.dateRange) {
      if (filter.dateRange.startDate) {
        conditions.push('#createdAt >= :startDate');
        expressionAttributeNames['#createdAt'] = 'createdAt';
        expressionAttributeValues[':startDate'] = filter.dateRange.startDate;
      }
      if (filter.dateRange.endDate) {
        conditions.push('#createdAt <= :endDate');
        expressionAttributeNames['#createdAt'] = 'createdAt';
        expressionAttributeValues[':endDate'] = filter.dateRange.endDate;
      }
    }

    if (conditions.length > 0) {
      filterExpression = conditions.join(' AND ');
    }

    const command = new ScanCommand({
      TableName: 'LegalFlow3-Cases',
      FilterExpression: filterExpression || undefined,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ExpressionAttributeValues: Object.keys(expressionAttributeValues).length > 0 ? expressionAttributeValues : undefined
    });

    const result = await docClient.send(command);
    return result.Items || [];
  } catch (error) {
    console.error('Error searching cases:', error);
    throw new Error('Failed to search cases');
  }
};

// =============================================================================
// Task Queries
// =============================================================================

exports.getTasksByCase = async (ctx) => {
  const { caseId } = ctx.arguments;

  try {
    const command = new QueryCommand({
      TableName: 'LegalFlow3-Tasks',
      IndexName: 'CaseTasksIndex',
      KeyConditionExpression: 'caseId = :caseId',
      ExpressionAttributeValues: {
        ':caseId': caseId
      }
    });

    const result = await docClient.send(command);
    return result.Items || [];
  } catch (error) {
    console.error('Error getting tasks by case:', error);
    throw new Error('Failed to get tasks by case');
  }
};

exports.getTasksByUser = async (ctx) => {
  const { userId } = ctx.arguments;

  try {
    const command = new QueryCommand({
      TableName: 'LegalFlow3-Tasks',
      IndexName: 'AssignedTasksIndex',
      KeyConditionExpression: 'assignedToId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    });

    const result = await docClient.send(command);
    return result.Items || [];
  } catch (error) {
    console.error('Error getting tasks by user:', error);
    throw new Error('Failed to get tasks by user');
  }
};

exports.getTasksByStatus = async (ctx) => {
  const { isCompleted } = ctx.arguments;

  try {
    const command = new QueryCommand({
      TableName: 'LegalFlow3-Tasks',
      IndexName: 'StatusIndex',
      KeyConditionExpression: 'isCompleted = :isCompleted',
      ExpressionAttributeValues: {
        ':isCompleted': isCompleted
      }
    });

    const result = await docClient.send(command);
    return result.Items || [];
  } catch (error) {
    console.error('Error getting tasks by status:', error);
    throw new Error('Failed to get tasks by status');
  }
};

exports.getOverdueTasks = async (ctx) => {
  const now = new Date().toISOString();

  try {
    const command = new QueryCommand({
      TableName: 'LegalFlow3-Tasks',
      IndexName: 'StatusIndex',
      KeyConditionExpression: 'isCompleted = :isCompleted',
      FilterExpression: 'dueDate < :now',
      ExpressionAttributeValues: {
        ':isCompleted': false,
        ':now': now
      }
    });

    const result = await docClient.send(command);
    return result.Items || [];
  } catch (error) {
    console.error('Error getting overdue tasks:', error);
    throw new Error('Failed to get overdue tasks');
  }
};

// =============================================================================
// Timesheet Queries
// =============================================================================

exports.getTimesheetByCase = async (ctx) => {
  const { caseId } = ctx.arguments;

  try {
    const command = new QueryCommand({
      TableName: 'LegalFlow3-TimesheetEntries',
      IndexName: 'CaseTimesheetIndex',
      KeyConditionExpression: 'caseId = :caseId',
      ExpressionAttributeValues: {
        ':caseId': caseId
      }
    });

    const result = await docClient.send(command);
    return result.Items || [];
  } catch (error) {
    console.error('Error getting timesheet by case:', error);
    throw new Error('Failed to get timesheet by case');
  }
};

exports.getTimesheetByUser = async (ctx) => {
  const { userId } = ctx.arguments;

  try {
    const command = new QueryCommand({
      TableName: 'LegalFlow3-TimesheetEntries',
      IndexName: 'UserTimesheetIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    });

    const result = await docClient.send(command);
    return result.Items || [];
  } catch (error) {
    console.error('Error getting timesheet by user:', error);
    throw new Error('Failed to get timesheet by user');
  }
};

exports.getTimesheetByDateRange = async (ctx) => {
  const { userId, startDate, endDate } = ctx.arguments;

  try {
    const command = new QueryCommand({
      TableName: 'LegalFlow3-TimesheetEntries',
      IndexName: 'UserTimesheetIndex',
      KeyConditionExpression: 'userId = :userId AND startTime BETWEEN :startDate AND :endDate',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':startDate': startDate,
        ':endDate': endDate
      }
    });

    const result = await docClient.send(command);
    return result.Items || [];
  } catch (error) {
    console.error('Error getting timesheet by date range:', error);
    throw new Error('Failed to get timesheet by date range');
  }
};

// =============================================================================
// Notification Queries
// =============================================================================

exports.getNotificationsByUser = async (ctx) => {
  const { userId } = ctx.arguments;

  try {
    const command = new QueryCommand({
      TableName: 'LegalFlow3-Notifications',
      IndexName: 'UserNotificationsIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    });

    const result = await docClient.send(command);
    return result.Items || [];
  } catch (error) {
    console.error('Error getting notifications by user:', error);
    throw new Error('Failed to get notifications by user');
  }
};

exports.getUnreadNotifications = async (ctx) => {
  const { userId } = ctx.arguments;

  try {
    const command = new QueryCommand({
      TableName: 'LegalFlow3-Notifications',
      IndexName: 'UnreadNotificationsIndex',
      KeyConditionExpression: 'userId = :userId AND isRead = :isRead',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':isRead': false
      }
    });

    const result = await docClient.send(command);
    return result.Items || [];
  } catch (error) {
    console.error('Error getting unread notifications:', error);
    throw new Error('Failed to get unread notifications');
  }
};

// =============================================================================
// Party Queries
// =============================================================================

exports.searchPartiesByName = async (ctx) => {
  const { name } = ctx.arguments;

  try {
    // Search in IndividualProfiles
    const individualCommand = new ScanCommand({
      TableName: 'LegalFlow3-IndividualProfiles',
      FilterExpression: 'contains(#lastName, :name) OR contains(#firstName, :name)',
      ExpressionAttributeNames: {
        '#lastName': 'lastName',
        '#firstName': 'firstName'
      },
      ExpressionAttributeValues: {
        ':name': name
      }
    });

    const individualResult = await docClient.send(individualCommand);

    // Search in CorporateProfiles
    const corporateCommand = new ScanCommand({
      TableName: 'LegalFlow3-CorporateProfiles',
      FilterExpression: 'contains(#name, :name)',
      ExpressionAttributeNames: {
        '#name': 'name'
      },
      ExpressionAttributeValues: {
        ':name': name
      }
    });

    const corporateResult = await docClient.send(corporateCommand);

    // Get party details for found profiles
    const parties = [];

    for (const profile of individualResult.Items || []) {
      const partyCommand = new GetCommand({
        TableName: 'LegalFlow3-Parties',
        Key: { id: profile.partyId }
      });

      const partyResult = await docClient.send(partyCommand);
      if (partyResult.Item) {
        parties.push({
          ...partyResult.Item,
          individualProfile: profile
        });
      }
    }

    for (const profile of corporateResult.Items || []) {
      const partyCommand = new GetCommand({
        TableName: 'LegalFlow3-Parties',
        Key: { id: profile.partyId }
      });

      const partyResult = await docClient.send(partyCommand);
      if (partyResult.Item) {
        parties.push({
          ...partyResult.Item,
          corporateProfile: profile
        });
      }
    }

    return parties;
  } catch (error) {
    console.error('Error searching parties by name:', error);
    throw new Error('Failed to search parties by name');
  }
};

exports.searchPartiesByEmail = async (ctx) => {
  const { email } = ctx.arguments;

  try {
    // Search in IndividualProfiles
    const individualCommand = new QueryCommand({
      TableName: 'LegalFlow3-IndividualProfiles',
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    });

    const individualResult = await docClient.send(individualCommand);

    // Search in CorporateProfiles
    const corporateCommand = new QueryCommand({
      TableName: 'LegalFlow3-CorporateProfiles',
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    });

    const corporateResult = await docClient.send(corporateCommand);

    // Get party details for found profiles
    const parties = [];

    for (const profile of individualResult.Items || []) {
      const partyCommand = new GetCommand({
        TableName: 'LegalFlow3-Parties',
        Key: { id: profile.partyId }
      });

      const partyResult = await docClient.send(partyCommand);
      if (partyResult.Item) {
        parties.push({
          ...partyResult.Item,
          individualProfile: profile
        });
      }
    }

    for (const profile of corporateResult.Items || []) {
      const partyCommand = new GetCommand({
        TableName: 'LegalFlow3-Parties',
        Key: { id: profile.partyId }
      });

      const partyResult = await docClient.send(partyCommand);
      if (partyResult.Item) {
        parties.push({
          ...partyResult.Item,
          corporateProfile: profile
        });
      }
    }

    return parties;
  } catch (error) {
    console.error('Error searching parties by email:', error);
    throw new Error('Failed to search parties by email');
  }
};
