import { z } from 'zod'

// 共通のバリデーションスキーマ
export const commonSchemas = {
  // UUID検証
  uuid: z.string().uuid('有効なUUIDを入力してください'),

  // メールアドレス検証
  email: z.string().email('有効なメールアドレスを入力してください'),

  // パスワード検証
  password: z.string()
    .min(8, 'パスワードは8文字以上である必要があります')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'パスワードは大文字、小文字、数字を含む必要があります'),

  // 名前検証
  name: z.string()
    .min(1, '名前は必須です')
    .max(100, '名前は100文字以内である必要があります'),

  // 電話番号検証
  phone: z.string()
    .regex(/^[\d\-\+\(\)\s]+$/, '有効な電話番号を入力してください')
    .optional(),

  // 日付検証
  date: z.string().datetime('有効な日付を入力してください'),

  // ページネーション検証
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(10),
  }),
}

// ユーザー関連のバリデーション
export const userSchemas = {
  register: z.object({
    name: commonSchemas.name,
    email: commonSchemas.email,
    password: commonSchemas.password,
    role: z.enum(['admin', 'lawyer', 'client', 'staff']).default('client'),
  }),

  login: z.object({
    email: commonSchemas.email,
    password: z.string().min(1, 'パスワードは必須です'),
  }),

  update: z.object({
    name: commonSchemas.name.optional(),
    email: commonSchemas.email.optional(),
    role: z.enum(['admin', 'lawyer', 'client', 'staff']).optional(),
  }),
}

// ケース関連のバリデーション
export const caseSchemas = {
  create: z.object({
    title: z.string().min(1, 'ケースタイトルは必須です').max(200, 'タイトルは200文字以内である必要があります'),
    description: z.string().max(1000, '説明は1000文字以内である必要があります').optional(),
    category: z.enum(['civil', 'criminal', 'family', 'corporate', 'immigration', 'real_estate'], {
      errorMap: () => ({ message: '有効なカテゴリを選択してください' })
    }),
    status: z.enum(['active', 'completed', 'pending', 'on_hold', 'cancelled'], {
      errorMap: () => ({ message: '有効なステータスを選択してください' })
    }).default('active'),
    priority: z.enum(['low', 'medium', 'high', 'urgent'], {
      errorMap: () => ({ message: '有効な優先度を選択してください' })
    }).default('medium'),
    clientId: commonSchemas.uuid.optional(),
    lawyerId: commonSchemas.uuid.optional(),
    courtId: commonSchemas.uuid.optional(),
    caseNumber: z.string().max(50, 'ケース番号は50文字以内である必要があります').optional(),
    filingDate: commonSchemas.date.optional(),
    expectedResolutionDate: commonSchemas.date.optional(),
  }),

  update: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    category: z.enum(['civil', 'criminal', 'family', 'corporate', 'immigration', 'real_estate']).optional(),
    status: z.enum(['active', 'completed', 'pending', 'on_hold', 'cancelled']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    clientId: commonSchemas.uuid.optional(),
    lawyerId: commonSchemas.uuid.optional(),
    courtId: commonSchemas.uuid.optional(),
    caseNumber: z.string().max(50).optional(),
    filingDate: commonSchemas.date.optional(),
    expectedResolutionDate: commonSchemas.date.optional(),
  }),

  query: z.object({
    page: commonSchemas.pagination.shape.page,
    limit: commonSchemas.pagination.shape.limit,
    search: z.string().optional(),
    status: z.enum(['active', 'completed', 'pending', 'on_hold', 'cancelled']).optional(),
    category: z.enum(['civil', 'criminal', 'family', 'corporate', 'immigration', 'real_estate']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  }),
}

// 当事者関連のバリデーション
export const partySchemas = {
  create: z.object({
    name: commonSchemas.name,
    type: z.enum(['individual', 'corporate'], {
      errorMap: () => ({ message: '有効なタイプを選択してください' })
    }),
    email: commonSchemas.email.optional(),
    phone: commonSchemas.phone,
    address: z.string().max(500, '住所は500文字以内である必要があります').optional(),
    caseId: commonSchemas.uuid.optional(),
  }),

  update: z.object({
    name: commonSchemas.name.optional(),
    type: z.enum(['individual', 'corporate']).optional(),
    email: commonSchemas.email.optional(),
    phone: commonSchemas.phone,
    address: z.string().max(500).optional(),
    caseId: commonSchemas.uuid.optional(),
  }),

  query: z.object({
    page: commonSchemas.pagination.shape.page,
    limit: commonSchemas.pagination.shape.limit,
    search: z.string().optional(),
    type: z.enum(['individual', 'corporate']).optional(),
    caseId: commonSchemas.uuid.optional(),
  }),
}

