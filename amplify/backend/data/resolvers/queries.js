// LegalFlow3 - GraphQL Query Resolvers
// Query resolvers for AppSync GraphQL API

import { createCase, updateCase, deleteCase, getCase, listCases, searchCases } from '../functions';

export const resolvers = {
  Query: {
    getCase: async (ctx) => {
      const { id } = ctx.arguments;
      return await getCase(ctx, { id });
    },

    listCases: async (ctx) => {
      const { limit, nextToken, status, categoryId } = ctx.arguments;
      return await listCases(ctx, { limit, nextToken, status, categoryId });
    },

    searchCases: async (ctx) => {
      const { filter, limit, nextToken } = ctx.arguments;
      return await searchCases(ctx, { filter, limit, nextToken });
    }
  },

  Mutation: {
    createCase: async (ctx) => {
      const { input } = ctx.arguments;
      return await createCase(ctx, input);
    },

    updateCase: async (ctx) => {
      const { input } = ctx.arguments;
      return await updateCase(ctx, input);
    },

    deleteCase: async (ctx) => {
      const { id } = ctx.arguments;
      return await deleteCase(ctx, { id });
    }
  },

  Subscription: {
    onCaseCreated: {
      subscribe: (ctx) => {
        return ctx.pubsub.subscribe('onCaseCreated');
      }
    },

    onCaseUpdated: {
      subscribe: (ctx) => {
        return ctx.pubsub.subscribe('onCaseUpdated');
      }
    },

    onCaseDeleted: {
      subscribe: (ctx) => {
        return ctx.pubsub.subscribe('onCaseDeleted');
      }
    }
  }
};
