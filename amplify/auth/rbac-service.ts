import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// 権限の種類
export enum Permission {
  // ケース管理
  CASES_CREATE = 'cases:create',
  CASES_READ = 'cases:read',
  CASES_UPDATE = 'cases:update',
  CASES_DELETE = 'cases:delete',
  CASES_LIST = 'cases:list',
  CASES_SEARCH = 'cases:search',

  // 当事者管理
  PARTIES_CREATE = 'parties:create',
  PARTIES_READ = 'parties:read',
  PARTIES_UPDATE = 'parties:update',
  PARTIES_DELETE = 'parties:delete',
  PARTIES_LIST = 'parties:list',

  // タスク管理
  TASKS_CREATE = 'tasks:create',
  TASKS_READ = 'tasks:read',
  TASKS_UPDATE = 'tasks:update',
  TASKS_DELETE = 'tasks:delete',
  TASKS_LIST = 'tasks:list',

  // タイムシート管理
  TIMESHEET_CREATE = 'timesheet:create',
  TIMESHEET_READ = 'timesheet:read',
  TIMESHEET_UPDATE = 'timesheet:update',
  TIMESHEET_DELETE = 'timesheet:delete',
  TIMESHEET_LIST = 'timesheet:list',

  // ユーザー管理
  USERS_CREATE = 'users:create',
  USERS_READ = 'users:read',
  USERS_UPDATE = 'users:update',
  USERS_DELETE = 'users:delete',
  USERS_LIST = 'users:list',

  // システム管理
  SYSTEM_ADMIN = 'system:admin',
  SYSTEM_CONFIG = 'system:config',
  SYSTEM_AUDIT = 'system:audit'
}

// リソースの種類
export enum Resource {
  CASES = 'cases',
  PARTIES = 'parties',
  TASKS = 'tasks',
  TIMESHEETS = 'timesheets',
  USERS = 'users',
  SYSTEM = 'system'
}

// アクションの種類
export enum Action {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  SEARCH = 'search',
  ADMIN = 'admin',
  CONFIG = 'config',
  AUDIT = 'audit'
}

// 権限チェック結果
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  requiredPermissions?: Permission[];
}

// ユーザー権限情報
export interface UserPermissions {
  userId: string;
  role: string;
  permissions: Permission[];
  customPermissions: Permission[];
  restrictions: PermissionRestriction[];
}

// 権限制限
export interface PermissionRestriction {
  resource: string;
  action: string;
  condition: string;
  value: any;
}

// ロールベースアクセス制御サービス
export class RBACService {
  private static instance: RBACService;

  public static getInstance(): RBACService {
    if (!RBACService.instance) {
      RBACService.instance = new RBACService();
    }
    return RBACService.instance;
  }

