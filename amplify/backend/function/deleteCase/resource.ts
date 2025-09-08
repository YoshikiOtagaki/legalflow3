// LegalFlow3 - Delete Case Lambda Function Resource
// AWS Lambda function resource definition

import { defineFunction } from '@aws-amplify/backend';

export const deleteCase = defineFunction({
  name: 'deleteCase',
  entry: './src/index.js',
  runtime: 18,
  timeoutSeconds: 60,
  memoryMB: 512,
  environment: {
    NODE_ENV: 'production'
  }
});
