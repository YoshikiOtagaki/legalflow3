import express from 'express';
import cors from 'cors';
import casesRouter from './routes/cases';
import partiesRouter from './routes/parties';
import lawyersRouter from './routes/lawyers';
import lawFirmsRouter from './routes/law-firms';
import courthousesRouter from './routes/courthouses';
import authRouter from './routes/auth';
import documentGenerationRouter from './routes/document-generation';
import lineWebhookRouter from './routes/line-webhook';
import { sessionMiddleware } from './middleware/session';
import { authenticateToken } from './middleware/auth';
import { performSecurityCheck } from './utils/security';
import { httpLogger } from './utils/logger';
import { errorHandler, notFoundHandler, globalErrorHandler } from './middleware/error-handler';
import {
  helmetConfig,
  corsConfig,
  securityHeaders,
  requestSizeLimit,
  userAgentCheck,
  securityEventLogger,
  sessionSecurity,
  requestFrequencyCheck,
  generalRateLimit,
  authRateLimit
} from './middleware/security';

// アプリケーションインスタンスを作成する関数
export function createApp() {
  // セキュリティチェックを実行
  performSecurityCheck();

  const app = express();

  // セキュリティミドルウェア
  app.use(helmetConfig);
  app.use(cors(corsConfig));
  app.use(securityHeaders);
  app.use(requestSizeLimit);
  app.use(userAgentCheck);
  app.use(securityEventLogger);
  app.use(sessionSecurity);
  app.use(requestFrequencyCheck);

  // レート制限
  app.use(generalRateLimit);

  // パーサーミドルウェア
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ログミドルウェア
  app.use(httpLogger);

  // セッションミドルウェア
  app.use(sessionMiddleware);

  // 認証ルート（認証不要、認証専用レート制限適用）
  app.use('/api/auth', authRateLimit, authRouter);

  // LINE webhook（認証不要）
  app.use('/api/line', lineWebhookRouter);

  // 保護されたルート（認証必要）
  app.use('/api/cases', authenticateToken, casesRouter);
  app.use('/api/parties', authenticateToken, partiesRouter);
  app.use('/api/lawyers', authenticateToken, lawyersRouter);
  app.use('/api/law-firms', authenticateToken, lawFirmsRouter);
  app.use('/api/courthouses', authenticateToken, courthousesRouter);
  app.use('/api/document-generation', documentGenerationRouter);

  // ヘルスチェック
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // 404ハンドリング
  app.use(notFoundHandler);

  // エラーハンドリング
  app.use(errorHandler);

  return app;
}

// 本番環境でのみサーバーを起動
if (process.env.NODE_ENV !== 'test') {
  const app = createApp();
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// テスト用にデフォルトエクスポート
export default createApp();
