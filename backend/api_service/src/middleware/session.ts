import session from 'express-session';
import { Request, Response, NextFunction } from 'express';

// セッション設定
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is required but not set');
}

const sessionConfig = {
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS環境でのみsecure
    httpOnly: true, // XSS攻撃を防ぐ
    maxAge: 24 * 60 * 60 * 1000, // 24時間
    sameSite: 'strict' as const // CSRF攻撃を防ぐ
  },
  name: 'legalflow3.sid' // デフォルトのセッション名を変更
};

// セッションミドルウェア
export const sessionMiddleware = session(sessionConfig);

// セッション型定義の拡張
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    email?: string;
    role?: string;
    loginTime?: number;
    lastActivity?: number;
    isAuthenticated?: boolean;
  }
}

// セッション認証ミドルウェア
export const requireSession = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.isAuthenticated) {
    return res.status(401).json({
      success: false,
      error: 'Session required',
      message: 'Valid session is required to access this resource'
    });
  }

  // セッションの有効期限チェック
  const now = Date.now();
  const sessionTimeout = 24 * 60 * 60 * 1000; // 24時間

  if (req.session.lastActivity && (now - req.session.lastActivity) > sessionTimeout) {
    // セッションが期限切れ
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying expired session:', err);
      }
    });

    return res.status(401).json({
      success: false,
      error: 'Session expired',
      message: 'Your session has expired. Please log in again.'
    });
  }

  // 最終アクティビティ時間を更新
  req.session.lastActivity = now;

  next();
};

// セッション情報を設定するヘルパー関数
export const setSessionUser = (req: Request, user: {
  id: string;
  email: string;
  role: string;
}) => {
  req.session.userId = user.id;
  req.session.email = user.email;
  req.session.role = user.role;
  req.session.loginTime = Date.now();
  req.session.lastActivity = Date.now();
  req.session.isAuthenticated = true;
};

// セッション情報をクリアするヘルパー関数
export const clearSession = (req: Request, res: Response, callback?: (err?: any) => void) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      if (callback) callback(err);
      return;
    }

    // セッションクッキーをクリア
    res.clearCookie('legalflow3.sid');

    if (callback) callback();
  });
};

// セッション情報を取得するヘルパー関数
export const getSessionUser = (req: Request) => {
  if (!req.session || !req.session.isAuthenticated) {
    return null;
  }

  return {
    id: req.session.userId!,
    email: req.session.email!,
    role: req.session.role!,
    loginTime: req.session.loginTime,
    lastActivity: req.session.lastActivity
  };
};

// セッションの有効期限を延長するヘルパー関数
export const extendSession = (req: Request) => {
  if (req.session) {
    req.session.lastActivity = Date.now();
  }
};

// セッションの有効期限をチェックするヘルパー関数
export const isSessionValid = (req: Request): boolean => {
  if (!req.session || !req.session.isAuthenticated) {
    return false;
  }

  const now = Date.now();
  const sessionTimeout = 24 * 60 * 60 * 1000; // 24時間

  if (req.session.lastActivity && (now - req.session.lastActivity) > sessionTimeout) {
    return false;
  }

  return true;
};

// セッションの残り時間を取得するヘルパー関数
export const getSessionRemainingTime = (req: Request): number => {
  if (!req.session || !req.session.lastActivity) {
    return 0;
  }

  const now = Date.now();
  const sessionTimeout = 24 * 60 * 60 * 1000; // 24時間
  const remaining = sessionTimeout - (now - req.session.lastActivity);

  return Math.max(0, remaining);
};

// セッション情報を更新するヘルパー関数
export const updateSessionUser = (req: Request, updates: {
  email?: string;
  role?: string;
}) => {
  if (req.session && req.session.isAuthenticated) {
    if (updates.email) {
      req.session.email = updates.email;
    }
    if (updates.role) {
      req.session.role = updates.role;
    }
    req.session.lastActivity = Date.now();
  }
};

// セッションの統計情報を取得するヘルパー関数
export const getSessionStats = (req: Request) => {
  if (!req.session || !req.session.isAuthenticated) {
    return null;
  }

  const now = Date.now();
  const loginTime = req.session.loginTime || now;
  const lastActivity = req.session.lastActivity || now;

  return {
    userId: req.session.userId,
    email: req.session.email,
    role: req.session.role,
    loginTime: new Date(loginTime),
    lastActivity: new Date(lastActivity),
    sessionDuration: now - loginTime,
    idleTime: now - lastActivity,
    remainingTime: getSessionRemainingTime(req)
  };
};
