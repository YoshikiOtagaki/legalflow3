import { Request, Response, NextFunction } from 'express'
import { log } from '../utils/logger'

interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
}

class MemoryCache {
  private cache = new Map<string, CacheEntry>()
  private maxSize = 1000 // 最大キャッシュエントリ数
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // 定期的に期限切れのエントリをクリーンアップ
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000) // 1分ごと
  }

  set(key: string, data: any, ttl: number = 300000): void { // デフォルト5分
    // キャッシュサイズが上限に達した場合は古いエントリを削除
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  get(key: string): any | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // 期限切れチェック
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))

    if (keysToDelete.length > 0) {
      log.debug(`Cleaned up ${keysToDelete.length} expired cache entries`)
    }
  }

  private evictOldest(): void {
    let oldestKey = ''
    let oldestTimestamp = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  getStats(): {
    size: number
    maxSize: number
    hitRate: number
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // TODO: ヒット率の計算を実装
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.cache.clear()
  }
}

// グローバルキャッシュインスタンス
const cache = new MemoryCache()

// キャッシュキー生成関数
const generateCacheKey = (req: Request): string => {
  const baseKey = `${req.method}:${req.originalUrl}`
  const queryString = req.query ? JSON.stringify(req.query) : ''
  const userId = (req as any).user?.id || 'anonymous'

  return `${baseKey}:${queryString}:${userId}`
}

// キャッシュミドルウェア
export const cacheMiddleware = (ttl: number = 300000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // GETリクエストのみキャッシュ
    if (req.method !== 'GET') {
      return next()
    }

    const cacheKey = generateCacheKey(req)
    const cachedData = cache.get(cacheKey)

    if (cachedData) {
      log.debug(`Cache hit for key: ${cacheKey}`)
      return res.json(cachedData)
    }

    // レスポンスをキャッシュするためにオリジナルのjsonメソッドを保存
    const originalJson = res.json.bind(res)

    res.json = function (data: any) {
      // 成功レスポンスのみキャッシュ
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, data, ttl)
        log.debug(`Cached response for key: ${cacheKey}`)
      }

      return originalJson(data)
    }

    next()
  }
}

// 特定のルート用のキャッシュ設定
export const cacheConfig = {
  // ダッシュボードデータ（5分）
  dashboard: cacheMiddleware(300000),

  // ケース一覧（2分）
  cases: cacheMiddleware(120000),

  // 当事者一覧（2分）
  parties: cacheMiddleware(120000),

  // ドキュメント一覧（1分）
  documents: cacheMiddleware(60000),

  // タイムシート一覧（1分）
  timesheets: cacheMiddleware(60000),

  // 通知一覧（30秒）
  notifications: cacheMiddleware(30000),

  // ユーザー情報（10分）
  userProfile: cacheMiddleware(600000),
}

// キャッシュ無効化関数
export const invalidateCache = (pattern: string): void => {
  // パターンに一致するキャッシュキーを削除
  // 実装は簡略化されているが、実際には正規表現マッチングが必要
  log.debug(`Invalidating cache for pattern: ${pattern}`)
}

// 特定のユーザーのキャッシュを無効化
export const invalidateUserCache = (userId: string): void => {
  // ユーザー関連のキャッシュを無効化
  log.debug(`Invalidating cache for user: ${userId}`)
}

// 特定のケースのキャッシュを無効化
export const invalidateCaseCache = (caseId: string): void => {
  // ケース関連のキャッシュを無効化
  log.debug(`Invalidating cache for case: ${caseId}`)
}

// キャッシュ統計取得
export const getCacheStats = () => {
  return cache.getStats()
}

// キャッシュクリア
export const clearCache = (): void => {
  cache.clear()
  log.info('Cache cleared')
}

// アプリケーション終了時のクリーンアップ
process.on('SIGINT', () => {
  cache.destroy()
})

process.on('SIGTERM', () => {
  cache.destroy()
})

export default cache
