/**
 * セキュリティ設定の検証とヘルパー関数
 */

// 環境変数の検証
export class SecurityValidator {
  /**
   * 必須の環境変数が設定されているかチェック
   * @returns 検証結果
   */
  static validateRequiredEnvVars(): {
    isValid: boolean;
    missingVars: string[];
    warnings: string[];
  } {
    const requiredVars = [
      'JWT_SECRET',
      'SESSION_SECRET'
    ];

    const missingVars: string[] = [];
    const warnings: string[] = [];

    // 必須環境変数のチェック
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    }

    // セキュリティ警告のチェック
    if (process.env.NODE_ENV === 'production') {
      if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
        warnings.push('JWT_SECRET should be at least 32 characters long in production');
      }

      if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
        warnings.push('SESSION_SECRET should be at least 32 characters long in production');
      }
    }

    return {
      isValid: missingVars.length === 0,
      missingVars,
      warnings
    };
  }

  /**
   * JWTシークレットの強度をチェック
   * @param secret JWTシークレット
   * @returns 強度評価
   */
  static validateJWTSecret(secret: string): {
    isValid: boolean;
    score: number;
    issues: string[];
  } {
    const issues: string[] = [];
    let score = 0;

    // 長さチェック
    if (secret.length < 32) {
      issues.push('JWT secret should be at least 32 characters long');
    } else {
      score += 2;
    }

    // 複雑さチェック
    if (/[a-z]/.test(secret)) score += 1;
    if (/[A-Z]/.test(secret)) score += 1;
    if (/[0-9]/.test(secret)) score += 1;
    if (/[^a-zA-Z0-9]/.test(secret)) score += 1;

    // 一般的なパスワードパターンのチェック
    const commonPatterns = [
      'password',
      'secret',
      'key',
      'jwt',
      'token',
      '123456',
      'abcdef'
    ];

    const hasCommonPattern = commonPatterns.some(pattern =>
      secret.toLowerCase().includes(pattern.toLowerCase())
    );

    if (hasCommonPattern) {
      issues.push('JWT secret contains common patterns that should be avoided');
      score -= 2;
    }

    // 連続文字のチェック
    if (/(.)\1{3,}/.test(secret)) {
      issues.push('JWT secret contains repeated characters');
      score -= 1;
    }

    return {
      isValid: issues.length === 0 && score >= 4,
      score,
      issues
    };
  }

  /**
   * セッションシークレットの強度をチェック
   * @param secret セッションシークレット
   * @returns 強度評価
   */
  static validateSessionSecret(secret: string): {
    isValid: boolean;
    score: number;
    issues: string[];
  } {
    const issues: string[] = [];
    let score = 0;

    // 長さチェック
    if (secret.length < 32) {
      issues.push('Session secret should be at least 32 characters long');
    } else {
      score += 2;
    }

    // 複雑さチェック
    if (/[a-z]/.test(secret)) score += 1;
    if (/[A-Z]/.test(secret)) score += 1;
    if (/[0-9]/.test(secret)) score += 1;
    if (/[^a-zA-Z0-9]/.test(secret)) score += 1;

    // 一般的なパスワードパターンのチェック
    const commonPatterns = [
      'password',
      'secret',
      'session',
      'cookie',
      '123456',
      'abcdef'
    ];

    const hasCommonPattern = commonPatterns.some(pattern =>
      secret.toLowerCase().includes(pattern.toLowerCase())
    );

    if (hasCommonPattern) {
      issues.push('Session secret contains common patterns that should be avoided');
      score -= 2;
    }

    // 連続文字のチェック
    if (/(.)\1{3,}/.test(secret)) {
      issues.push('Session secret contains repeated characters');
      score -= 1;
    }

    return {
      isValid: issues.length === 0 && score >= 4,
      score,
      issues
    };
  }

  /**
   * セキュアなランダム文字列を生成
   * @param length 長さ
   * @returns セキュアなランダム文字列
   */
  static generateSecureSecret(length: number = 64): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let result = '';

    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }

  /**
   * アプリケーション起動時のセキュリティチェック
   * @returns チェック結果
   */
  static performStartupSecurityCheck(): {
    success: boolean;
    message: string;
    details: any;
  } {
    const envValidation = this.validateRequiredEnvVars();

    if (!envValidation.isValid) {
      return {
        success: false,
        message: 'Security validation failed: Missing required environment variables',
        details: {
          missingVars: envValidation.missingVars,
          warnings: envValidation.warnings
        }
      };
    }

    // JWTシークレットの検証
    const jwtValidation = this.validateJWTSecret(process.env.JWT_SECRET!);
    if (!jwtValidation.isValid) {
      return {
        success: false,
        message: 'JWT secret validation failed',
        details: {
          jwtIssues: jwtValidation.issues,
          jwtScore: jwtValidation.score
        }
      };
    }

    // セッションシークレットの検証
    const sessionValidation = this.validateSessionSecret(process.env.SESSION_SECRET!);
    if (!sessionValidation.isValid) {
      return {
        success: false,
        message: 'Session secret validation failed',
        details: {
          sessionIssues: sessionValidation.issues,
          sessionScore: sessionValidation.score
        }
      };
    }

    return {
      success: true,
      message: 'Security validation passed',
      details: {
        envValidation,
        jwtValidation,
        sessionValidation
      }
    };
  }
}

// アプリケーション起動時のセキュリティチェックを実行
export const performSecurityCheck = () => {
  const result = SecurityValidator.performStartupSecurityCheck();

  if (!result.success) {
    console.error('🚨 Security validation failed:', result.message);
    console.error('Details:', result.details);
    process.exit(1);
  }

  console.log('✅ Security validation passed');
  return result;
};
