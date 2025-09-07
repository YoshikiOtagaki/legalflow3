// アプリケーション定数
export const APP_CONSTANTS = {
  // ページネーション
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },

  // ファイルアップロード
  FILE_UPLOAD: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
    ],
    ALLOWED_EXTENSIONS: ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png', '.gif'],
  },

  // JWT設定
  JWT: {
    ACCESS_TOKEN_EXPIRES_IN: '1h',
    REFRESH_TOKEN_EXPIRES_IN: '7d',
  },

  // セッション設定
  SESSION: {
    MAX_AGE: 24 * 60 * 60 * 1000, // 24時間
  },

  // レート制限
  RATE_LIMIT: {
    GENERAL: {
      WINDOW_MS: 15 * 60 * 1000, // 15分
      MAX: 100, // 100リクエスト
    },
    AUTH: {
      WINDOW_MS: 15 * 60 * 1000, // 15分
      MAX: 5, // 5リクエスト
    },
    PASSWORD_RESET: {
      WINDOW_MS: 60 * 60 * 1000, // 1時間
      MAX: 3, // 3リクエスト
    },
  },

  // キャッシュ設定
  CACHE: {
    TTL: {
      DASHBOARD: 5 * 60 * 1000, // 5分
      CASES: 2 * 60 * 1000, // 2分
      PARTIES: 2 * 60 * 1000, // 2分
      DOCUMENTS: 1 * 60 * 1000, // 1分
      TIMESHEETS: 1 * 60 * 1000, // 1分
      NOTIFICATIONS: 30 * 1000, // 30秒
      USER_PROFILE: 10 * 60 * 1000, // 10分
    },
    MAX_SIZE: 1000,
  },

  // 通知設定
  NOTIFICATION: {
    TYPES: ['case_update', 'deadline_reminder', 'document_upload', 'timesheet_reminder', 'system_alert'],
    CHANNELS: ['email', 'sms', 'push', 'line', 'in_app'],
    FREQUENCIES: ['immediate', 'daily', 'weekly', 'monthly'],
  },

  // ケース設定
  CASE: {
    CATEGORIES: ['civil', 'criminal', 'family', 'corporate', 'immigration', 'real_estate'],
    STATUSES: ['active', 'completed', 'pending', 'on_hold', 'cancelled'],
    PRIORITIES: ['low', 'medium', 'high', 'urgent'],
  },

  // 当事者設定
  PARTY: {
    TYPES: ['individual', 'corporate'],
  },

  // ドキュメント設定
  DOCUMENT: {
    TYPES: ['contract', 'memo', 'brief', 'pleading', 'evidence', 'other'],
  },

  // ユーザーロール
  USER_ROLES: {
    ADMIN: 'admin',
    LAWYER: 'lawyer',
    CLIENT: 'client',
    STAFF: 'staff',
  },

  // 権限
  PERMISSIONS: {
    CASE: {
      CREATE: 'case:create',
      READ: 'case:read',
      UPDATE: 'case:update',
      DELETE: 'case:delete',
    },
    PARTY: {
      CREATE: 'party:create',
      READ: 'party:read',
      UPDATE: 'party:update',
      DELETE: 'party:delete',
    },
    DOCUMENT: {
      CREATE: 'document:create',
      READ: 'document:read',
      UPDATE: 'document:update',
      DELETE: 'document:delete',
    },
    TIMESHEET: {
      CREATE: 'timesheet:create',
      READ: 'timesheet:read',
      UPDATE: 'timesheet:update',
      DELETE: 'timesheet:delete',
    },
    USER: {
      CREATE: 'user:create',
      READ: 'user:read',
      UPDATE: 'user:update',
      DELETE: 'user:delete',
    },
  },

  // エラーコード
  ERROR_CODES: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
    FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
    EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    INVALID_TOKEN: 'INVALID_TOKEN',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    REFRESH_TOKEN_REQUIRED: 'REFRESH_TOKEN_REQUIRED',
    INVALID_REFRESH_TOKEN: 'INVALID_REFRESH_TOKEN',
    REQUEST_TOO_LARGE: 'REQUEST_TOO_LARGE',
    SUSPICIOUS_REQUEST: 'SUSPICIOUS_REQUEST',
    IP_NOT_WHITELISTED: 'IP_NOT_WHITELISTED',
    BLOCKED_USER_AGENT: 'BLOCKED_USER_AGENT',
    FREQUENCY_LIMIT_EXCEEDED: 'FREQUENCY_LIMIT_EXCEEDED',
  },

  // HTTPステータスコード
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
  },

  // データベース設定
  DATABASE: {
    MAX_CONNECTIONS: 10,
    CONNECTION_TIMEOUT: 30000,
    QUERY_TIMEOUT: 30000,
  },

  // ログ設定
  LOG: {
    LEVELS: ['error', 'warn', 'info', 'http', 'debug'],
    MAX_FILES: 5,
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
  },

  // 外部サービス設定
  EXTERNAL_SERVICES: {
    DOCGEN_SERVICE: {
      URL: process.env.DOCGEN_SERVICE_URL || 'http://localhost:8000',
      TIMEOUT: 30000,
    },
    LINE_MESSAGING: {
      API_URL: 'https://api.line.me/v2/bot/message',
      OAUTH_URL: 'https://api.line.me/v2/oauth',
    },
    GOOGLE_CALENDAR: {
      API_URL: 'https://www.googleapis.com/calendar/v3',
      OAUTH_URL: 'https://accounts.google.com/o/oauth2/v2/auth',
    },
    OUTLOOK_CALENDAR: {
      API_URL: 'https://graph.microsoft.com/v1.0',
      OAUTH_URL: 'https://login.microsoftonline.com/common/oauth2/v2.0',
    },
  },

  // セキュリティ設定
  SECURITY: {
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_REQUIRE_UPPERCASE: true,
    PASSWORD_REQUIRE_LOWERCASE: true,
    PASSWORD_REQUIRE_NUMBERS: true,
    PASSWORD_REQUIRE_SYMBOLS: false,
    SESSION_SECURE: process.env.NODE_ENV === 'production',
    SESSION_HTTP_ONLY: true,
    SESSION_SAME_SITE: 'strict',
    CORS_CREDENTIALS: true,
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  // パフォーマンス設定
  PERFORMANCE: {
    REQUEST_TIMEOUT: 30000,
    RESPONSE_TIMEOUT: 30000,
    MAX_MEMORY_USAGE: 100 * 1024 * 1024, // 100MB
    SLOW_QUERY_THRESHOLD: 1000, // 1秒
  },
} as const

// 型定義
export type UserRole = typeof APP_CONSTANTS.USER_ROLES[keyof typeof APP_CONSTANTS.USER_ROLES]
export type CaseCategory = typeof APP_CONSTANTS.CASE.CATEGORIES[number]
export type CaseStatus = typeof APP_CONSTANTS.CASE.STATUSES[number]
export type CasePriority = typeof APP_CONSTANTS.CASE.PRIORITIES[number]
export type PartyType = typeof APP_CONSTANTS.PARTY.TYPES[number]
export type DocumentType = typeof APP_CONSTANTS.DOCUMENT.TYPES[number]
export type NotificationType = typeof APP_CONSTANTS.NOTIFICATION.TYPES[number]
export type NotificationChannel = typeof APP_CONSTANTS.NOTIFICATION.CHANNELS[number]
export type NotificationFrequency = typeof APP_CONSTANTS.NOTIFICATION.FREQUENCIES[number]
export type ErrorCode = typeof APP_CONSTANTS.ERROR_CODES[keyof typeof APP_CONSTANTS.ERROR_CODES]
export type HttpStatus = typeof APP_CONSTANTS.HTTP_STATUS[keyof typeof APP_CONSTANTS.HTTP_STATUS]
