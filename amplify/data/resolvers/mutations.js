// LegalFlow3 GraphQL Mutation Resolvers
// AWS AppSync with DynamoDB integration

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, UpdateCommand, DeleteCommand, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

// =============================================================================
// User Mutations
// =============================================================================

exports.createUser = async (ctx) => {
  const { input } = ctx.arguments;
  const userId = `USER#${uuidv4()}`;
  const now = new Date().toISOString();

  try {
    const user = {
      id: userId,
      email: input.email,
      name: input.name,
      role: input.role || 'Lawyer',
      createdAt: now,
      updatedAt: now,
      isActive: true,
      profileImageUrl: input.profileImageUrl
    };

    const command = new PutCommand({
      TableName: 'LegalFlow3-Users',
      Item: user,
      ConditionExpression: 'attribute_not_exists(id)'
    });

    await docClient.send(command);

    // Create default subscription
    const subscriptionCommand = new PutCommand({
      TableName: 'LegalFlow3-Subscriptions',
      Item: {
        id: `SUBSCRIPTION#${uuidv4()}`,
        userId: userId,
        plan: 'Free',
        status: 'Active',
        caseCount: 0,
        maxCases: 5, // Free plan limit
        usedStorage: 0,
        maxStorage: 1000, // 1GB in MB
        billingCycle: 'Monthly',
        createdAt: now,
        updatedAt: now
      }
    });

    await docClient.send(subscriptionCommand);

    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error('Failed to create user');
  }
};

