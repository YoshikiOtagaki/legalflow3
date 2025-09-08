// LegalFlow3 GraphQL Resolver Mapping Templates
// AWS AppSync with DynamoDB integration

// =============================================================================
// Request Mapping Templates
// =============================================================================

// Get User by ID
exports.getUserRequestTemplate = `
{
  "version": "2017-02-28",
  "operation": "GetItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
  }
}`;

// List Users
exports.listUsersRequestTemplate = `
{
  "version": "2017-02-28",
  "operation": "Scan",
  "filter": {
    "expression": "isActive = :isActive",
    "expressionValues": {
      ":isActive": $util.dynamodb.toDynamoDBJson(true)
    }
  }
}`;

// Create User
exports.createUserRequestTemplate = `
{
  "version": "2017-02-28",
  "operation": "PutItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($util.autoId())
  },
  "attributeValues": $util.dynamodb.toMapValuesJson($ctx.args.input),
  "condition": {
    "expression": "attribute_not_exists(id)"
  }
}`;

// Update User
exports.updateUserRequestTemplate = `
{
  "version": "2017-02-28",
  "operation": "UpdateItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
  },
  "update": {
    "expression": "SET #name = :name, updatedAt = :updatedAt",
    "expressionNames": {
      "#name": "name"
    },
    "expressionValues": {
      ":name": $util.dynamodb.toDynamoDBJson($ctx.args.input.name),
      ":updatedAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
    }
  }
}`;

// Delete User
exports.deleteUserRequestTemplate = `
{
  "version": "2017-02-28",
  "operation": "DeleteItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
  }
}`;

// Get Case by ID
exports.getCaseRequestTemplate = `
{
  "version": "2017-02-28",
  "operation": "GetItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
  }
}`;

// List Cases by User
exports.listCasesByUserRequestTemplate = `
{
  "version": "2017-02-28",
  "operation": "Query",
  "index": "UserCasesIndex",
  "query": {
    "expression": "userId = :userId",
    "expressionValues": {
      ":userId": $util.dynamodb.toDynamoDBJson($ctx.args.userId)
    }
  }
}`;

// Create Case
exports.createCaseRequestTemplate = `
{
  "version": "2017-02-28",
  "operation": "PutItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($util.autoId())
  },
  "attributeValues": $util.dynamodb.toMapValuesJson($ctx.args.input),
  "condition": {
    "expression": "attribute_not_exists(id)"
  }
}`;

// Update Case
exports.updateCaseRequestTemplate = `
{
  "version": "2017-02-28",
  "operation": "UpdateItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
  },
  "update": {
    "expression": "SET #name = :name, updatedAt = :updatedAt",
    "expressionNames": {
      "#name": "name"
    },
    "expressionValues": {
      ":name": $util.dynamodb.toDynamoDBJson($ctx.args.input.name),
      ":updatedAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
    }
  }
}`;

// Delete Case
exports.deleteCaseRequestTemplate = `
{
  "version": "2017-02-28",
  "operation": "DeleteItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
  }
}`;

// Get Tasks by Case
exports.getTasksByCaseRequestTemplate = `
{
  "version": "2017-02-28",
  "operation": "Query",
  "index": "CaseTasksIndex",
  "query": {
    "expression": "caseId = :caseId",
    "expressionValues": {
      ":caseId": $util.dynamodb.toDynamoDBJson($ctx.args.caseId)
    }
  }
}`;

// Create Task
exports.createTaskRequestTemplate = `
{
  "version": "2017-02-28",
  "operation": "PutItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($util.autoId())
  },
  "attributeValues": $util.dynamodb.toMapValuesJson($ctx.args.input),
  "condition": {
    "expression": "attribute_not_exists(id)"
  }
}`;

// Update Task
exports.updateTaskRequestTemplate = `
{
  "version": "2017-02-28",
  "operation": "UpdateItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
  },
  "update": {
    "expression": "SET #description = :description, updatedAt = :updatedAt",
    "expressionNames": {
      "#description": "description"
    },
    "expressionValues": {
      ":description": $util.dynamodb.toDynamoDBJson($ctx.args.input.description),
      ":updatedAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
    }
  }
}`;

