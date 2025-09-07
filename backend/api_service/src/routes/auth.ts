import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

const router = Router()
const prisma = new PrismaClient()

// バリデーションスキーマ
const registerSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上である必要があります'),
  role: z.enum(['admin', 'lawyer', 'client', 'staff']).optional().default('client'),
})

const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードは必須です'),
})

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: ユーザー登録
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: ユーザー名
 *                 example: "田中太郎"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: メールアドレス
 *                 example: "tanaka@example.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: パスワード
 *                 example: "password123"
 *               role:
 *                 type: string
 *                 enum: [admin, lawyer, client, staff]
 *                 description: ユーザーロール
 *                 default: client
 *                 example: "lawyer"
 *     responses:
 *       201:
 *         description: ユーザー登録成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *                       description: アクセストークン
 *                     refreshToken:
 *                       type: string
 *                       description: リフレッシュトークン
 *       400:
 *         description: バリデーションエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: メールアドレスが既に存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: サーバーエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body)

    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'このメールアドレスは既に使用されています',
        code: 'EMAIL_ALREADY_EXISTS',
      })
    }

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // ユーザー作成
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role,
      },
    })

    // JWTトークン生成
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    )

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        accessToken,
        refreshToken,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message,
        code: 'VALIDATION_ERROR',
      })
    }

    console.error('Registration error:', error)
    res.status(500).json({
      success: false,
      error: 'ユーザー登録に失敗しました',
      code: 'INTERNAL_ERROR',
    })
  }
})

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: ユーザーログイン
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: メールアドレス
 *                 example: "tanaka@example.com"
 *               password:
 *                 type: string
 *                 description: パスワード
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: ログイン成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *                       description: アクセストークン
 *                     refreshToken:
 *                       type: string
 *                       description: リフレッシュトークン
 *       400:
 *         description: バリデーションエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: 認証失敗
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: サーバーエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body)

    // ユーザー検索
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'メールアドレスまたはパスワードが正しくありません',
        code: 'INVALID_CREDENTIALS',
      })
    }

    // パスワード検証
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'メールアドレスまたはパスワードが正しくありません',
        code: 'INVALID_CREDENTIALS',
      })
    }

    // JWTトークン生成
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    )

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        accessToken,
        refreshToken,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message,
        code: 'VALIDATION_ERROR',
      })
    }

    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      error: 'ログインに失敗しました',
      code: 'INTERNAL_ERROR',
    })
  }
})

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: ユーザーログアウト
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ログアウト成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "ログアウトしました"
 *       401:
 *         description: 認証が必要
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/logout', async (req, res) => {
  try {
    // セッションを破棄
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err)
        return res.status(500).json({
          success: false,
          error: 'ログアウトに失敗しました',
          code: 'INTERNAL_ERROR',
        })
      }

      res.json({
        success: true,
        message: 'ログアウトしました',
      })
    })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({
      success: false,
      error: 'ログアウトに失敗しました',
      code: 'INTERNAL_ERROR',
    })
  }
})

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: トークンリフレッシュ
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: リフレッシュトークン
 *     responses:
 *       200:
 *         description: トークンリフレッシュ成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: 新しいアクセストークン
 *       401:
 *         description: 無効なリフレッシュトークン
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: サーバーエラー
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'リフレッシュトークンが必要です',
        code: 'REFRESH_TOKEN_REQUIRED',
      })
    }

    // リフレッシュトークンの検証
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as any

    // ユーザー検索
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        error: '無効なリフレッシュトークンです',
        code: 'INVALID_REFRESH_TOKEN',
      })
    }

    // 新しいアクセストークン生成
    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    )

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: '無効なリフレッシュトークンです',
        code: 'INVALID_REFRESH_TOKEN',
      })
    }

    console.error('Token refresh error:', error)
    res.status(500).json({
      success: false,
      error: 'トークンリフレッシュに失敗しました',
      code: 'INTERNAL_ERROR',
    })
  }
})

export default router
