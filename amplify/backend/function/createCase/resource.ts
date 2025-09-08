// LegalFlow3 - Create Case Lambda Function Resource
// AWS Lambda function resource definition

import { defineFunction } from '@aws-amplify/backend';

export const createCase = defineFunction({
  name: 'createCase',
  entry: './src/index.js',
  runtime: 18,
  timeoutSeconds: 30,
  memoryMB: 256,
  environment: {
    NODE_ENV: 'production'
  }
});
