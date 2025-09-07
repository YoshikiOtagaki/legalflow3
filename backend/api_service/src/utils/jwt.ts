import jwt from 'jsonwebtoken';

// JWT設定
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required but not set');
}

// トークンのペイロード型定義
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenType: 'refresh';
  iat?: number;
  exp?: number;
}

/**
 * アクセストークンを生成
 * @param payload トークンのペイロード
 * @returns アクセストークン
 */
export const generateAccessToken = (payload: Omit<TokenPayload, 'iat' | 'exp'>): string => {
  try {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'legalflow3',
      audience: 'legalflow3-client'
    });
  } catch (error) {
    console.error('Error generating access token:', error);
    throw new Error('Failed to generate access token');
  }
};

/**
 * リフレッシュトークンを生成
 * @param userId ユーザーID
 * @returns リフレッシュトークン
 */
export const generateRefreshToken = (userId: string): string => {
  try {
    const payload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
      userId,
      tokenType: 'refresh'
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: 'legalflow3',
      audience: 'legalflow3-client'
    });
  } catch (error) {
    console.error('Error generating refresh token:', error);
    throw new Error('Failed to generate refresh token');
  }
};

/**
 * アクセストークンを検証
 * @param token アクセストークン
 * @returns デコードされたペイロード
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'legalflow3',
      audience: 'legalflow3-client'
    }) as TokenPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token');
    } else {
      console.error('Error verifying access token:', error);
      throw new Error('Failed to verify access token');
    }
  }
};

/**
 * リフレッシュトークンを検証
 * @param token リフレッシュトークン
 * @returns デコードされたペイロード
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'legalflow3',
      audience: 'legalflow3-client'
    }) as RefreshTokenPayload;

    if (decoded.tokenType !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    } else {
      console.error('Error verifying refresh token:', error);
      throw new Error('Failed to verify refresh token');
    }
  }
};

/**
 * トークンペアを生成（アクセス + リフレッシュ）
 * @param payload トークンのペイロード
 * @returns トークンペア
 */
export const generateTokenPair = (payload: Omit<TokenPayload, 'iat' | 'exp'>): {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
} => {
  try {
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload.userId);

    // 有効期限を秒で計算
    const expiresIn = getTokenExpirationTime(JWT_EXPIRES_IN);

    return {
      accessToken,
      refreshToken,
      expiresIn
    };
  } catch (error) {
    console.error('Error generating token pair:', error);
    throw new Error('Failed to generate token pair');
  }
};

/**
 * トークンの有効期限を秒で取得
 * @param expiresIn JWTの有効期限文字列
 * @returns 有効期限（秒）
 */
const getTokenExpirationTime = (expiresIn: string): number => {
  const now = Math.floor(Date.now() / 1000);
  const decoded = jwt.decode(expiresIn) as any;

  if (decoded && decoded.exp) {
    return decoded.exp - now;
  }

  // デフォルト値（24時間）
  return 24 * 60 * 60;
};

/**
 * トークンが有効期限切れかどうかをチェック
 * @param token JWTトークン
 * @returns 有効期限切れかどうか
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      return true;
    }

    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now;
  } catch (error) {
    return true;
  }
};

/**
 * トークンからユーザーIDを取得
 * @param token JWTトークン
 * @returns ユーザーID
 */
export const getUserIdFromToken = (token: string): string | null => {
  try {
    const decoded = jwt.decode(token) as any;
    return decoded?.userId || null;
  } catch (error) {
    return null;
  }
};

/**
 * トークンの残り有効時間を取得
 * @param token JWTトークン
 * @returns 残り有効時間（秒）、無効な場合は-1
 */
export const getTokenRemainingTime = (token: string): number => {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) {
      return -1;
    }

    const now = Math.floor(Date.now() / 1000);
    const remaining = decoded.exp - now;

    return remaining > 0 ? remaining : 0;
  } catch (error) {
    return -1;
  }
};
