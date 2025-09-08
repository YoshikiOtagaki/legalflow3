// LegalFlow3 - Resolver Mapping Templates
// VTL mapping templates for AppSync resolvers

export const requestTemplates = {
  createCase: `
    {
      "version": "2017-02-28",
      "operation": "Invoke",
      "payload": {
        "arguments": $util.toJson($context.arguments),
        "identity": $util.toJson($context.identity),
        "source": $util.toJson($context.source)
      }
    }
  `,

  updateCase: `
    {
      "version": "2017-02-28",
      "operation": "Invoke",
      "payload": {
        "arguments": $util.toJson($context.arguments),
        "identity": $util.toJson($context.identity),
        "source": $util.toJson($context.source)
      }
    }
  `,

  deleteCase: `
    {
      "version": "2017-02-28",
      "operation": "Invoke",
      "payload": {
        "arguments": $util.toJson($context.arguments),
        "identity": $util.toJson($context.identity),
        "source": $util.toJson($context.source)
      }
    }
  `,

  getCase: `
    {
      "version": "2017-02-28",
      "operation": "Invoke",
      "payload": {
        "arguments": $util.toJson($context.arguments),
        "identity": $util.toJson($context.identity),
        "source": $util.toJson($context.source)
      }
    }
  `,

  listCases: `
    {
      "version": "2017-02-28",
      "operation": "Invoke",
      "payload": {
        "arguments": $util.toJson($context.arguments),
        "identity": $util.toJson($context.identity),
        "source": $util.toJson($context.source)
      }
    }
  `,

  searchCases: `
    {
      "version": "2017-02-28",
      "operation": "Invoke",
      "payload": {
        "arguments": $util.toJson($context.arguments),
        "identity": $util.toJson($context.identity),
        "source": $util.toJson($context.source)
      }
    }
  `
};

export const responseTemplates = {
  createCase: `
    #if($ctx.error)
      $util.error($ctx.error.message, $ctx.error.type)
    #end
    $util.toJson($ctx.result)
  `,

  updateCase: `
    #if($ctx.error)
      $util.error($ctx.error.message, $ctx.error.type)
    #end
    $util.toJson($ctx.result)
  `,

  deleteCase: `
    #if($ctx.error)
      $util.error($ctx.error.message, $ctx.error.type)
    #end
    $util.toJson($ctx.result)
  `,

  getCase: `
    #if($ctx.error)
      $util.error($ctx.error.message, $ctx.error.type)
    #end
    $util.toJson($ctx.result)
  `,

  listCases: `
    #if($ctx.error)
      $util.error($ctx.error.message, $ctx.error.type)
    #end
    $util.toJson($ctx.result)
  `,

  searchCases: `
    #if($ctx.error)
      $util.error($ctx.error.message, $ctx.error.type)
    #end
    $util.toJson($ctx.result)
  `
};
