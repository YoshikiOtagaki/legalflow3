// ロール定義
export enum UserRole {
  ADMIN = 'Admin',
  LAWYER = 'Lawyer',
  CLIENT = 'Client',
  STAFF = 'Staff'
}

// 権限定義
export enum Permission {
  // ユーザー管理
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',

  // ケース管理
  CASE_CREATE = 'case:create',
  CASE_READ = 'case:read',
  CASE_UPDATE = 'case:update',
  CASE_DELETE = 'case:delete',
  CASE_ASSIGN = 'case:assign',
  CASE_CLOSE = 'case:close',

  // 当事者管理
  PARTY_CREATE = 'party:create',
  PARTY_READ = 'party:read',
  PARTY_UPDATE = 'party:update',
  PARTY_DELETE = 'party:delete',

  // 弁護士管理
  LAWYER_CREATE = 'lawyer:create',
  LAWYER_READ = 'lawyer:read',
  LAWYER_UPDATE = 'lawyer:update',
  LAWYER_DELETE = 'lawyer:delete',

  // 弁護士法人管理
  LAW_FIRM_CREATE = 'law_firm:create',
  LAW_FIRM_READ = 'law_firm:read',
  LAW_FIRM_UPDATE = 'law_firm:update',
  LAW_FIRM_DELETE = 'law_firm:delete',

  // 裁判所管理
  COURTHOUSE_CREATE = 'courthouse:create',
  COURTHOUSE_READ = 'courthouse:read',
  COURTHOUSE_UPDATE = 'courthouse:update',
  COURTHOUSE_DELETE = 'courthouse:delete',

  // タスク管理
  TASK_CREATE = 'task:create',
  TASK_READ = 'task:read',
  TASK_UPDATE = 'task:update',
  TASK_DELETE = 'task:delete',
  TASK_ASSIGN = 'task:assign',

  // ドキュメント管理
  DOCUMENT_CREATE = 'document:create',
  DOCUMENT_READ = 'document:read',
  DOCUMENT_UPDATE = 'document:update',
  DOCUMENT_DELETE = 'document:delete',

  // タイムシート管理
  TIMESHEET_CREATE = 'timesheet:create',
  TIMESHEET_READ = 'timesheet:read',
  TIMESHEET_UPDATE = 'timesheet:update',
  TIMESHEET_DELETE = 'timesheet:delete',

  // 経費管理
  EXPENSE_CREATE = 'expense:create',
  EXPENSE_READ = 'expense:read',
  EXPENSE_UPDATE = 'expense:update',
  EXPENSE_DELETE = 'expense:delete',

  // 通知管理
  NOTIFICATION_CREATE = 'notification:create',
  NOTIFICATION_READ = 'notification:read',
  NOTIFICATION_UPDATE = 'notification:update',
  NOTIFICATION_DELETE = 'notification:delete',

  // システム管理
  SYSTEM_CONFIG = 'system:config',
  SYSTEM_LOGS = 'system:logs',
  SYSTEM_BACKUP = 'system:backup'
}

