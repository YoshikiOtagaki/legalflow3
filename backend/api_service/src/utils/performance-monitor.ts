import { performance } from 'perf_hooks'
import { logPerformance } from './logger'

export interface PerformanceMetrics {
  operation: string
  duration: number
  memoryUsage: NodeJS.MemoryUsage
  timestamp: Date
  metadata?: Record<string, any>
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetrics[] = []
  private maxMetrics = 1000 // 保持するメトリクスの最大数

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * パフォーマンス測定を開始
   */
  startTiming(operation: string): () => void {
    const startTime = performance.now()
    const startMemory = process.memoryUsage()

    return () => {
      const endTime = performance.now()
      const endMemory = process.memoryUsage()
      const duration = endTime - startTime

      const metric: PerformanceMetrics = {
        operation,
        duration,
        memoryUsage: {
          rss: endMemory.rss - startMemory.rss,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal,
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          external: endMemory.external - startMemory.external,
          arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers,
        },
        timestamp: new Date(),
      }

      this.recordMetric(metric)
      logPerformance(operation, duration, { memoryDelta: metric.memoryUsage })
    }
  }

  /**
   * メトリクスを記録
   */
  recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric)

    // メトリクスが上限を超えた場合は古いものから削除
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }

  /**
   * 指定された操作の平均実行時間を取得
   */
  getAverageDuration(operation: string, timeWindow?: number): number {
    const now = Date.now()
    const cutoff = timeWindow ? now - timeWindow : 0

    const relevantMetrics = this.metrics.filter(metric => {
      const metricTime = metric.timestamp.getTime()
      return metric.operation === operation && metricTime >= cutoff
    })

    if (relevantMetrics.length === 0) return 0

    const totalDuration = relevantMetrics.reduce((sum, metric) => sum + metric.duration, 0)
    return totalDuration / relevantMetrics.length
  }

  /**
   * 指定された操作の最大実行時間を取得
   */
  getMaxDuration(operation: string, timeWindow?: number): number {
    const now = Date.now()
    const cutoff = timeWindow ? now - timeWindow : 0

    const relevantMetrics = this.metrics.filter(metric => {
      const metricTime = metric.timestamp.getTime()
      return metric.operation === operation && metricTime >= cutoff
    })

    if (relevantMetrics.length === 0) return 0

    return Math.max(...relevantMetrics.map(metric => metric.duration))
  }

  /**
   * 指定された操作の実行回数を取得
   */
  getExecutionCount(operation: string, timeWindow?: number): number {
    const now = Date.now()
    const cutoff = timeWindow ? now - timeWindow : 0

    return this.metrics.filter(metric => {
      const metricTime = metric.timestamp.getTime()
      return metric.operation === operation && metricTime >= cutoff
    }).length
  }

  /**
   * メモリ使用量の統計を取得
   */
  getMemoryStats(timeWindow?: number): {
    averageRSS: number
    maxRSS: number
    averageHeapUsed: number
    maxHeapUsed: number
  } {
    const now = Date.now()
    const cutoff = timeWindow ? now - timeWindow : 0

    const relevantMetrics = this.metrics.filter(metric => {
      const metricTime = metric.timestamp.getTime()
      return metricTime >= cutoff
    })

    if (relevantMetrics.length === 0) {
      return {
        averageRSS: 0,
        maxRSS: 0,
        averageHeapUsed: 0,
        maxHeapUsed: 0,
      }
    }

    const rssValues = relevantMetrics.map(metric => metric.memoryUsage.rss)
    const heapUsedValues = relevantMetrics.map(metric => metric.memoryUsage.heapUsed)

    return {
      averageRSS: rssValues.reduce((sum, val) => sum + val, 0) / rssValues.length,
      maxRSS: Math.max(...rssValues),
      averageHeapUsed: heapUsedValues.reduce((sum, val) => sum + val, 0) / heapUsedValues.length,
      maxHeapUsed: Math.max(...heapUsedValues),
    }
  }

  /**
   * パフォーマンス統計を取得
   */
  getPerformanceStats(timeWindow?: number): {
    operation: string
    count: number
    averageDuration: number
    maxDuration: number
    minDuration: number
  }[] {
    const now = Date.now()
    const cutoff = timeWindow ? now - timeWindow : 0

    const relevantMetrics = this.metrics.filter(metric => {
      const metricTime = metric.timestamp.getTime()
      return metricTime >= cutoff
    })

    const operationGroups = relevantMetrics.reduce((groups, metric) => {
      if (!groups[metric.operation]) {
        groups[metric.operation] = []
      }
      groups[metric.operation].push(metric)
      return groups
    }, {} as Record<string, PerformanceMetrics[]>)

    return Object.entries(operationGroups).map(([operation, metrics]) => {
      const durations = metrics.map(metric => metric.duration)
      return {
        operation,
        count: metrics.length,
        averageDuration: durations.reduce((sum, val) => sum + val, 0) / durations.length,
        maxDuration: Math.max(...durations),
        minDuration: Math.min(...durations),
      }
    })
  }

  /**
   * メトリクスをクリア
   */
  clearMetrics(): void {
    this.metrics = []
  }

  /**
   * パフォーマンス監視のデコレータ
   */
  static measure(operation: string) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
      const method = descriptor.value

      descriptor.value = async function (...args: any[]) {
        const monitor = PerformanceMonitor.getInstance()
        const endTiming = monitor.startTiming(`${operation}.${propertyName}`)

        try {
          const result = await method.apply(this, args)
          return result
        } finally {
          endTiming()
        }
      }

      return descriptor
    }
  }
}

// シングルトンインスタンスをエクスポート
export const performanceMonitor = PerformanceMonitor.getInstance()

// パフォーマンス監視ミドルウェア
export const performanceMiddleware = (req: any, res: any, next: any) => {
  const monitor = PerformanceMonitor.getInstance()
  const endTiming = monitor.startTiming(`API.${req.method}.${req.route?.path || req.path}`)

  res.on('finish', () => {
    endTiming()
  })

  next()
}

// データベースクエリのパフォーマンス監視
export const monitorDatabaseQuery = (operation: string) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const monitor = PerformanceMonitor.getInstance()
      const endTiming = monitor.startTiming(`DB.${operation}.${propertyName}`)

      try {
        const result = await method.apply(this, args)
        return result
      } finally {
        endTiming()
      }
    }

    return descriptor
  }
}

// 外部API呼び出しのパフォーマンス監視
export const monitorExternalAPI = (service: string) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const monitor = PerformanceMonitor.getInstance()
      const endTiming = monitor.startTiming(`ExternalAPI.${service}.${propertyName}`)

      try {
        const result = await method.apply(this, args)
        return result
      } finally {
        endTiming()
      }
    }

    return descriptor
  }
}
