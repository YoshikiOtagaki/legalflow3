import winston from 'winston'
import path from 'path'

// ログレベル定義
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

// ログレベルに応じた色設定
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
}

winston.addColors(colors)

// ログフォーマット設定
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
)

// ファイル出力用フォーマット（色なし）
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

// ログファイルのパス設定
const logDir = process.env.LOG_DIR || 'logs'

// トランスポート設定
const transports = [
  // コンソール出力
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || 'info',
    format,
  }),

  // エラーログファイル
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),

  // 全ログファイル
  new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
]

// 本番環境ではHTTPログを別ファイルに出力
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'http.log'),
      level: 'http',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  )
}

// ロガー作成
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
  exitOnError: false,
})

// 開発環境ではデバッグログも出力
if (process.env.NODE_ENV === 'development') {
  logger.add(new winston.transports.Console({
    level: 'debug',
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }))
}

// ログ出力関数
export const log = {
  error: (message: string, meta?: any) => {
    logger.error(message, meta)
  },
  warn: (message: string, meta?: any) => {
    logger.warn(message, meta)
  },
  info: (message: string, meta?: any) => {
    logger.info(message, meta)
  },
  http: (message: string, meta?: any) => {
    logger.http(message, meta)
  },
  debug: (message: string, meta?: any) => {
    logger.debug(message, meta)
  },
}

// HTTPリクエストログ用のミドルウェア
export const httpLogger = (req: any, res: any, next: any) => {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`

    if (res.statusCode >= 400) {
      log.error(message, {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
      })
    } else {
      log.http(message, {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration,
      })
    }
  })

  next()
}

// エラーログ用のヘルパー関数
export const logError = (error: Error, context?: string, meta?: any) => {
  log.error(`Error${context ? ` in ${context}` : ''}: ${error.message}`, {
    stack: error.stack,
    ...meta,
  })
}

// データベースエラーログ用のヘルパー関数
export const logDatabaseError = (error: any, operation: string, table?: string) => {
  log.error(`Database error during ${operation}${table ? ` on ${table}` : ''}`, {
    error: error.message,
    code: error.code,
    meta: error.meta,
    stack: error.stack,
  })
}

// APIエラーログ用のヘルパー関数
export const logApiError = (error: any, endpoint: string, method: string, userId?: string) => {
  log.error(`API error on ${method} ${endpoint}`, {
    error: error.message,
    stack: error.stack,
    userId,
    endpoint,
    method,
  })
}

// 外部サービスエラーログ用のヘルパー関数
export const logExternalServiceError = (error: any, service: string, operation: string) => {
  log.error(`External service error: ${service} - ${operation}`, {
    error: error.message,
    stack: error.stack,
    service,
    operation,
  })
}

// セキュリティイベントログ用のヘルパー関数
export const logSecurityEvent = (event: string, details: any, userId?: string, ip?: string) => {
  log.warn(`Security event: ${event}`, {
    event,
    userId,
    ip,
    details,
    timestamp: new Date().toISOString(),
  })
}

// パフォーマンスログ用のヘルパー関数
export const logPerformance = (operation: string, duration: number, meta?: any) => {
  if (duration > 1000) { // 1秒以上の場合のみログ出力
    log.warn(`Slow operation: ${operation} took ${duration}ms`, {
      operation,
      duration,
      ...meta,
    })
  } else {
    log.debug(`Operation: ${operation} took ${duration}ms`, {
      operation,
      duration,
      ...meta,
    })
  }
}

export default logger
