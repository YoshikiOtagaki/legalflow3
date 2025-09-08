// LegalFlow3 - DynamoDB Tables Resource
// DynamoDB tables definition for LegalFlow3

import { defineData } from '@aws-amplify/backend';
import { type Schema } from './schema';

export const data = defineData({
  schema: './schema.graphql',
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30
    }
  }
});

// Export table names for Lambda functions
export const tableNames = {
  Cases: 'Cases',
  CaseAssignments: 'CaseAssignments',
  CaseParties: 'CaseParties',
  Parties: 'Parties',
  Tasks: 'Tasks',
  TimesheetEntries: 'TimesheetEntries',
  Memos: 'Memos',
  Subscriptions: 'Subscriptions',
  Users: 'Users',
  Categories: 'Categories',
  Phases: 'Phases'
};
