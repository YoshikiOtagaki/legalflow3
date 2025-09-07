import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'
import { logError, logApiError, logDatabaseError } from '../utils/logger'

export interface ApiError extends Error {
  statusCode?: number
  code?: string
  isOperational?: boolean
}

export class AppError extends Error implements ApiError {
  public statusCode: number
  public code: string
  public isOperational: boolean

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

// カスタムエラークラス
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR')
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND')
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409, 'CONFLICT')
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED')
  }
}

// Prismaエラーハンドリング
export const handlePrismaError = (error: any): AppError => {
  logDatabaseError(error, 'database operation')

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return new ConflictError('A record with this information already exists')
      case 'P2025':
        return new NotFoundError('Record not found')
      case 'P2003':
        return new ValidationError('Foreign key constraint failed')
      case 'P2014':
        return new ConflictError('The change you are trying to make would violate the required relation')
      case 'P2016':
        return new ValidationError('Query interpretation error')
      case 'P2021':
        return new NotFoundError('The table does not exist in the current database')
      case 'P2022':
        return new NotFoundError('The column does not exist in the current database')
      default:
        return new AppError('Database operation failed', 500, 'DATABASE_ERROR')
    }
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return new AppError('Unknown database error occurred', 500, 'DATABASE_ERROR')
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return new AppError('Database engine crashed', 500, 'DATABASE_ERROR')
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new AppError('Database connection failed', 500, 'DATABASE_ERROR')
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new ValidationError('Invalid data provided')
  }

  return new AppError('Database operation failed', 500, 'DATABASE_ERROR')
}

// JWTエラーハンドリング
export const handleJWTError = (): AppError => {
  return new UnauthorizedError('Invalid token. Please log in again!')
}

export const handleJWTExpiredError = (): AppError => {
  return new UnauthorizedError('Your token has expired! Please log in again.')
}

// 外部サービスエラーハンドリング
export const handleExternalServiceError = (error: any, service: string): AppError => {
  logError(error, `External service: ${service}`)

  if (error.response) {
    // レスポンスがある場合
    const status = error.response.status
    const message = error.response.data?.message || error.message

    switch (status) {
      case 400:
        return new ValidationError(`External service error: ${message}`)
      case 401:
        return new UnauthorizedError(`External service authentication failed: ${message}`)
      case 403:
        return new ForbiddenError(`External service access denied: ${message}`)
      case 404:
        return new NotFoundError(`External service resource not found: ${message}`)
      case 429:
        return new RateLimitError(`External service rate limit exceeded: ${message}`)
      case 500:
      case 502:
      case 503:
      case 504:
        return new AppError(`External service unavailable: ${message}`, 503, 'EXTERNAL_SERVICE_ERROR')
      default:
        return new AppError(`External service error: ${message}`, status, 'EXTERNAL_SERVICE_ERROR')
    }
  } else if (error.request) {
    // リクエストは送信されたがレスポンスがない場合
    return new AppError(`External service timeout: ${service}`, 503, 'EXTERNAL_SERVICE_TIMEOUT')
  } else {
    // その他のエラー
    return new AppError(`External service error: ${error.message}`, 500, 'EXTERNAL_SERVICE_ERROR')
  }
}

// エラーレスポンス生成
const sendErrorDev = (err: ApiError, res: Response) => {
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message,
    stack: err.stack,
    code: err.code,
  })
}

const sendErrorProd = (err: ApiError, res: Response) => {
  // オペレーショナルエラーの場合のみ詳細を送信
  if (err.isOperational) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
      code: err.code,
    })
  } else {
    // プログラミングエラーやその他の未知のエラーは詳細を送信しない
    logError(err, 'Unknown error occurred')
    res.status(500).json({
      success: false,
      error: 'Something went wrong!',
      code: 'INTERNAL_ERROR',
    })
  }
}

// メインエラーハンドラーミドルウェア
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500
  err.code = err.code || 'INTERNAL_ERROR'

  // APIエラーログ
  logApiError(err, req.originalUrl, req.method, (req as any).user?.id)

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res)
  } else {
    // Prismaエラーの処理
    if (err instanceof Prisma.PrismaClientKnownRequestError ||
        err instanceof Prisma.PrismaClientUnknownRequestError ||
        err instanceof Prisma.PrismaClientRustPanicError ||
        err instanceof Prisma.PrismaClientInitializationError ||
        err instanceof Prisma.PrismaClientValidationError) {
      const prismaError = handlePrismaError(err)
      sendErrorProd(prismaError, res)
      return
    }

    // JWTエラーの処理
    if (err.name === 'JsonWebTokenError') {
      const jwtError = handleJWTError()
      sendErrorProd(jwtError, res)
      return
    }

    if (err.name === 'TokenExpiredError') {
      const jwtExpiredError = handleJWTExpiredError()
      sendErrorProd(jwtExpiredError, res)
      return
    }

    // その他のエラー
    sendErrorProd(err, res)
  }
}

// 404エラーハンドラー
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Not found - ${req.originalUrl}`)
  next(error)
}

// 非同期エラーハンドラー
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// グローバルエラーハンドラー
export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // エラーハンドラーが既に呼ばれている場合はスキップ
  if (res.headersSent) {
    return next(err)
  }

  errorHandler(err, req, res, next)
}

// 未処理の例外キャッチ
process.on('uncaughtException', (err: Error) => {
  logError(err, 'Uncaught Exception')
  process.exit(1)
})

// 未処理のPromise拒否キャッチ
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logError(new Error(`Unhandled Rejection: ${reason}`), 'Unhandled Rejection')
  process.exit(1)
})
