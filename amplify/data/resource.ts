import { defineData } from '@aws-amplify/backend';

export const data = defineData({
  schema: 'schema.graphql',
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
