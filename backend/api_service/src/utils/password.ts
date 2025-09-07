import bcrypt from 'bcryptjs';

// パスワードハッシュ化の設定
const SALT_ROUNDS = 12;

/**
 * パスワードをハッシュ化
 * @param password 平文パスワード
 * @returns ハッシュ化されたパスワード
 */
export const hashPassword = async (password: string): Promise<string> => {
  try {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);

    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
};

/**
 * パスワードを検証
 * @param password 平文パスワード
 * @param hashedPassword ハッシュ化されたパスワード
 * @returns パスワードが一致するかどうか
 */
export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    if (!password || !hashedPassword) {
      return false;
    }

    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
};

/**
 * パスワードの強度を検証
 * @param password パスワード
 * @returns 検証結果とメッセージ
 */
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  message: string;
  score: number;
} => {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      message: 'Password is required',
      score: 0
    };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long',
      score: 0
    };
  }

  if (password.length > 128) {
    return {
      isValid: false,
      message: 'Password must be no more than 128 characters long',
      score: 0
    };
  }

  let score = 0;
  const messages: string[] = [];

  // 長さチェック
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // 文字種チェック
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    messages.push('Include lowercase letters');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    messages.push('Include uppercase letters');
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  } else {
    messages.push('Include numbers');
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1;
  } else {
    messages.push('Include special characters');
  }

  // 一般的なパスワードパターンのチェック
  const commonPatterns = [
    /password/i,
    /123456/,
    /qwerty/i,
    /admin/i,
    /letmein/i,
    /welcome/i,
    /monkey/i,
    /dragon/i,
    /master/i,
    /hello/i
  ];

  const hasCommonPattern = commonPatterns.some(pattern => pattern.test(password));
  if (hasCommonPattern) {
    score -= 2;
    messages.push('Avoid common password patterns');
  }

  // 連続文字のチェック
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    messages.push('Avoid repeated characters');
  }

  // スコアに基づく評価
  let strength: string;
  if (score >= 6) {
    strength = 'Strong';
  } else if (score >= 4) {
    strength = 'Medium';
  } else if (score >= 2) {
    strength = 'Weak';
  } else {
    strength = 'Very Weak';
  }

  const isValid = score >= 4;
  const message = isValid
    ? `Password strength: ${strength}`
    : `Password is too weak. ${messages.join(', ')}`;

  return {
    isValid,
    message,
    score
  };
};

/**
 * パスワードリセットトークンを生成
 * @returns ランダムなトークン
 */
export const generatePasswordResetToken = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';

  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return token;
};

/**
 * パスワードリセットトークンの有効期限をチェック
 * @param createdAt トークン作成日時
 * @param expirationMinutes 有効期限（分）
 * @returns 有効かどうか
 */
export const isPasswordResetTokenValid = (
  createdAt: Date,
  expirationMinutes: number = 30
): boolean => {
  const now = new Date();
  const expirationTime = new Date(createdAt.getTime() + expirationMinutes * 60 * 1000);

  return now < expirationTime;
};