// Delete Task
exports.deleteTaskRequestTemplate = `
{
  "version": "2017-02-28",
  "operation": "DeleteItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
  }
}`;

// Get Timesheet Entries by User
exports.getTimesheetByUserRequestTemplate = `
{
  "version": "2017-02-28",
  "operation": "Query",
  "index": "UserTimesheetIndex",
  "query": {
    "expression": "userId = :userId",
    "expressionValues": {
      ":userId": $util.dynamodb.toDynamoDBJson($ctx.args.userId)
    }
  }
}`;

// Create Timesheet Entry
exports.createTimesheetEntryRequestTemplate = `
{
  "version": "2017-02-28",
  "operation": "PutItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($util.autoId())
  },
  "attributeValues": $util.dynamodb.toMapValuesJson($ctx.args.input),
  "condition": {
    "expression": "attribute_not_exists(id)"
  }
}`;

// Update Timesheet Entry
exports.updateTimesheetEntryRequestTemplate = `
{
  "version": "2017-02-28",
  "operation": "UpdateItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
  },
  "update": {
    "expression": "SET #description = :description, updatedAt = :updatedAt",
    "expressionNames": {
      "#description": "description"
    },
    "expressionValues": {
      ":description": $util.dynamodb.toDynamoDBJson($ctx.args.input.description),
      ":updatedAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
    }
  }
}`;

// Delete Timesheet Entry
exports.deleteTimesheetEntryRequestTemplate = `
{
  "version": "2017-02-28",
  "operation": "DeleteItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
  }
}`;

// Get Notifications by User
exports.getNotificationsByUserRequestTemplate = `
{
  "version": "2017-02-28",
  "operation": "Query",
  "index": "UserNotificationsIndex",
  "query": {
    "expression": "userId = :userId",
    "expressionValues": {
      ":userId": $util.dynamodb.toDynamoDBJson($ctx.args.userId)
    }
  }
}`;

// Create Notification
exports.createNotificationRequestTemplate = `
{
  "version": "2017-02-28",
  "operation": "PutItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($util.autoId())
  },
  "attributeValues": $util.dynamodb.toMapValuesJson($ctx.args.input),
  "condition": {
    "expression": "attribute_not_exists(id)"
  }
}`;

// Update Notification
exports.updateNotificationRequestTemplate = `
{
  "version": "2017-02-28",
  "operation": "UpdateItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.input.id)
  },
  "update": {
    "expression": "SET isRead = :isRead, readAt = :readAt",
    "expressionValues": {
      ":isRead": $util.dynamodb.toDynamoDBJson($ctx.args.input.isRead),
      ":readAt": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
    }
  }
}`;

// Delete Notification
exports.deleteNotificationRequestTemplate = `
{
  "version": "2017-02-28",
  "operation": "DeleteItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($ctx.args.id)
  }
}`;

// =============================================================================
// Response Mapping Templates
// =============================================================================

// Generic Response Template
exports.genericResponseTemplate = `
#if($ctx.error)
  $util.error($ctx.error.message, $ctx.error.type)
#end
$util.toJson($ctx.result)
`;

// List Response Template
exports.listResponseTemplate = `
#if($ctx.error)
  $util.error($ctx.error.message, $ctx.error.type)
#end
$util.toJson($ctx.result.items)
`;

// Single Item Response Template
exports.singleItemResponseTemplate = `
#if($ctx.error)
  $util.error($ctx.error.message, $ctx.error.type)
#end
$util.toJson($ctx.result)
`;

// =============================================================================
// Custom Resolver Templates
// =============================================================================

// Search Cases Request Template
exports.searchCasesRequestTemplate = `
{
  "version": "2017-02-28",
  "operation": "Scan",
  "filter": {
    "expression": "contains(#name, :name) AND #status = :status",
    "expressionNames": {
      "#name": "name",
      "#status": "status"
    },
    "expressionValues": {
      ":name": $util.dynamodb.toDynamoDBJson($ctx.args.filter.name),
      ":status": $util.dynamodb.toDynamoDBJson($ctx.args.filter.status)
    }
  }
}`;