// ドキュメント関連のバリデーション
export const documentSchemas = {
  create: z.object({
    title: z.string().min(1, 'ドキュメントタイトルは必須です').max(200, 'タイトルは200文字以内である必要があります'),
    type: z.enum(['contract', 'memo', 'brief', 'pleading', 'evidence', 'other'], {
      errorMap: () => ({ message: '有効なドキュメントタイプを選択してください' })
    }),
    description: z.string().max(1000, '説明は1000文字以内である必要があります').optional(),
    caseId: commonSchemas.uuid.optional(),
  }),

  update: z.object({
    title: z.string().min(1).max(200).optional(),
    type: z.enum(['contract', 'memo', 'brief', 'pleading', 'evidence', 'other']).optional(),
    description: z.string().max(1000).optional(),
    caseId: commonSchemas.uuid.optional(),
  }),

  query: z.object({
    page: commonSchemas.pagination.shape.page,
    limit: commonSchemas.pagination.shape.limit,
    search: z.string().optional(),
    type: z.enum(['contract', 'memo', 'brief', 'pleading', 'evidence', 'other']).optional(),
    caseId: commonSchemas.uuid.optional(),
  }),
}

// タイムシート関連のバリデーション
export const timesheetSchemas = {
  create: z.object({
    caseId: commonSchemas.uuid,
    description: z.string().min(1, '作業内容は必須です').max(500, '作業内容は500文字以内である必要があります'),
    startTime: commonSchemas.date,
    endTime: commonSchemas.date,
    billableHours: z.number().min(0, '請求可能時間は0以上である必要があります').max(24, '請求可能時間は24時間以下である必要があります'),
    nonBillableHours: z.number().min(0).max(24).default(0),
    hourlyRate: z.number().int().min(0, '時給は0以上である必要があります'),
  }).refine(data => {
    const start = new Date(data.startTime)
    const end = new Date(data.endTime)
    return end > start
  }, {
    message: '終了時間は開始時間より後である必要があります',
    path: ['endTime']
  }),

  update: z.object({
    caseId: commonSchemas.uuid.optional(),
    description: z.string().min(1).max(500).optional(),
    startTime: commonSchemas.date.optional(),
    endTime: commonSchemas.date.optional(),
    billableHours: z.number().min(0).max(24).optional(),
    nonBillableHours: z.number().min(0).max(24).optional(),
    hourlyRate: z.number().int().min(0).optional(),
  }),

  query: z.object({
    page: commonSchemas.pagination.shape.page,
    limit: commonSchemas.pagination.shape.limit,
    caseId: commonSchemas.uuid.optional(),
    userId: commonSchemas.uuid.optional(),
    startDate: commonSchemas.date.optional(),
    endDate: commonSchemas.date.optional(),
  }),
}

// 通知関連のバリデーション
export const notificationSchemas = {
  create: z.object({
    userId: commonSchemas.uuid,
    type: z.enum(['case_update', 'deadline_reminder', 'document_upload', 'timesheet_reminder', 'system_alert'], {
      errorMap: () => ({ message: '有効な通知タイプを選択してください' })
    }),
    title: z.string().min(1, '通知タイトルは必須です').max(200, 'タイトルは200文字以内である必要があります'),
    message: z.string().min(1, '通知メッセージは必須です').max(1000, 'メッセージは1000文字以内である必要があります'),
    caseId: commonSchemas.uuid.optional(),
  }),

  query: z.object({
    page: commonSchemas.pagination.shape.page,
    limit: commonSchemas.pagination.shape.limit,
    unreadOnly: z.boolean().optional(),
  }),

  markAsRead: z.object({
    notificationId: commonSchemas.uuid,
  }),
}

// バリデーション関数
export const validateRequest = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors[0]?.message || 'バリデーションエラーが発生しました'
      throw new Error(errorMessage)
    }
    throw error
  }
}

// バリデーションミドルウェア
export const createValidationMiddleware = <T>(schema: z.ZodSchema<T>) => {
  return (req: any, res: any, next: any) => {
    try {
      req.validatedData = validateRequest(schema, req.body)
      next()
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'バリデーションエラーが発生しました',
        code: 'VALIDATION_ERROR',
      })
    }
  }
}

// クエリパラメータのバリデーション
export const createQueryValidationMiddleware = <T>(schema: z.ZodSchema<T>) => {
  return (req: any, res: any, next: any) => {
    try {
      // クエリパラメータを適切な型に変換
      const queryData = {
        ...req.query,
        page: req.query.page ? parseInt(req.query.page) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        unreadOnly: req.query.unreadOnly === 'true',
      }

      req.validatedQuery = validateRequest(schema, queryData)
      next()
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'クエリパラメータのバリデーションエラーが発生しました',
        code: 'VALIDATION_ERROR',
      })
    }
  }
}
