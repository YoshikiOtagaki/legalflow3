import { Router } from 'express'
import { authenticateToken } from '../middleware/auth'
import { documentGenerationService } from '../services/document-generation'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

// 認証が必要なすべてのルートにミドルウェアを適用
router.use(authenticateToken)

// テンプレート一覧取得
router.get('/templates', async (req, res) => {
  try {
    const templates = await documentGenerationService.getTemplates()
    res.json({
      success: true,
      data: templates,
    })
  } catch (error) {
    console.error('Failed to fetch templates:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates',
    })
  }
})

// テンプレート詳細取得
router.get('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params
    const template = await documentGenerationService.getTemplate(id)

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
      })
    }

    res.json({
      success: true,
      data: template,
    })
  } catch (error) {
    console.error('Failed to fetch template:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch template',
    })
  }
})

// ドキュメント生成
router.post('/generate', async (req, res) => {
  try {
    const { templateId, caseId, data, outputFormat = 'docx' } = req.body

    if (!templateId || !caseId || !data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: templateId, caseId, data',
      })
    }

    // ケースの存在確認
    const case_ = await prisma.case.findUnique({
      where: { id: caseId },
    })

    if (!case_) {
      return res.status(404).json({
        success: false,
        error: 'Case not found',
      })
    }

    // ドキュメント生成リクエスト
    const generationRequest = {
      templateId,
      caseId,
      data,
      outputFormat,
    }

    const result = await documentGenerationService.generateDocument(generationRequest)

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Document generation failed',
      })
    }

    // 生成されたドキュメントをデータベースに記録
    if (result.documentId) {
      await prisma.document.create({
        data: {
          id: result.documentId,
          caseId,
          title: `Generated Document - ${templateId}`,
          type: outputFormat.toUpperCase(),
          filePath: result.downloadUrl || '',
          uploadedBy: req.user?.id || '',
        },
      })
    }

    res.json({
      success: true,
      data: {
        documentId: result.documentId,
        downloadUrl: result.downloadUrl,
      },
    })
  } catch (error) {
    console.error('Failed to generate document:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate document',
    })
  }
})

// PDFデータ抽出
router.post('/extract/pdf', async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      })
    }

    const result = await documentGenerationService.extractDataFromPdf(req.file.buffer)

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'PDF extraction failed',
      })
    }

    res.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('Failed to extract PDF data:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to extract PDF data',
    })
  }
})

// 画像データ抽出
router.post('/extract/image', async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      })
    }

    const result = await documentGenerationService.extractDataFromImage(req.file.buffer)

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Image extraction failed',
      })
    }

    res.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('Failed to extract image data:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to extract image data',
    })
  }
})

// ヘルスチェック
router.get('/health', async (req, res) => {
  try {
    const health = await documentGenerationService.healthCheck()
    res.json({
      success: true,
      data: health,
    })
  } catch (error) {
    console.error('Health check failed:', error)
    res.status(500).json({
      success: false,
      error: 'Health check failed',
    })
  }
})

export default router