// Search Cases Response Template
exports.searchCasesResponseTemplate = `
#if($ctx.error)
  $util.error($ctx.error.message, $ctx.error.type)
#end
$util.toJson($ctx.result.items)
`;

// Get User by Email Request Template
exports.getUserByEmailRequestTemplate = `
{
  "version": "2017-02-28",
  "operation": "Query",
  "index": "EmailIndex",
  "query": {
    "expression": "email = :email",
    "expressionValues": {
      ":email": $util.dynamodb.toDynamoDBJson($ctx.args.email)
    }
  }
}`;

// Get User by Email Response Template
exports.getUserByEmailResponseTemplate = `
#if($ctx.error)
  $util.error($ctx.error.message, $ctx.error.type)
#end
#if($ctx.result.items && $ctx.result.items.size() > 0)
  $util.toJson($ctx.result.items[0])
#else
  null
#end
`;

// Get Overdue Tasks Request Template
exports.getOverdueTasksRequestTemplate = `
{
  "version": "2017-02-28",
  "operation": "Query",
  "index": "StatusIndex",
  "query": {
    "expression": "isCompleted = :isCompleted",
    "expressionValues": {
      ":isCompleted": $util.dynamodb.toDynamoDBJson(false)
    }
  },
  "filter": {
    "expression": "dueDate < :now",
    "expressionValues": {
      ":now": $util.dynamodb.toDynamoDBJson($util.time.nowISO8601())
    }
  }
}`;

// Get Overdue Tasks Response Template
exports.getOverdueTasksResponseTemplate = `
#if($ctx.error)
  $util.error($ctx.error.message, $ctx.error.type)
#end
$util.toJson($ctx.result.items)
`;

// =============================================================================
// Subscription Request Templates
// =============================================================================

// Case Created Subscription Request
exports.caseCreatedSubscriptionRequestTemplate = `
{
  "version": "2017-02-28",
  "operation": "GetItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($ctx.source.id)
  }
}`;

// Case Created Subscription Response
exports.caseCreatedSubscriptionResponseTemplate = `
$util.toJson($ctx.result)
`;

// Task Updated Subscription Request
exports.taskUpdatedSubscriptionRequestTemplate = `
{
  "version": "2017-02-28",
  "operation": "GetItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($ctx.source.id)
  }
}`;

// Task Updated Subscription Response
exports.taskUpdatedSubscriptionResponseTemplate = `
$util.toJson($ctx.result)
`;

// Notification Created Subscription Request
exports.notificationCreatedSubscriptionRequestTemplate = `
{
  "version": "2017-02-28",
  "operation": "GetItem",
  "key": {
    "id": $util.dynamodb.toDynamoDBJson($ctx.source.id)
  }
}`;

// Notification Created Subscription Response
exports.notificationCreatedSubscriptionResponseTemplate = `
$util.toJson($ctx.result)
`;

// =============================================================================
// Error Handling Templates
// =============================================================================

// Validation Error Template
exports.validationErrorTemplate = `
{
  "error": {
    "message": "Validation failed",
    "type": "ValidationError",
    "details": $util.toJson($ctx.error.validationErrors)
  }
}`;

// Authorization Error Template
exports.authorizationErrorTemplate = `
{
  "error": {
    "message": "Access denied",
    "type": "AuthorizationError"
  }
}`;

// Database Error Template
exports.databaseErrorTemplate = `
{
  "error": {
    "message": "Database operation failed",
    "type": "DatabaseError",
    "details": $util.toJson($ctx.error)
  }
}`;

// =============================================================================
// Utility Templates
// =============================================================================

// Add Timestamps Template
exports.addTimestampsTemplate = `
#set($now = $util.time.nowISO8601())
#set($input = $ctx.args.input)
#set($input.createdAt = $now)
#set($input.updatedAt = $now)
$util.toJson($input)
`;

// Generate ID Template
exports.generateIdTemplate = `
#set($id = $util.autoId())
#set($input = $ctx.args.input)
#set($input.id = $id)
$util.toJson($input)
`;

// Format Response Template
exports.formatResponseTemplate = `
{
  "data": $util.toJson($ctx.result),
  "timestamp": "$util.time.nowISO8601()",
  "requestId": "$context.requestId"
}`;
