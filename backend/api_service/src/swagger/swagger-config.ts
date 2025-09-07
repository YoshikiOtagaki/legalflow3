import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import { Express } from 'express'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LegalFlow3 API',
      version: '1.0.0',
      description: '法律事務所向けケース管理システムのAPI',
      contact: {
        name: 'LegalFlow3 Support',
        email: 'support@legalflow3.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3001',
        description: '開発サーバー',
      },
      {
        url: 'https://api.legalflow3.com',
        description: '本番サーバー',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ユーザーID',
            },
            name: {
              type: 'string',
              description: 'ユーザー名',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'メールアドレス',
            },
            role: {
              type: 'string',
              enum: ['admin', 'lawyer', 'client', 'staff'],
              description: 'ユーザーロール',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '作成日時',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '更新日時',
            },
          },
        },
        Case: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ケースID',
            },
            title: {
              type: 'string',
              description: 'ケースタイトル',
            },
            description: {
              type: 'string',
              description: 'ケース説明',
            },
            category: {
              type: 'string',
              enum: ['civil', 'criminal', 'family', 'corporate', 'immigration', 'real_estate'],
              description: 'ケースカテゴリ',
            },
            status: {
              type: 'string',
              enum: ['active', 'completed', 'pending', 'on_hold', 'cancelled'],
              description: 'ケースステータス',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              description: '優先度',
            },
            clientId: {
              type: 'string',
              format: 'uuid',
              description: 'クライアントID',
            },
            lawyerId: {
              type: 'string',
              format: 'uuid',
              description: '担当弁護士ID',
            },
            caseNumber: {
              type: 'string',
              description: 'ケース番号',
            },
            filingDate: {
              type: 'string',
              format: 'date',
              description: '申立日',
            },
            expectedResolutionDate: {
              type: 'string',
              format: 'date',
              description: '予想解決日',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '作成日時',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '更新日時',
            },
          },
        },
        Party: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: '当事者ID',
            },
            name: {
              type: 'string',
              description: '当事者名',
            },
            type: {
              type: 'string',
              enum: ['individual', 'corporate'],
              description: '当事者タイプ',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'メールアドレス',
            },
            phone: {
              type: 'string',
              description: '電話番号',
            },
            address: {
              type: 'string',
              description: '住所',
            },
            caseId: {
              type: 'string',
              format: 'uuid',
              description: '関連ケースID',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '作成日時',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '更新日時',
            },
          },
        },
        Document: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ドキュメントID',
            },
            title: {
              type: 'string',
              description: 'ドキュメントタイトル',
            },
            type: {
              type: 'string',
              enum: ['contract', 'memo', 'brief', 'pleading', 'evidence', 'other'],
              description: 'ドキュメントタイプ',
            },
            filePath: {
              type: 'string',
              description: 'ファイルパス',
            },
            fileSize: {
              type: 'integer',
              description: 'ファイルサイズ（バイト）',
            },
            mimeType: {
              type: 'string',
              description: 'MIMEタイプ',
            },
            caseId: {
              type: 'string',
              format: 'uuid',
              description: '関連ケースID',
            },
            uploadedBy: {
              type: 'string',
              format: 'uuid',
              description: 'アップロード者ID',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '作成日時',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '更新日時',
            },
          },
        },
        Timesheet: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'タイムシートID',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'ユーザーID',
            },
            caseId: {
              type: 'string',
              format: 'uuid',
              description: 'ケースID',
            },
            description: {
              type: 'string',
              description: '作業内容',
            },
            startTime: {
              type: 'string',
              format: 'date-time',
              description: '開始時間',
            },
            endTime: {
              type: 'string',
              format: 'date-time',
              description: '終了時間',
            },
            billableHours: {
              type: 'number',
              format: 'float',
              description: '請求可能時間',
            },
            nonBillableHours: {
              type: 'number',
              format: 'float',
              description: '非請求時間',
            },
            hourlyRate: {
              type: 'integer',
              description: '時給',
            },
            totalAmount: {
              type: 'integer',
              description: '合計金額',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '作成日時',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '更新日時',
            },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: '通知ID',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'ユーザーID',
            },
            type: {
              type: 'string',
              enum: ['case_update', 'deadline_reminder', 'document_upload', 'timesheet_reminder', 'system_alert'],
              description: '通知タイプ',
            },
            title: {
              type: 'string',
              description: '通知タイトル',
            },
            message: {
              type: 'string',
              description: '通知メッセージ',
            },
            isRead: {
              type: 'boolean',
              description: '既読フラグ',
            },
            caseId: {
              type: 'string',
              format: 'uuid',
              description: '関連ケースID',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '作成日時',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '更新日時',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: '成功フラグ',
            },
            error: {
              type: 'string',
              description: 'エラーメッセージ',
            },
            code: {
              type: 'string',
              description: 'エラーコード',
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              description: '現在のページ',
            },
            limit: {
              type: 'integer',
              description: '1ページあたりの件数',
            },
            total: {
              type: 'integer',
              description: '総件数',
            },
            totalPages: {
              type: 'integer',
              description: '総ページ数',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
      {
        sessionAuth: [],
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/routes/**/*.ts',
  ],
}

const specs = swaggerJsdoc(options)

export const setupSwagger = (app: Express): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'LegalFlow3 API Documentation',
  }))
}

export default specs
