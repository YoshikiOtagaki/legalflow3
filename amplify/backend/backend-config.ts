// LegalFlow3 - AWS Amplify Backend Configuration
// Backend configuration for AWS Amplify

import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { createCase } from './function/createCase/resource';
import { updateCase } from './function/updateCase/resource';
import { deleteCase } from './function/deleteCase/resource';
import { getCase } from './function/getCase/resource';
import { listCases } from './function/listCases/resource';
import { searchCases } from './function/searchCases/resource';

const backend = defineBackend({
  auth,
  data,
  createCase,
  updateCase,
  deleteCase,
  getCase,
  listCases,
  searchCases,
});

// Grant permissions to Lambda functions
backend.createCase.resources.lambda.addToRolePolicy({
  Effect: 'Allow',
  Action: [
    'dynamodb:PutItem',
    'dynamodb:GetItem',
    'dynamodb:UpdateItem',
    'dynamodb:DeleteItem',
    'dynamodb:Query',
    'dynamodb:Scan'
  ],
  Resource: [
    backend.data.resources.tables.Cases.arn,
    backend.data.resources.tables.CaseAssignments.arn,
    backend.data.resources.tables.Subscriptions.arn
  ]
});

backend.updateCase.resources.lambda.addToRolePolicy({
  Effect: 'Allow',
  Action: [
    'dynamodb:PutItem',
    'dynamodb:GetItem',
    'dynamodb:UpdateItem',
    'dynamodb:DeleteItem',
    'dynamodb:Query',
    'dynamodb:Scan'
  ],
  Resource: [
    backend.data.resources.tables.Cases.arn,
    backend.data.resources.tables.CaseAssignments.arn
  ]
});

backend.deleteCase.resources.lambda.addToRolePolicy({
  Effect: 'Allow',
  Action: [
    'dynamodb:PutItem',
    'dynamodb:GetItem',
    'dynamodb:UpdateItem',
    'dynamodb:DeleteItem',
    'dynamodb:Query',
    'dynamodb:Scan'
  ],
  Resource: [
    backend.data.resources.tables.Cases.arn,
    backend.data.resources.tables.CaseAssignments.arn,
    backend.data.resources.tables.CaseParties.arn,
    backend.data.resources.tables.Tasks.arn,
    backend.data.resources.tables.TimesheetEntries.arn,
    backend.data.resources.tables.Memos.arn,
    backend.data.resources.tables.Subscriptions.arn
  ]
});

backend.getCase.resources.lambda.addToRolePolicy({
  Effect: 'Allow',
  Action: [
    'dynamodb:GetItem',
    'dynamodb:Query',
    'dynamodb:Scan'
  ],
  Resource: [
    backend.data.resources.tables.Cases.arn,
    backend.data.resources.tables.CaseAssignments.arn,
    backend.data.resources.tables.CaseParties.arn,
    backend.data.resources.tables.Parties.arn,
    backend.data.resources.tables.Tasks.arn,
    backend.data.resources.tables.TimesheetEntries.arn,
    backend.data.resources.tables.Memos.arn
  ]
});

backend.listCases.resources.lambda.addToRolePolicy({
  Effect: 'Allow',
  Action: [
    'dynamodb:Query',
    'dynamodb:Scan'
  ],
  Resource: [
    backend.data.resources.tables.Cases.arn,
    backend.data.resources.tables.CaseAssignments.arn
  ]
});

backend.searchCases.resources.lambda.addToRolePolicy({
  Effect: 'Allow',
  Action: [
    'dynamodb:Query',
    'dynamodb:Scan'
  ],
  Resource: [
    backend.data.resources.tables.Cases.arn,
    backend.data.resources.tables.CaseAssignments.arn
  ]
});

// Set environment variables for Lambda functions
backend.createCase.resources.lambda.addEnvironment('CASES_TABLE_NAME', backend.data.resources.tables.Cases.tableName);
backend.createCase.resources.lambda.addEnvironment('CASE_ASSIGNMENTS_TABLE_NAME', backend.data.resources.tables.CaseAssignments.tableName);
backend.createCase.resources.lambda.addEnvironment('SUBSCRIPTIONS_TABLE_NAME', backend.data.resources.tables.Subscriptions.tableName);

backend.updateCase.resources.lambda.addEnvironment('CASES_TABLE_NAME', backend.data.resources.tables.Cases.tableName);
backend.updateCase.resources.lambda.addEnvironment('CASE_ASSIGNMENTS_TABLE_NAME', backend.data.resources.tables.CaseAssignments.tableName);

backend.deleteCase.resources.lambda.addEnvironment('CASES_TABLE_NAME', backend.data.resources.tables.Cases.tableName);
backend.deleteCase.resources.lambda.addEnvironment('CASE_ASSIGNMENTS_TABLE_NAME', backend.data.resources.tables.CaseAssignments.tableName);
backend.deleteCase.resources.lambda.addEnvironment('CASE_PARTIES_TABLE_NAME', backend.data.resources.tables.CaseParties.tableName);
backend.deleteCase.resources.lambda.addEnvironment('TASKS_TABLE_NAME', backend.data.resources.tables.Tasks.tableName);
backend.deleteCase.resources.lambda.addEnvironment('TIMESHEET_ENTRIES_TABLE_NAME', backend.data.resources.tables.TimesheetEntries.tableName);
backend.deleteCase.resources.lambda.addEnvironment('MEMOS_TABLE_NAME', backend.data.resources.tables.Memos.tableName);
backend.deleteCase.resources.lambda.addEnvironment('SUBSCRIPTIONS_TABLE_NAME', backend.data.resources.tables.Subscriptions.tableName);

backend.getCase.resources.lambda.addEnvironment('CASES_TABLE_NAME', backend.data.resources.tables.Cases.tableName);
backend.getCase.resources.lambda.addEnvironment('CASE_ASSIGNMENTS_TABLE_NAME', backend.data.resources.tables.CaseAssignments.tableName);
backend.getCase.resources.lambda.addEnvironment('CASE_PARTIES_TABLE_NAME', backend.data.resources.tables.CaseParties.tableName);
backend.getCase.resources.lambda.addEnvironment('PARTIES_TABLE_NAME', backend.data.resources.tables.Parties.tableName);
backend.getCase.resources.lambda.addEnvironment('TASKS_TABLE_NAME', backend.data.resources.tables.Tasks.tableName);
backend.getCase.resources.lambda.addEnvironment('TIMESHEET_ENTRIES_TABLE_NAME', backend.data.resources.tables.TimesheetEntries.tableName);
backend.getCase.resources.lambda.addEnvironment('MEMOS_TABLE_NAME', backend.data.resources.tables.Memos.tableName);

backend.listCases.resources.lambda.addEnvironment('CASES_TABLE_NAME', backend.data.resources.tables.Cases.tableName);
backend.listCases.resources.lambda.addEnvironment('CASE_ASSIGNMENTS_TABLE_NAME', backend.data.resources.tables.CaseAssignments.tableName);

backend.searchCases.resources.lambda.addEnvironment('CASES_TABLE_NAME', backend.data.resources.tables.Cases.tableName);
backend.searchCases.resources.lambda.addEnvironment('CASE_ASSIGNMENTS_TABLE_NAME', backend.data.resources.tables.CaseAssignments.tableName);

export default backend;