exports.updateUser = async (ctx) => {
  const { input } = ctx.arguments;
  const now = new Date().toISOString();

  try {
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    if (input.name !== undefined) {
      updateExpression.push('#name = :name');
      expressionAttributeNames['#name'] = 'name';
      expressionAttributeValues[':name'] = input.name;
    }

    if (input.profileImageUrl !== undefined) {
      updateExpression.push('profileImageUrl = :profileImageUrl');
      expressionAttributeValues[':profileImageUrl'] = input.profileImageUrl;
    }

    if (input.isActive !== undefined) {
      updateExpression.push('isActive = :isActive');
      expressionAttributeValues[':isActive'] = input.isActive;
    }

    updateExpression.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = now;

    const command = new UpdateCommand({
      TableName: 'LegalFlow3-Users',
      Key: { id: input.id },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(command);
    return result.Attributes;
  } catch (error) {
    console.error('Error updating user:', error);
    throw new Error('Failed to update user');
  }
};

exports.deleteUser = async (ctx) => {
  const { id } = ctx.arguments;

  try {
    // First, get the user to return it
    const getCommand = new GetCommand({
      TableName: 'LegalFlow3-Users',
      Key: { id }
    });

    const userResult = await docClient.send(getCommand);
    if (!userResult.Item) {
      throw new Error('User not found');
    }

    // Delete the user
    const deleteCommand = new DeleteCommand({
      TableName: 'LegalFlow3-Users',
      Key: { id }
    });

    await docClient.send(deleteCommand);

    // Delete related subscription
    const subscriptionDeleteCommand = new DeleteCommand({
      TableName: 'LegalFlow3-Subscriptions',
      Key: { userId: id }
    });

    await docClient.send(subscriptionDeleteCommand);

    return userResult.Item;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user');
  }
};

// =============================================================================
// Case Mutations
// =============================================================================

exports.createCase = async (ctx) => {
  const { input } = ctx.arguments;
  const caseId = `CASE#${uuidv4()}`;
  const now = new Date().toISOString();

  try {
    const caseData = {
      id: caseId,
      name: input.name,
      caseNumber: input.caseNumber,
      status: input.status || 'Active',
      trialLevel: input.trialLevel,
      hourlyRate: input.hourlyRate,
      categoryId: input.categoryId,
      currentPhaseId: input.currentPhaseId,
      courtDivisionId: input.courtDivisionId,
      createdAt: now,
      updatedAt: now,
      firstConsultationDate: input.firstConsultationDate,
      engagementDate: input.engagementDate,
      caseClosedDate: input.caseClosedDate,
      litigationStartDate: input.litigationStartDate,
      oralArgumentEndDate: input.oralArgumentEndDate,
      judgmentDate: input.judgmentDate,
      judgmentReceivedDate: input.judgmentReceivedDate,
      hasEngagementLetter: input.hasEngagementLetter || false,
      engagementLetterPath: input.engagementLetterPath,
      remarks: input.remarks,
      customProperties: input.customProperties,
      tags: input.tags || [],
      priority: input.priority || 'Medium'
    };

    const command = new PutCommand({
      TableName: 'LegalFlow3-Cases',
      Item: caseData
    });

    await docClient.send(command);

    return caseData;
  } catch (error) {
    console.error('Error creating case:', error);
    throw new Error('Failed to create case');
  }
};

exports.updateCase = async (ctx) => {
  const { input } = ctx.arguments;
  const now = new Date().toISOString();

  try {
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    // Build update expression dynamically
    const fields = [
      'name', 'caseNumber', 'status', 'trialLevel', 'hourlyRate',
      'categoryId', 'currentPhaseId', 'courtDivisionId',
      'firstConsultationDate', 'engagementDate', 'caseClosedDate',
      'litigationStartDate', 'oralArgumentEndDate', 'judgmentDate',
      'judgmentReceivedDate', 'hasEngagementLetter', 'engagementLetterPath',
      'remarks', 'customProperties', 'tags', 'priority'
    ];

    fields.forEach(field => {
      if (input[field] !== undefined) {
        if (field === 'name' || field === 'status' || field === 'priority') {
          updateExpression.push(`#${field} = :${field}`);
          expressionAttributeNames[`#${field}`] = field;
        } else {
          updateExpression.push(`${field} = :${field}`);
        }
        expressionAttributeValues[`:${field}`] = input[field];
      }
    });

    updateExpression.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = now;

    const command = new UpdateCommand({
      TableName: 'LegalFlow3-Cases',
      Key: { id: input.id },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(command);
    return result.Attributes;
  } catch (error) {
    console.error('Error updating case:', error);
    throw new Error('Failed to update case');
  }
};

exports.deleteCase = async (ctx) => {
  const { id } = ctx.arguments;

  try {
    // First, get the case to return it
    const getCommand = new GetCommand({
      TableName: 'LegalFlow3-Cases',
      Key: { id }
    });

    const caseResult = await docClient.send(getCommand);
    if (!caseResult.Item) {
      throw new Error('Case not found');
    }

    // Delete the case
    const deleteCommand = new DeleteCommand({
      TableName: 'LegalFlow3-Cases',
      Key: { id }
    });

    await docClient.send(deleteCommand);

    return caseResult.Item;
  } catch (error) {
    console.error('Error deleting case:', error);
    throw new Error('Failed to delete case');
  }
};

exports.assignCaseToUser = async (ctx) => {
  const { caseId, userId, role } = ctx.arguments;
  const now = new Date().toISOString();

  try {
    const assignment = {
      id: `ASSIGNMENT#${uuidv4()}`,
      caseId: caseId,
      userId: userId,
      role: role,
      permissions: {
        canEdit: role === 'Lead',
        canDelete: role === 'Lead',
        canAssign: role === 'Lead',
        canViewFinancials: role === 'Lead'
      },
      assignedAt: now,
      isActive: true
    };

    const command = new PutCommand({
      TableName: 'LegalFlow3-CaseAssignments',
      Item: assignment
    });

    await docClient.send(command);

    return assignment;
  } catch (error) {
    console.error('Error assigning case to user:', error);
    throw new Error('Failed to assign case to user');
  }
};

exports.removeCaseFromUser = async (ctx) => {
  const { caseId, userId } = ctx.arguments;

  try {
    // First, get the assignment to return it
    const getCommand = new GetCommand({
      TableName: 'LegalFlow3-CaseAssignments',
      Key: {
        caseId: caseId,
        userId: userId
      }
    });

    const assignmentResult = await docClient.send(getCommand);
    if (!assignmentResult.Item) {
      throw new Error('Assignment not found');
    }

    // Delete the assignment
    const deleteCommand = new DeleteCommand({
      TableName: 'LegalFlow3-CaseAssignments',
      Key: {
        caseId: caseId,
        userId: userId
      }
    });

    await docClient.send(deleteCommand);

    return assignmentResult.Item;
  } catch (error) {
    console.error('Error removing case from user:', error);
    throw new Error('Failed to remove case from user');
  }
};

// =============================================================================
// Task Mutations
// =============================================================================

exports.createTask = async (ctx) => {
  const { input } = ctx.arguments;
  const taskId = `TASK#${uuidv4()}`;
  const now = new Date().toISOString();

  try {
    const task = {
      id: taskId,
      caseId: input.caseId,
      description: input.description,
      dueDate: input.dueDate,
      isCompleted: false,
      isAutoGenerated: input.isAutoGenerated || false,
      assignedToId: input.assignedToId,
      assignedAt: input.assignedToId ? now : undefined,
      priority: input.priority || 'Medium',
      category: input.category,
      tags: input.tags || [],
      createdAt: now,
      updatedAt: now,
      estimatedHours: input.estimatedHours,
      notes: input.notes,
      attachments: []
    };

    const command = new PutCommand({
      TableName: 'LegalFlow3-Tasks',
      Item: task
    });

    await docClient.send(command);

    return task;
  } catch (error) {
    console.error('Error creating task:', error);
    throw new Error('Failed to create task');
  }
};

exports.updateTask = async (ctx) => {
  const { input } = ctx.arguments;
  const now = new Date().toISOString();

  try {
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    const fields = [
      'description', 'dueDate', 'isCompleted', 'assignedToId',
      'priority', 'category', 'tags', 'estimatedHours', 'actualHours', 'notes'
    ];

    fields.forEach(field => {
      if (input[field] !== undefined) {
        if (field === 'description' || field === 'priority') {
          updateExpression.push(`#${field} = :${field}`);
          expressionAttributeNames[`#${field}`] = field;
        } else {
          updateExpression.push(`${field} = :${field}`);
        }
        expressionAttributeValues[`:${field}`] = input[field];
      }
    });

    // Handle completion
    if (input.isCompleted && !input.completedAt) {
      updateExpression.push('completedAt = :completedAt');
      expressionAttributeValues[':completedAt'] = now;
    }

    updateExpression.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = now;

    const command = new UpdateCommand({
      TableName: 'LegalFlow3-Tasks',
      Key: { id: input.id },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(command);
    return result.Attributes;
  } catch (error) {
    console.error('Error updating task:', error);
    throw new Error('Failed to update task');
  }
};

exports.deleteTask = async (ctx) => {
  const { id } = ctx.arguments;

  try {
    const getCommand = new GetCommand({
      TableName: 'LegalFlow3-Tasks',
      Key: { id }
    });

    const taskResult = await docClient.send(getCommand);
    if (!taskResult.Item) {
      throw new Error('Task not found');
    }

    const deleteCommand = new DeleteCommand({
      TableName: 'LegalFlow3-Tasks',
      Key: { id }
    });

    await docClient.send(deleteCommand);

    return taskResult.Item;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw new Error('Failed to delete task');
  }
};

exports.completeTask = async (ctx) => {
  const { id } = ctx.arguments;
  const now = new Date().toISOString();

  try {
    const command = new UpdateCommand({
      TableName: 'LegalFlow3-Tasks',
      Key: { id },
      UpdateExpression: 'SET isCompleted = :isCompleted, completedAt = :completedAt, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':isCompleted': true,
        ':completedAt': now,
        ':updatedAt': now
      },
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(command);
    return result.Attributes;
  } catch (error) {
    console.error('Error completing task:', error);
    throw new Error('Failed to complete task');
  }
};

exports.assignTaskToUser = async (ctx) => {
  const { taskId, userId } = ctx.arguments;
  const now = new Date().toISOString();

  try {
    const command = new UpdateCommand({
      TableName: 'LegalFlow3-Tasks',
      Key: { id: taskId },
      UpdateExpression: 'SET assignedToId = :assignedToId, assignedAt = :assignedAt, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':assignedToId': userId,
        ':assignedAt': now,
        ':updatedAt': now
      },
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(command);
    return result.Attributes;
  } catch (error) {
    console.error('Error assigning task to user:', error);
    throw new Error('Failed to assign task to user');
  }
};

// =============================================================================
// Timesheet Mutations
// =============================================================================

exports.createTimesheetEntry = async (ctx) => {
  const { input } = ctx.arguments;
  const entryId = `TIMESHEET#${uuidv4()}`;
  const now = new Date().toISOString();

  try {
    // Calculate duration if endTime is provided
    let duration = 0;
    if (input.endTime) {
      const start = new Date(input.startTime);
      const end = new Date(input.endTime);
      duration = Math.round((end - start) / (1000 * 60)); // minutes
    }

    const entry = {
      id: entryId,
      caseId: input.caseId,
      userId: ctx.identity?.sub || 'unknown', // Get from context
      startTime: input.startTime,
      endTime: input.endTime,
      duration: duration,
      description: input.description,
      category: input.category,
      subcategory: input.subcategory,
      billable: input.billable !== undefined ? input.billable : true,
      hourlyRate: input.hourlyRate,
      createdAt: now,
      updatedAt: now,
      notes: input.notes,
      tags: input.tags || [],
      isApproved: false
    };

    const command = new PutCommand({
      TableName: 'LegalFlow3-TimesheetEntries',
      Item: entry
    });

    await docClient.send(command);

    return entry;
  } catch (error) {
    console.error('Error creating timesheet entry:', error);
    throw new Error('Failed to create timesheet entry');
  }
};

exports.updateTimesheetEntry = async (ctx) => {
  const { input } = ctx.arguments;
  const now = new Date().toISOString();

  try {
    const updateExpression = [];
    const expressionAttributeValues = {};

    const fields = [
      'startTime', 'endTime', 'description', 'category', 'subcategory',
      'billable', 'hourlyRate', 'notes', 'tags', 'isApproved'
    ];

    fields.forEach(field => {
      if (input[field] !== undefined) {
        updateExpression.push(`${field} = :${field}`);
        expressionAttributeValues[`:${field}`] = input[field];
      }
    });

    // Recalculate duration if times are updated
    if (input.startTime || input.endTime) {
      const getCommand = new GetCommand({
        TableName: 'LegalFlow3-TimesheetEntries',
        Key: { id: input.id }
      });

      const currentEntry = await docClient.send(getCommand);
      if (currentEntry.Item) {
        const startTime = input.startTime || currentEntry.Item.startTime;
        const endTime = input.endTime || currentEntry.Item.endTime;

        if (startTime && endTime) {
          const start = new Date(startTime);
          const end = new Date(endTime);
          const duration = Math.round((end - start) / (1000 * 60));
          updateExpression.push('duration = :duration');
          expressionAttributeValues[':duration'] = duration;
        }
      }
    }

    updateExpression.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = now;

    const command = new UpdateCommand({
      TableName: 'LegalFlow3-TimesheetEntries',
      Key: { id: input.id },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(command);
    return result.Attributes;
  } catch (error) {
    console.error('Error updating timesheet entry:', error);
    throw new Error('Failed to update timesheet entry');
  }
};

exports.deleteTimesheetEntry = async (ctx) => {
  const { id } = ctx.arguments;

  try {
    const getCommand = new GetCommand({
      TableName: 'LegalFlow3-TimesheetEntries',
      Key: { id }
    });

    const entryResult = await docClient.send(getCommand);
    if (!entryResult.Item) {
      throw new Error('Timesheet entry not found');
    }

    const deleteCommand = new DeleteCommand({
      TableName: 'LegalFlow3-TimesheetEntries',
      Key: { id }
    });

    await docClient.send(deleteCommand);

    return entryResult.Item;
  } catch (error) {
    console.error('Error deleting timesheet entry:', error);
    throw new Error('Failed to delete timesheet entry');
  }
};

exports.startTimer = async (ctx) => {
  const { caseId, description } = ctx.arguments;
  const now = new Date().toISOString();

  try {
    const entry = {
      id: `TIMESHEET#${uuidv4()}`,
      caseId: caseId,
      userId: ctx.identity?.sub || 'unknown',
      startTime: now,
      endTime: null,
      duration: 0,
      description: description,
      category: 'General',
      billable: true,
      createdAt: now,
      updatedAt: now,
      isApproved: false
    };

    const command = new PutCommand({
      TableName: 'LegalFlow3-TimesheetEntries',
      Item: entry
    });

    await docClient.send(command);

    return entry;
  } catch (error) {
    console.error('Error starting timer:', error);
    throw new Error('Failed to start timer');
  }
};

exports.stopTimer = async (ctx) => {
  const { id } = ctx.arguments;
  const now = new Date().toISOString();

  try {
    // Get current entry
    const getCommand = new GetCommand({
      TableName: 'LegalFlow3-TimesheetEntries',
      Key: { id }
    });

    const entryResult = await docClient.send(getCommand);
    if (!entryResult.Item) {
      throw new Error('Timesheet entry not found');
    }

    const startTime = new Date(entryResult.Item.startTime);
    const endTime = new Date(now);
    const duration = Math.round((endTime - startTime) / (1000 * 60)); // minutes

    const command = new UpdateCommand({
      TableName: 'LegalFlow3-TimesheetEntries',
      Key: { id },
      UpdateExpression: 'SET endTime = :endTime, duration = :duration, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':endTime': now,
        ':duration': duration,
        ':updatedAt': now
      },
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(command);
    return result.Attributes;
  } catch (error) {
    console.error('Error stopping timer:', error);
    throw new Error('Failed to stop timer');
  }
};

// =============================================================================
// Notification Mutations
// =============================================================================

exports.markNotificationAsRead = async (ctx) => {
  const { id } = ctx.arguments;
  const now = new Date().toISOString();

  try {
    const command = new UpdateCommand({
      TableName: 'LegalFlow3-Notifications',
      Key: { id },
      UpdateExpression: 'SET isRead = :isRead, readAt = :readAt',
      ExpressionAttributeValues: {
        ':isRead': true,
        ':readAt': now
      },
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(command);
    return result.Attributes;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw new Error('Failed to mark notification as read');
  }
};

exports.markAllNotificationsAsRead = async (ctx) => {
  const { userId } = ctx.arguments;
  const now = new Date().toISOString();

  try {
    // Get all unread notifications for the user
    const queryCommand = new QueryCommand({
      TableName: 'LegalFlow3-Notifications',
      IndexName: 'UnreadNotificationsIndex',
      KeyConditionExpression: 'userId = :userId AND isRead = :isRead',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':isRead': false
      }
    });

    const result = await docClient.send(queryCommand);
    const notifications = result.Items || [];

    // Update each notification
    const updatedNotifications = [];
    for (const notification of notifications) {
      const updateCommand = new UpdateCommand({
        TableName: 'LegalFlow3-Notifications',
        Key: { id: notification.id },
        UpdateExpression: 'SET isRead = :isRead, readAt = :readAt',
        ExpressionAttributeValues: {
          ':isRead': true,
          ':readAt': now
        },
        ReturnValues: 'ALL_NEW'
      });

      const updateResult = await docClient.send(updateCommand);
      updatedNotifications.push(updateResult.Attributes);
    }

    return updatedNotifications;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw new Error('Failed to mark all notifications as read');
  }
};

exports.deleteNotification = async (ctx) => {
  const { id } = ctx.arguments;

  try {
    const getCommand = new GetCommand({
      TableName: 'LegalFlow3-Notifications',
      Key: { id }
    });

    const notificationResult = await docClient.send(getCommand);
    if (!notificationResult.Item) {
      throw new Error('Notification not found');
    }

    const deleteCommand = new DeleteCommand({
      TableName: 'LegalFlow3-Notifications',
      Key: { id }
    });

    await docClient.send(deleteCommand);

    return notificationResult.Item;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw new Error('Failed to delete notification');
  }
};
