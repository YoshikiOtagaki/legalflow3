import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserService } from '../models';

// JWTシークレットキー（環境変数から取得、必須）
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required but not set');
}

// 認証が必要なリクエストの型定義
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// JWTトークンを検証するミドルウェア
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
        message: 'Authorization header with Bearer token is required'
      });
    }

    // JWTトークンを検証
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // ユーザーの存在確認
    const user = await UserService.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'User associated with this token does not exist'
      });
    }

    // リクエストオブジェクトにユーザー情報を追加
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({
      success: false,
      error: 'Invalid token',
      message: 'Token is invalid or expired'
    });
  }
};

// 特定のロールが必要なリクエストのミドルウェア
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'User must be authenticated'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

// 管理者権限が必要なリクエストのミドルウェア
export const requireAdmin = requireRole(['Admin']);

// 弁護士権限が必要なリクエストのミドルウェア
export const requireLawyer = requireRole(['Admin', 'Lawyer']);

// オプショナル認証（認証されていればユーザー情報を追加、されていなくても通す）
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = await UserService.findById(decoded.userId);

      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role
        };
      }
    }

    next();
  } catch (error) {
    // オプショナル認証なので、エラーが発生しても通す
    next();
  }
};

// リクエストレート制限のミドルウェア（認証エンドポイント用）
export const rateLimit = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    // 古いリクエストをクリア
    for (const [key, value] of requests.entries()) {
      if (value.resetTime < windowStart) {
        requests.delete(key);
      }
    }

    const clientRequests = requests.get(clientId);

    if (!clientRequests) {
      requests.set(clientId, { count: 1, resetTime: now });
      next();
    } else if (clientRequests.resetTime < windowStart) {
      requests.set(clientId, { count: 1, resetTime: now });
      next();
    } else if (clientRequests.count < maxRequests) {
      clientRequests.count++;
      next();
    } else {
      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs / 1000} seconds`
      });
    }
  };
};

// 認証エンドポイント用のレート制限（5分間に5回まで）
export const authRateLimit = rateLimit(5, 5 * 60 * 1000);
