import { Request, Response, NextFunction } from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { logSecurityEvent } from '../utils/logger'

// レート制限設定
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: message || 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logSecurityEvent('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        method: req.method,
      })
      res.status(429).json({
        success: false,
        error: message || 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
      })
    },
  })
}

// 一般的なレート制限（15分間に100リクエスト）
export const generalRateLimit = createRateLimit(
  15 * 60 * 1000, // 15分
  100, // 100リクエスト
  'Too many requests from this IP, please try again later.'
)

// 認証レート制限（15分間に5回）
export const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15分
  5, // 5回
  'Too many authentication attempts, please try again later.'
)

// パスワードリセットレート制限（1時間に3回）
export const passwordResetRateLimit = createRateLimit(
  60 * 60 * 1000, // 1時間
  3, // 3回
  'Too many password reset attempts, please try again later.'
)

// ヘルメット設定
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.line.me", "https://graph.microsoft.com", "https://www.googleapis.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
})

// CORS設定
export const corsConfig = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
    ]

    // 開発環境ではoriginがundefinedの場合も許可
    if (process.env.NODE_ENV === 'development' && !origin) {
      return callback(null, true)
    }

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      logSecurityEvent('CORS violation', {
        origin,
        allowedOrigins,
      })
      callback(new Error('Not allowed by CORS'), false)
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Line-Signature',
  ],
}

// セキュリティヘッダー設定
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff')

  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY')

  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block')

  // Referrer-Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions-Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

  // Strict-Transport-Security (HTTPS環境でのみ)
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  next()
}

// IPホワイトリストチェック
export const ipWhitelist = (req: Request, res: Response, next: NextFunction) => {
  const whitelist = process.env.IP_WHITELIST?.split(',') || []

  if (whitelist.length === 0) {
    return next() // ホワイトリストが設定されていない場合はスキップ
  }

  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress

  if (!clientIP || !whitelist.includes(clientIP)) {
    logSecurityEvent('IP not in whitelist', {
      ip: clientIP,
      whitelist,
      url: req.originalUrl,
      method: req.method,
    })

    return res.status(403).json({
      success: false,
      error: 'Access denied',
      code: 'IP_NOT_WHITELISTED',
    })
  }

  next()
}

// リクエストサイズ制限
export const requestSizeLimit = (req: Request, res: Response, next: NextFunction) => {
  const maxSize = parseInt(process.env.MAX_REQUEST_SIZE || '10485760') // 10MB

  if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxSize) {
    logSecurityEvent('Request size exceeded', {
      ip: req.ip,
      contentLength: req.headers['content-length'],
      maxSize,
      url: req.originalUrl,
      method: req.method,
    })

    return res.status(413).json({
      success: false,
      error: 'Request entity too large',
      code: 'REQUEST_TOO_LARGE',
    })
  }

  next()
}

// ユーザーエージェントチェック
export const userAgentCheck = (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.get('User-Agent')
  const blockedUserAgents = process.env.BLOCKED_USER_AGENTS?.split(',') || []

  if (blockedUserAgents.length > 0 && userAgent) {
    const isBlocked = blockedUserAgents.some(blocked =>
      userAgent.toLowerCase().includes(blocked.toLowerCase())
    )

    if (isBlocked) {
      logSecurityEvent('Blocked user agent', {
        ip: req.ip,
        userAgent,
        blockedUserAgents,
        url: req.originalUrl,
        method: req.method,
      })

      return res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'BLOCKED_USER_AGENT',
      })
    }
  }

  next()
}

// セキュリティイベントログ
export const securityEventLogger = (req: Request, res: Response, next: NextFunction) => {
  // 疑わしいリクエストパターンを検出
  const suspiciousPatterns = [
    /\.\./, // ディレクトリトラバーサル
    /<script/i, // XSS
    /union.*select/i, // SQLインジェクション
    /javascript:/i, // JavaScript URL
    /on\w+\s*=/i, // イベントハンドラー
  ]

  const url = req.originalUrl.toLowerCase()
  const body = JSON.stringify(req.body).toLowerCase()

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url) || pattern.test(body)) {
      logSecurityEvent('Suspicious request detected', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl,
        method: req.method,
        pattern: pattern.toString(),
        body: req.body,
      })

      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        code: 'SUSPICIOUS_REQUEST',
      })
    }
  }

  next()
}

// セッションセキュリティ
export const sessionSecurity = (req: Request, res: Response, next: NextFunction) => {
  // セッションIDの検証
  if (req.sessionID) {
    const sessionIdPattern = /^[a-zA-Z0-9_-]{24,}$/
    if (!sessionIdPattern.test(req.sessionID)) {
      logSecurityEvent('Invalid session ID format', {
        ip: req.ip,
        sessionId: req.sessionID,
        url: req.originalUrl,
        method: req.method,
      })

      return res.status(400).json({
        success: false,
        error: 'Invalid session',
        code: 'INVALID_SESSION',
      })
    }
  }

  next()
}

// リクエスト頻度チェック（IP別）
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export const requestFrequencyCheck = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || 'unknown'
  const now = Date.now()
  const windowMs = 60000 // 1分
  const maxRequests = 60 // 1分間に60リクエスト

  const current = requestCounts.get(ip)

  if (!current || now > current.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs })
    return next()
  }

  if (current.count >= maxRequests) {
    logSecurityEvent('Request frequency exceeded', {
      ip,
      count: current.count,
      maxRequests,
      url: req.originalUrl,
      method: req.method,
    })

    return res.status(429).json({
      success: false,
      error: 'Too many requests',
      code: 'FREQUENCY_LIMIT_EXCEEDED',
    })
  }

  current.count++
  next()
}
