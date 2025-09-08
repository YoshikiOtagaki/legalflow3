import { defineAuth } from '@aws-amplify/backend';

export const userGroups = {
  // 管理者グループ
  ADMIN: {
    groupName: 'Admin',
    description: 'システム管理者',
    precedence: 1,
    policies: [
      {
        policyName: 'AdminFullAccess',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: '*',
              Resource: '*'
            }
          ]
        }
      }
    ]
  },

  // 弁護士グループ
  LAWYER: {
    groupName: 'Lawyer',
    description: '弁護士',
    precedence: 2,
    policies: [
      {
        policyName: 'LawyerAccess',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan'
              ],
              Resource: [
                'arn:aws:dynamodb:*:*:table/Cases',
                'arn:aws:dynamodb:*:*:table/Cases/index/*',
                'arn:aws:dynamodb:*:*:table/Parties',
                'arn:aws:dynamodb:*:*:table/Parties/index/*',
                'arn:aws:dynamodb:*:*:table/Tasks',
                'arn:aws:dynamodb:*:*:table/Tasks/index/*',
                'arn:aws:dynamodb:*:*:table/TimesheetEntries',
                'arn:aws:dynamodb:*:*:table/TimesheetEntries/index/*'
              ]
            },
            {
              Effect: 'Allow',
              Action: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject'
              ],
              Resource: 'arn:aws:s3:::legalflow3-documents/*'
            }
          ]
        }
      }
    ]
  },

  // パラリーガルグループ
  PARALEGAL: {
    groupName: 'Paralegal',
    description: 'パラリーガル',
    precedence: 3,
    policies: [
      {
        policyName: 'ParalegalAccess',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'dynamodb:GetItem',
                'dynamodb:Query',
                'dynamodb:Scan'
              ],
              Resource: [
                'arn:aws:dynamodb:*:*:table/Cases',
                'arn:aws:dynamodb:*:*:table/Cases/index/*',
                'arn:aws:dynamodb:*:*:table/Parties',
                'arn:aws:dynamodb:*:*:table/Parties/index/*',
                'arn:aws:dynamodb:*:*:table/Tasks',
                'arn:aws:dynamodb:*:*:table/Tasks/index/*'
              ]
            },
            {
              Effect: 'Allow',
              Action: [
                'dynamodb:PutItem',
                'dynamodb:UpdateItem'
              ],
              Resource: [
                'arn:aws:dynamodb:*:*:table/Tasks',
                'arn:aws:dynamodb:*:*:table/TimesheetEntries'
              ]
            },
            {
              Effect: 'Allow',
              Action: [
                's3:GetObject',
                's3:PutObject'
              ],
              Resource: 'arn:aws:s3:::legalflow3-documents/*'
            }
          ]
        }
      }
    ]
  },

  // クライアントグループ
  CLIENT: {
    groupName: 'Client',
    description: 'クライアント',
    precedence: 4,
    policies: [
      {
        policyName: 'ClientReadOnlyAccess',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'dynamodb:GetItem',
                'dynamodb:Query'
              ],
              Resource: [
                'arn:aws:dynamodb:*:*:table/Cases',
                'arn:aws:dynamodb:*:*:table/Cases/index/*'
              ],
              Condition: {
                'ForAllValues:StringEquals': {
                  'dynamodb:Attributes': ['PK', 'SK', 'name', 'status', 'createdAt']
                }
              }
            },
            {
              Effect: 'Allow',
              Action: [
                's3:GetObject'
              ],
              Resource: 'arn:aws:s3:::legalflow3-documents/client/*'
            }
          ]
        }
      }
    ]
  }
};

export const createUserGroups = async () => {
  // ユーザーグループの作成はCognitoコンソールまたはCLIで行う
  // この関数は参考用
  return userGroups;
};
