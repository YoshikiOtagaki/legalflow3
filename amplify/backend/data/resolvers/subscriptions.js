// LegalFlow3 - GraphQL Subscription Resolvers
// Subscription resolvers for AppSync GraphQL API

export const resolvers = {
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