// ロールと権限のマッピング
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // 全権限
    ...Object.values(Permission)
  ],

  [UserRole.LAWYER]: [
    // ケース管理
    Permission.CASE_CREATE,
    Permission.CASE_READ,
    Permission.CASE_UPDATE,
    Permission.CASE_ASSIGN,
    Permission.CASE_CLOSE,

    // 当事者管理
    Permission.PARTY_CREATE,
    Permission.PARTY_READ,
    Permission.PARTY_UPDATE,
    Permission.PARTY_DELETE,

    // 弁護士管理（自分の情報のみ）
    Permission.LAWYER_READ,
    Permission.LAWYER_UPDATE,

    // 弁護士法人管理（自分の所属法人のみ）
    Permission.LAW_FIRM_READ,

    // 裁判所管理
    Permission.COURTHOUSE_READ,

    // タスク管理
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
    Permission.TASK_ASSIGN,

    // ドキュメント管理
    Permission.DOCUMENT_CREATE,
    Permission.DOCUMENT_READ,
    Permission.DOCUMENT_UPDATE,
    Permission.DOCUMENT_DELETE,

    // タイムシート管理
    Permission.TIMESHEET_CREATE,
    Permission.TIMESHEET_READ,
    Permission.TIMESHEET_UPDATE,
    Permission.TIMESHEET_DELETE,

    // 経費管理
    Permission.EXPENSE_CREATE,
    Permission.EXPENSE_READ,
    Permission.EXPENSE_UPDATE,
    Permission.EXPENSE_DELETE,

    // 通知管理
    Permission.NOTIFICATION_READ,
    Permission.NOTIFICATION_UPDATE
  ],

  [UserRole.CLIENT]: [
    // 自分のケースのみ
    Permission.CASE_READ,

    // 自分の情報のみ
    Permission.PARTY_READ,
    Permission.PARTY_UPDATE,

    // 通知管理
    Permission.NOTIFICATION_READ
  ],

  [UserRole.STAFF]: [
    // ケース管理（読み取り専用）
    Permission.CASE_READ,

    // 当事者管理
    Permission.PARTY_CREATE,
    Permission.PARTY_READ,
    Permission.PARTY_UPDATE,

    // 弁護士管理（読み取り専用）
    Permission.LAWYER_READ,

    // 弁護士法人管理（読み取り専用）
    Permission.LAW_FIRM_READ,

    // 裁判所管理（読み取り専用）
    Permission.COURTHOUSE_READ,

    // タスク管理
    Permission.TASK_CREATE,
    Permission.TASK_READ,
    Permission.TASK_UPDATE,

    // ドキュメント管理
    Permission.DOCUMENT_CREATE,
    Permission.DOCUMENT_READ,
    Permission.DOCUMENT_UPDATE,

    // タイムシート管理
    Permission.TIMESHEET_CREATE,
    Permission.TIMESHEET_READ,
    Permission.TIMESHEET_UPDATE,

    // 経費管理
    Permission.EXPENSE_CREATE,
    Permission.EXPENSE_READ,
    Permission.EXPENSE_UPDATE,

    // 通知管理
    Permission.NOTIFICATION_READ,
    Permission.NOTIFICATION_UPDATE
  ]
};

// リソースアクセス制御の型定義
export interface ResourceAccess {
  resourceType: string;
  resourceId?: string;
  action: string;
  conditions?: Record<string, any>;
}

// RBACサービスクラス
export class RBACService {
  /**
   * ユーザーが特定の権限を持っているかチェック
   * @param userRole ユーザーのロール
   * @param permission チェックする権限
   * @returns 権限があるかどうか
   */
  static hasPermission(userRole: UserRole, permission: Permission): boolean {
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    return rolePermissions.includes(permission);
  }

