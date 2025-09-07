"use client";

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

export class ApiErrorHandler {
  static handle(error: unknown): ApiError {
    if (error instanceof Error) {
      return {
        message: error.message,
        code: "UNKNOWN_ERROR",
      };
    }

    if (typeof error === "string") {
      return {
        message: error,
        code: "STRING_ERROR",
      };
    }

    if (error && typeof error === "object") {
      const message =
        "message" in error && typeof error.message === "string"
          ? error.message
          : "Unknown error occurred";
      const status =
        "status" in error && typeof error.status === "number"
          ? error.status
          : undefined;
      const code =
        "code" in error && typeof error.code === "string"
          ? error.code
          : undefined;
      const details = "details" in error ? error.details : undefined;
      return {
        message,
        status,
        code,
        details,
      };
    }

    return {
      message: "An unexpected error occurred",
      code: "UNEXPECTED_ERROR",
    };
  }

  static getErrorMessage(error: unknown): string {
    const apiError = this.handle(error);

    // 一般的なエラーメッセージのマッピング
    const errorMessages: Record<string, string> = {
      NETWORK_ERROR:
        "ネットワークエラーが発生しました。インターネット接続を確認してください。",
      UNAUTHORIZED: "認証が必要です。ログインし直してください。",
      FORBIDDEN: "この操作を実行する権限がありません。",
      NOT_FOUND: "リソースが見つかりません。",
      VALIDATION_ERROR: "入力データに問題があります。",
      SERVER_ERROR:
        "サーバーエラーが発生しました。しばらくしてから再試行してください。",
      TIMEOUT: "リクエストがタイムアウトしました。",
    };

    return errorMessages[apiError.code || ""] || apiError.message;
  }

  static isNetworkError(error: unknown): boolean {
    if (typeof error === "object" && error !== null) {
      return (
        ("code" in error && error.code === "NETWORK_ERROR") ||
        ("message" in error &&
          typeof error.message === "string" &&
          error.message.includes("fetch")) ||
        ("message" in error &&
          typeof error.message === "string" &&
          error.message.includes("network"))
      );
    }
    return false;
  }

  static isAuthError(error: unknown): boolean {
    if (typeof error === "object" && error !== null) {
      return (
        ("status" in error && error.status === 401) ||
        ("code" in error && error.code === "UNAUTHORIZED") ||
        ("message" in error &&
          typeof error.message === "string" &&
          error.message.includes("unauthorized"))
      );
    }
    return false;
  }

  static isValidationError(error: unknown): boolean {
    if (typeof error === "object" && error !== null) {
      return (
        ("status" in error && error.status === 400) ||
        ("code" in error && error.code === "VALIDATION_ERROR") ||
        ("message" in error &&
          typeof error.message === "string" &&
          error.message.includes("validation"))
      );
    }
    return false;
  }
}

export const showErrorToast = (error: unknown) => {
  const message = ApiErrorHandler.getErrorMessage(error);

  // トーストライブラリがあれば使用、なければconsole.error
  if (typeof window !== "undefined") {
    console.error("API Error:", message);
    // TODO: トースト通知を実装
  }
};

export const handleApiError = (error: unknown, fallbackMessage?: string) => {
  const apiError = ApiErrorHandler.handle(error);
  const message = fallbackMessage || apiError.message;

  showErrorToast(apiError);

  return {
    message,
    code: apiError.code,
    status: apiError.status,
  };
};
