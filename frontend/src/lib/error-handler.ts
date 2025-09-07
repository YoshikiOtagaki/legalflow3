'use client'

export interface ApiError {
  message: string
  status?: number
  code?: string
  details?: any
}

export class ApiErrorHandler {
  static handle(error: any): ApiError {
    if (error instanceof Error) {
      return {
        message: error.message,
        code: 'UNKNOWN_ERROR',
      }
    }

    if (typeof error === 'string') {
      return {
        message: error,
        code: 'STRING_ERROR',
      }
    }

    if (error && typeof error === 'object') {
      return {
        message: error.message || 'Unknown error occurred',
        status: error.status,
        code: error.code,
        details: error.details,
      }
    }

    return {
      message: 'An unexpected error occurred',
      code: 'UNEXPECTED_ERROR',
    }
  }

  static getErrorMessage(error: any): string {
    const apiError = this.handle(error)

    // 一般的なエラーメッセージのマッピング
    const errorMessages: Record<string, string> = {
      'NETWORK_ERROR': 'ネットワークエラーが発生しました。インターネット接続を確認してください。',
      'UNAUTHORIZED': '認証が必要です。ログインし直してください。',
      'FORBIDDEN': 'この操作を実行する権限がありません。',
      'NOT_FOUND': 'リソースが見つかりません。',
      'VALIDATION_ERROR': '入力データに問題があります。',
      'SERVER_ERROR': 'サーバーエラーが発生しました。しばらくしてから再試行してください。',
      'TIMEOUT': 'リクエストがタイムアウトしました。',
    }

    return errorMessages[apiError.code || ''] || apiError.message
  }

  static isNetworkError(error: any): boolean {
    return error?.code === 'NETWORK_ERROR' ||
           error?.message?.includes('fetch') ||
           error?.message?.includes('network')
  }

  static isAuthError(error: any): boolean {
    return error?.status === 401 ||
           error?.code === 'UNAUTHORIZED' ||
           error?.message?.includes('unauthorized')
  }

  static isValidationError(error: any): boolean {
    return error?.status === 400 ||
           error?.code === 'VALIDATION_ERROR' ||
           error?.message?.includes('validation')
  }
}

export const showErrorToast = (error: any) => {
  const message = ApiErrorHandler.getErrorMessage(error)

  // トーストライブラリがあれば使用、なければconsole.error
  if (typeof window !== 'undefined') {
    console.error('API Error:', message)
    // TODO: トースト通知を実装
  }
}

export const handleApiError = (error: any, fallbackMessage?: string) => {
  const apiError = ApiErrorHandler.handle(error)
  const message = fallbackMessage || apiError.message

  showErrorToast(apiError)

  return {
    message,
    code: apiError.code,
    status: apiError.status,
  }
}
