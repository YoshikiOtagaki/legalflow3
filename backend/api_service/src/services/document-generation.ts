import axios from 'axios'

const DOCGEN_SERVICE_URL = process.env.DOCGEN_SERVICE_URL || 'http://localhost:8000'

export interface DocumentGenerationRequest {
  templateId: string
  caseId: string
  data: Record<string, any>
  outputFormat?: 'docx' | 'pdf'
}

export interface DocumentGenerationResponse {
  success: boolean
  documentId?: string
  downloadUrl?: string
  error?: string
}

export interface TemplateInfo {
  id: string
  name: string
  description: string
  category: string
  placeholders: string[]
}

export class DocumentGenerationService {
  private baseURL: string

  constructor() {
    this.baseURL = DOCGEN_SERVICE_URL
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<T> {
    try {
      const response = await axios({
        method,
        url: `${this.baseURL}${endpoint}`,
        data,
        timeout: 30000, // 30秒タイムアウト
        headers: {
          'Content-Type': 'application/json',
        },
      })

      return response.data
    } catch (error) {
      console.error('Document generation service error:', error)

      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message ||
          error.message ||
          'Document generation service unavailable'
        )
      }

      throw new Error('Document generation service unavailable')
    }
  }

  async generateDocument(request: DocumentGenerationRequest): Promise<DocumentGenerationResponse> {
    try {
      const response = await this.makeRequest<DocumentGenerationResponse>(
        '/api/documents/generate',
        'POST',
        request
      )

      return response
    } catch (error) {
      console.error('Failed to generate document:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  async getTemplates(): Promise<TemplateInfo[]> {
    try {
      const response = await this.makeRequest<TemplateInfo[]>('/api/templates')
      return response
    } catch (error) {
      console.error('Failed to fetch templates:', error)
      return []
    }
  }

  async getTemplate(templateId: string): Promise<TemplateInfo | null> {
    try {
      const response = await this.makeRequest<TemplateInfo>(`/api/templates/${templateId}`)
      return response
    } catch (error) {
      console.error('Failed to fetch template:', error)
      return null
    }
  }

  async uploadTemplate(file: Buffer, templateInfo: Omit<TemplateInfo, 'id'>): Promise<{ success: boolean; templateId?: string; error?: string }> {
    try {
      const formData = new FormData()
      formData.append('file', new Blob([file]), 'template.docx')
      formData.append('templateInfo', JSON.stringify(templateInfo))

      const response = await axios.post(`${this.baseURL}/api/templates/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60秒タイムアウト
      })

      return response.data
    } catch (error) {
      console.error('Failed to upload template:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  async extractDataFromPdf(pdfFile: Buffer): Promise<{ success: boolean; data?: Record<string, any>; error?: string }> {
    try {
      const formData = new FormData()
      formData.append('file', new Blob([pdfFile]), 'document.pdf')

      const response = await axios.post(`${this.baseURL}/api/extract/pdf`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2分タイムアウト
      })

      return response.data
    } catch (error) {
      console.error('Failed to extract data from PDF:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  async extractDataFromImage(imageFile: Buffer): Promise<{ success: boolean; data?: Record<string, any>; error?: string }> {
    try {
      const formData = new FormData()
      formData.append('file', new Blob([imageFile]), 'image.png')

      const response = await axios.post(`${this.baseURL}/api/extract/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2分タイムアウト
      })

      return response.data
    } catch (error) {
      console.error('Failed to extract data from image:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await this.makeRequest<{ status: string; timestamp: string }>('/health')
      return response
    } catch (error) {
      console.error('Document generation service health check failed:', error)
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
      }
    }
  }
}

export const documentGenerationService = new DocumentGenerationService()
