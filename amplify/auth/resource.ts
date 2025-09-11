import { defineAuth } from '@aws-amplify/backend';
import { defineFunction } from '@aws-amplify/backend-function';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    email: {
      required: true,
    },
    givenName: {
      required: true,
    },
    familyName: {
      required: true,
    },
  },
  triggers: {
    preSignUp: defineFunction({
      entry: './triggers/preSignUpTrigger.ts',
    }),
    postConfirmation: defineFunction({
      entry: './triggers/postConfirmationTrigger.ts',
    }),
    preAuthentication: defineFunction({
      entry: './triggers/preAuthenticationTrigger.ts',
    }),
    postAuthentication: defineFunction({
      entry: './triggers/postAuthenticationTrigger.ts',
    }),
    customMessage: defineFunction({
      entry: './triggers/customMessageTrigger.ts',
    }),
  },
});
