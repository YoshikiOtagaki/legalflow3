import { Response } from 'express'
import { APP_CONSTANTS, HttpStatus } from './constants'

// レスポンス型定義
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// 成功レスポンス
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: HttpStatus = APP_CONSTANTS.HTTP_STATUS.OK
): void => {
  const response: ApiResponse<T> = {
    success: true,
    data,
  }

  if (message) {
    response.message = message
  }

  res.status(statusCode).json(response)
}

// 作成成功レスポンス
export const sendCreated = <T>(
  res: Response,
  data: T,
  message: string = 'リソースが正常に作成されました'
): void => {
  sendSuccess(res, data, message, APP_CONSTANTS.HTTP_STATUS.CREATED)
}

// 更新成功レスポンス
export const sendUpdated = <T>(
  res: Response,
  data: T,
  message: string = 'リソースが正常に更新されました'
): void => {
  sendSuccess(res, data, message, APP_CONSTANTS.HTTP_STATUS.OK)
}

// 削除成功レスポンス
export const sendDeleted = (
  res: Response,
  message: string = 'リソースが正常に削除されました'
): void => {
  sendSuccess(res, null, message, APP_CONSTANTS.HTTP_STATUS.OK)
}

// エラーレスポンス
export const sendError = (
  res: Response,
  error: string,
  code: string = APP_CONSTANTS.ERROR_CODES.INTERNAL_ERROR,
  statusCode: HttpStatus = APP_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR
): void => {
  const response: ApiResponse = {
    success: false,
    error,
    code,
  }

  res.status(statusCode).json(response)
}

// バリデーションエラーレスポンス
export const sendValidationError = (
  res: Response,
  error: string = 'バリデーションエラーが発生しました'
): void => {
  sendError(res, error, APP_CONSTANTS.ERROR_CODES.VALIDATION_ERROR, APP_CONSTANTS.HTTP_STATUS.BAD_REQUEST)
}

// 認証エラーレスポンス
export const sendUnauthorized = (
  res: Response,
  error: string = '認証が必要です'
): void => {
  sendError(res, error, APP_CONSTANTS.ERROR_CODES.UNAUTHORIZED, APP_CONSTANTS.HTTP_STATUS.UNAUTHORIZED)
}

// 権限エラーレスポンス
export const sendForbidden = (
  res: Response,
  error: string = 'この操作を実行する権限がありません'
): void => {
  sendError(res, error, APP_CONSTANTS.ERROR_CODES.FORBIDDEN, APP_CONSTANTS.HTTP_STATUS.FORBIDDEN)
}

// 見つからないエラーレスポンス
export const sendNotFound = (
  res: Response,
  error: string = 'リソースが見つかりません'
): void => {
  sendError(res, error, APP_CONSTANTS.ERROR_CODES.NOT_FOUND, APP_CONSTANTS.HTTP_STATUS.NOT_FOUND)
}

// 競合エラーレスポンス
export const sendConflict = (
  res: Response,
  error: string = 'リソースが既に存在します'
): void => {
  sendError(res, error, APP_CONSTANTS.ERROR_CODES.CONFLICT, APP_CONSTANTS.HTTP_STATUS.CONFLICT)
}

// レート制限エラーレスポンス
export const sendRateLimitError = (
  res: Response,
  error: string = 'リクエスト数が上限を超えました'
): void => {
  sendError(res, error, APP_CONSTANTS.ERROR_CODES.RATE_LIMIT_EXCEEDED, APP_CONSTANTS.HTTP_STATUS.TOO_MANY_REQUESTS)
}

// ファイルアップロードエラーレスポンス
export const sendFileUploadError = (
  res: Response,
  error: string = 'ファイルのアップロードに失敗しました'
): void => {
  sendError(res, error, APP_CONSTANTS.ERROR_CODES.FILE_UPLOAD_ERROR, APP_CONSTANTS.HTTP_STATUS.BAD_REQUEST)
}

// データベースエラーレスポンス
export const sendDatabaseError = (
  res: Response,
  error: string = 'データベースエラーが発生しました'
): void => {
  sendError(res, error, APP_CONSTANTS.ERROR_CODES.DATABASE_ERROR, APP_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR)
}

// 外部サービスエラーレスポンス
export const sendExternalServiceError = (
  res: Response,
  error: string = '外部サービスエラーが発生しました'
): void => {
  sendError(res, error, APP_CONSTANTS.ERROR_CODES.EXTERNAL_SERVICE_ERROR, APP_CONSTANTS.HTTP_STATUS.BAD_GATEWAY)
}

// ページネーション付きレスポンス
export const sendPaginatedResponse = <T>(
  res: Response,
  data: T[],
  pagination: {
    page: number
    limit: number
    total: number
  },
  message?: string
): void => {
  const totalPages = Math.ceil(pagination.total / pagination.limit)

  const response: ApiResponse<T[]> = {
    success: true,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages,
    },
  }

  if (message) {
    response.message = message
  }

  res.status(APP_CONSTANTS.HTTP_STATUS.OK).json(response)
}

// 空のリストレスポンス
export const sendEmptyList = (
  res: Response,
  message: string = 'データが見つかりませんでした'
): void => {
  sendPaginatedResponse(res, [], {
    page: 1,
    limit: APP_CONSTANTS.PAGINATION.DEFAULT_LIMIT,
    total: 0,
  }, message)
}

// カスタムエラーレスポンス
export const sendCustomError = (
  res: Response,
  error: string,
  code: string,
  statusCode: HttpStatus
): void => {
  sendError(res, error, code, statusCode)
}

// レスポンスヘルパー
export const responseHelper = {
  success: sendSuccess,
  created: sendCreated,
  updated: sendUpdated,
  deleted: sendDeleted,
  error: sendError,
  validationError: sendValidationError,
  unauthorized: sendUnauthorized,
  forbidden: sendForbidden,
  notFound: sendNotFound,
  conflict: sendConflict,
  rateLimitError: sendRateLimitError,
  fileUploadError: sendFileUploadError,
  databaseError: sendDatabaseError,
  externalServiceError: sendExternalServiceError,
  paginated: sendPaginatedResponse,
  emptyList: sendEmptyList,
  custom: sendCustomError,
}