  // ユーザーの権限を取得
  async getUserPermissions(userId: string): Promise<UserPermissions | null> {
    try {
      const result = await docClient.send(new GetCommand({
        TableName: process.env.USERS_TABLE,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PERMISSIONS'
        }
      }));

      if (!result.Item) {
        return null;
      }

      return {
        userId: result.Item.userId,
        role: result.Item.role,
        permissions: result.Item.permissions || [],
        customPermissions: result.Item.customPermissions || [],
        restrictions: result.Item.restrictions || []
      };
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return null;
    }
  }

  // 権限チェック
  async checkPermission(
    userId: string,
    resource: Resource,
    action: Action,
    context?: Record<string, any>
  ): Promise<PermissionCheckResult> {
    try {
      const userPermissions = await this.getUserPermissions(userId);

      if (!userPermissions) {
        return {
          allowed: false,
          reason: 'User permissions not found'
        };
      }

      // 必要な権限を取得
      const requiredPermission = this.getRequiredPermission(resource, action);

      // 権限チェック
      const hasPermission = userPermissions.permissions.includes(requiredPermission) ||
                           userPermissions.customPermissions.includes(requiredPermission);

      if (!hasPermission) {
        return {
          allowed: false,
          reason: 'Insufficient permissions',
          requiredPermissions: [requiredPermission]
        };
      }

      // 制限チェック
      const restrictionCheck = await this.checkRestrictions(userPermissions, resource, action, context);
      if (!restrictionCheck.allowed) {
        return restrictionCheck;
      }

      return { allowed: true };

    } catch (error) {
      console.error('Error checking permission:', error);
      return {
        allowed: false,
        reason: 'Permission check failed'
      };
    }
  }

  // 必要な権限を取得
  private getRequiredPermission(resource: Resource, action: Action): Permission {
    const permissionMap: Record<string, Record<string, Permission>> = {
      [Resource.CASES]: {
        [Action.CREATE]: Permission.CASES_CREATE,
        [Action.READ]: Permission.CASES_READ,
        [Action.UPDATE]: Permission.CASES_UPDATE,
        [Action.DELETE]: Permission.CASES_DELETE,
        [Action.LIST]: Permission.CASES_LIST,
        [Action.SEARCH]: Permission.CASES_SEARCH
      },
      [Resource.PARTIES]: {
        [Action.CREATE]: Permission.PARTIES_CREATE,
        [Action.READ]: Permission.PARTIES_READ,
        [Action.UPDATE]: Permission.PARTIES_UPDATE,
        [Action.DELETE]: Permission.PARTIES_DELETE,
        [Action.LIST]: Permission.PARTIES_LIST
      },
      [Resource.TASKS]: {
        [Action.CREATE]: Permission.TASKS_CREATE,
        [Action.READ]: Permission.TASKS_READ,
        [Action.UPDATE]: Permission.TASKS_UPDATE,
        [Action.DELETE]: Permission.TASKS_DELETE,
        [Action.LIST]: Permission.TASKS_LIST
      },
      [Resource.TIMESHEETS]: {
        [Action.CREATE]: Permission.TIMESHEET_CREATE,
        [Action.READ]: Permission.TIMESHEET_READ,
        [Action.UPDATE]: Permission.TIMESHEET_UPDATE,
        [Action.DELETE]: Permission.TIMESHEET_DELETE,
        [Action.LIST]: Permission.TIMESHEET_LIST
      },
      [Resource.USERS]: {
        [Action.CREATE]: Permission.USERS_CREATE,
        [Action.READ]: Permission.USERS_READ,
        [Action.UPDATE]: Permission.USERS_UPDATE,
        [Action.DELETE]: Permission.USERS_DELETE,
        [Action.LIST]: Permission.USERS_LIST
      },
      [Resource.SYSTEM]: {
        [Action.ADMIN]: Permission.SYSTEM_ADMIN,
        [Action.CONFIG]: Permission.SYSTEM_CONFIG,
        [Action.AUDIT]: Permission.SYSTEM_AUDIT
      }
    };

    return permissionMap[resource]?.[action] || Permission.CASES_READ;
  }

  // 制限チェック
  private async checkRestrictions(
    userPermissions: UserPermissions,
    resource: Resource,
    action: Action,
    context?: Record<string, any>
  ): Promise<PermissionCheckResult> {
    for (const restriction of userPermissions.restrictions) {
      if (restriction.resource === resource && restriction.action === action) {
        const conditionResult = await this.evaluateCondition(restriction, context);
        if (!conditionResult) {
          return {
            allowed: false,
            reason: `Restriction: ${restriction.condition}`
          };
        }
      }
    }

    return { allowed: true };
  }

  // 条件評価
  private async evaluateCondition(
    restriction: PermissionRestriction,
    context?: Record<string, any>
  ): Promise<boolean> {
    // 簡略化された条件評価
    // 実際の実装では、より複雑な条件をサポート

    switch (restriction.condition) {
      case 'owner_only':
        return context?.userId === context?.resourceOwnerId;
      case 'law_firm_only':
        return context?.userLawFirmId === context?.resourceLawFirmId;
      case 'case_assigned':
        return context?.userCaseIds?.includes(context?.caseId);
      case 'time_restriction':
        const now = new Date();
        const startTime = new Date(restriction.value.start);
        const endTime = new Date(restriction.value.end);
        return now >= startTime && now <= endTime;
      default:
        return true;
    }
  }

  // 権限の更新
  async updateUserPermissions(
    userId: string,
    permissions: Permission[],
    customPermissions: Permission[] = [],
    restrictions: PermissionRestriction[] = []
  ): Promise<boolean> {
    try {
      await docClient.send(new PutCommand({
        TableName: process.env.USERS_TABLE,
        Item: {
          PK: `USER#${userId}`,
          SK: 'PERMISSIONS',
          userId,
          permissions,
          customPermissions,
          restrictions,
          updatedAt: new Date().toISOString()
        }
      }));

      return true;
    } catch (error) {
      console.error('Error updating user permissions:', error);
      return false;
    }
  }

  // ロールの権限を取得
  async getRolePermissions(role: string): Promise<Permission[]> {
    const rolePermissions: Record<string, Permission[]> = {
      'ADMIN': [
        Permission.CASES_CREATE,
        Permission.CASES_READ,
        Permission.CASES_UPDATE,
        Permission.CASES_DELETE,
        Permission.CASES_LIST,
        Permission.CASES_SEARCH,
        Permission.PARTIES_CREATE,
        Permission.PARTIES_READ,
        Permission.PARTIES_UPDATE,
        Permission.PARTIES_DELETE,
        Permission.PARTIES_LIST,
        Permission.TASKS_CREATE,
        Permission.TASKS_READ,
        Permission.TASKS_UPDATE,
        Permission.TASKS_DELETE,
        Permission.TASKS_LIST,
        Permission.TIMESHEET_CREATE,
        Permission.TIMESHEET_READ,
        Permission.TIMESHEET_UPDATE,
        Permission.TIMESHEET_DELETE,
        Permission.TIMESHEET_LIST,
        Permission.USERS_CREATE,
        Permission.USERS_READ,
        Permission.USERS_UPDATE,
        Permission.USERS_DELETE,
        Permission.USERS_LIST,
        Permission.SYSTEM_ADMIN,
        Permission.SYSTEM_CONFIG,
        Permission.SYSTEM_AUDIT
      ],
      'LAWYER': [
        Permission.CASES_CREATE,
        Permission.CASES_READ,
        Permission.CASES_UPDATE,
        Permission.CASES_LIST,
        Permission.CASES_SEARCH,
        Permission.PARTIES_CREATE,
        Permission.PARTIES_READ,
        Permission.PARTIES_UPDATE,
        Permission.PARTIES_LIST,
        Permission.TASKS_CREATE,
        Permission.TASKS_READ,
        Permission.TASKS_UPDATE,
        Permission.TASKS_LIST,
        Permission.TIMESHEET_CREATE,
        Permission.TIMESHEET_READ,
        Permission.TIMESHEET_UPDATE,
        Permission.TIMESHEET_LIST
      ],
      'PARALEGAL': [
        Permission.CASES_READ,
        Permission.CASES_LIST,
        Permission.CASES_SEARCH,
        Permission.PARTIES_CREATE,
        Permission.PARTIES_READ,
        Permission.PARTIES_UPDATE,
        Permission.PARTIES_LIST,
        Permission.TASKS_CREATE,
        Permission.TASKS_READ,
        Permission.TASKS_UPDATE,
        Permission.TASKS_LIST,
        Permission.TIMESHEET_CREATE,
        Permission.TIMESHEET_READ,
        Permission.TIMESHEET_UPDATE,
        Permission.TIMESHEET_LIST
      ],
      'CLIENT': [
        Permission.CASES_READ,
        Permission.CASES_LIST,
        Permission.TASKS_READ,
        Permission.TASKS_LIST
      ]
    };

    return rolePermissions[role] || [];
  }

  // 監査ログの記録
  async logPermissionCheck(
    userId: string,
    resource: Resource,
    action: Action,
    result: PermissionCheckResult,
    context?: Record<string, any>
  ): Promise<void> {
    try {
      await docClient.send(new PutCommand({
        TableName: process.env.AUDIT_LOGS_TABLE || 'AuditLogs',
        Item: {
          PK: `AUDIT#${new Date().toISOString()}`,
          SK: `PERMISSION#${userId}`,
          userId,
          resource,
          action,
          result: result.allowed,
          reason: result.reason,
          context,
          timestamp: new Date().toISOString()
        }
      }));
    } catch (error) {
      console.error('Error logging permission check:', error);
    }
  }
}

// 権限チェックミドルウェア
export const permissionMiddleware = (resource: Resource, action: Action) => {
  return async (req: any, res: any, next: any) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'User not authenticated',
            code: 'UNAUTHORIZED'
          }
        });
      }

      const rbacService = RBACService.getInstance();
      const result = await rbacService.checkPermission(userId, resource, action, {
        userId,
        ...req.body,
        ...req.query,
        ...req.params
      });

      if (!result.allowed) {
        // 監査ログを記録
        await rbacService.logPermissionCheck(userId, resource, action, result, {
          userId,
          ...req.body,
          ...req.query,
          ...req.params
        });

        return res.status(403).json({
          success: false,
          error: {
            message: result.reason || 'Access denied',
            code: 'FORBIDDEN',
            requiredPermissions: result.requiredPermissions
          }
        });
      }

      req.permissionContext = {
        resource,
        action,
        userId
      };

      next();
    } catch (error) {
      console.error('Permission middleware error:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Permission check failed',
          code: 'INTERNAL_ERROR'
        }
      });
    }
  };
};
