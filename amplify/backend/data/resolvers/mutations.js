// LegalFlow3 - GraphQL Mutation Resolvers
// Mutation resolvers for AppSync GraphQL API

import { createCase, updateCase, deleteCase } from '../functions';

export const resolvers = {
  Mutation: {
    createCase: async (ctx) => {
      const { input } = ctx.arguments;
      const result = await createCase(ctx, input);

      // Publish subscription event
      if (result.success) {
        await ctx.pubsub.publish('onCaseCreated', result.case);
      }

      return result;
    },

    updateCase: async (ctx) => {
      const { input } = ctx.arguments;
      const result = await updateCase(ctx, input);

      // Publish subscription event
      if (result.success) {
        await ctx.pubsub.publish('onCaseUpdated', result.case);
      }

      return result;
    },

    deleteCase: async (ctx) => {
      const { id } = ctx.arguments;
      const result = await deleteCase(ctx, { id });

      // Publish subscription event
      if (result.success) {
        await ctx.pubsub.publish('onCaseDeleted', result.case);
      }

      return result;
    }
  }
};