  /**
   * ユーザーが複数の権限のいずれかを持っているかチェック
   * @param userRole ユーザーのロール
   * @param permissions チェックする権限の配列
   * @returns いずれかの権限があるかどうか
   */
  static hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(userRole, permission));
  }

  /**
   * ユーザーがすべての権限を持っているかチェック
   * @param userRole ユーザーのロール
   * @param permissions チェックする権限の配列
   * @returns すべての権限があるかどうか
   */
  static hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(userRole, permission));
  }

  /**
   * ユーザーのロールに基づいて利用可能な権限を取得
   * @param userRole ユーザーのロール
   * @returns 利用可能な権限の配列
   */
  static getPermissions(userRole: UserRole): Permission[] {
    return ROLE_PERMISSIONS[userRole] || [];
  }

  /**
   * リソースアクセスをチェック
   * @param userRole ユーザーのロール
   * @param userId ユーザーID
   * @param resourceAccess リソースアクセス情報
   * @returns アクセス可能かどうか
   */
  static canAccessResource(
    userRole: UserRole,
    userId: string,
    resourceAccess: ResourceAccess
  ): boolean {
    const { resourceType, action, conditions } = resourceAccess;

    // 権限をチェック
    const permission = this.getPermissionFromAction(resourceType, action);
    if (!this.hasPermission(userRole, permission)) {
      return false;
    }

    // 条件に基づく追加チェック
    if (conditions) {
      return this.checkResourceConditions(userRole, userId, resourceAccess);
    }

    return true;
  }

  /**
   * アクションから権限を取得
   * @param resourceType リソースタイプ
   * @param action アクション
   * @returns 対応する権限
   */
  private static getPermissionFromAction(resourceType: string, action: string): Permission {
    const permissionKey = `${resourceType.toUpperCase()}_${action.toUpperCase()}` as keyof typeof Permission;
    return Permission[permissionKey] || Permission.SYSTEM_CONFIG;
  }

  /**
   * リソース条件をチェック
   * @param userRole ユーザーのロール
   * @param userId ユーザーID
   * @param resourceAccess リソースアクセス情報
   * @returns 条件を満たすかどうか
   */
  private static checkResourceConditions(
    userRole: UserRole,
    userId: string,
    resourceAccess: ResourceAccess
  ): boolean {
    const { resourceType, conditions } = resourceAccess;

    // 管理者はすべてのリソースにアクセス可能
    if (userRole === UserRole.ADMIN) {
      return true;
    }

    // リソースタイプ別の条件チェック
    switch (resourceType) {
      case 'case':
        return this.checkCaseAccess(userRole, userId, conditions);
      case 'party':
        return this.checkPartyAccess(userRole, userId, conditions);
      case 'lawyer':
        return this.checkLawyerAccess(userRole, userId, conditions);
      case 'timesheet':
        return this.checkTimesheetAccess(userRole, userId, conditions);
      default:
        return true;
    }
  }

  /**
   * ケースアクセス条件をチェック
   */
  private static checkCaseAccess(userRole: UserRole, userId: string, conditions: any): boolean {
    if (userRole === UserRole.CLIENT) {
      // クライアントは自分のケースのみアクセス可能
      return conditions?.assignedLawyerId === userId || conditions?.clientId === userId;
    }

    if (userRole === UserRole.LAWYER) {
      // 弁護士は割り当てられたケースのみアクセス可能
      return conditions?.assignedLawyerId === userId;
    }

    return true;
  }

  /**
   * 当事者アクセス条件をチェック
   */
  private static checkPartyAccess(userRole: UserRole, userId: string, conditions: any): boolean {
    if (userRole === UserRole.CLIENT) {
      // クライアントは自分の情報のみアクセス可能
      return conditions?.userId === userId;
    }

    return true;
  }

  /**
   * 弁護士アクセス条件をチェック
   */
  private static checkLawyerAccess(userRole: UserRole, userId: string, conditions: any): boolean {
    if (userRole === UserRole.LAWYER) {
      // 弁護士は自分の情報のみ更新可能
      return conditions?.lawyerId === userId;
    }

    return true;
  }

  /**
   * タイムシートアクセス条件をチェック
   */
  private static checkTimesheetAccess(userRole: UserRole, userId: string, conditions: any): boolean {
    if (userRole === UserRole.LAWYER) {
      // 弁護士は自分のタイムシートのみアクセス可能
      return conditions?.lawyerId === userId;
    }

    return true;
  }

  /**
   * ロールの階層をチェック
   * @param userRole ユーザーのロール
   * @param requiredRole 必要なロール
   * @returns ロールが十分かどうか
   */
  static hasRoleHierarchy(userRole: UserRole, requiredRole: UserRole): boolean {
    const roleHierarchy = {
      [UserRole.ADMIN]: 4,
      [UserRole.LAWYER]: 3,
      [UserRole.STAFF]: 2,
      [UserRole.CLIENT]: 1
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }

  /**
   * ユーザーが特定のリソースを所有しているかチェック
   * @param userRole ユーザーのロール
   * @param userId ユーザーID
   * @param resourceOwnerId リソースの所有者ID
   * @returns 所有しているかどうか
   */
  static isResourceOwner(userRole: UserRole, userId: string, resourceOwnerId: string): boolean {
    // 管理者はすべてのリソースを所有しているとみなす
    if (userRole === UserRole.ADMIN) {
      return true;
    }

    return userId === resourceOwnerId;
  }
}
