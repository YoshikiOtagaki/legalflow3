import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { CaseService } from '../../../src/services/case'
import { PrismaClient } from '@prisma/client'

// Prismaクライアントのモック
const mockPrisma = {
  case: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  party: {
    findMany: jest.fn(),
  },
  document: {
    findMany: jest.fn(),
  },
  timesheet: {
    findMany: jest.fn(),
  },
} as any

// ケースサービスインスタンス
const caseService = new CaseService(mockPrisma)

describe('CaseService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createCase', () => {
    it('should create a case successfully', async () => {
      const caseData = {
        title: 'Test Case',
        description: 'Test case description',
        category: 'civil',
        status: 'active',
        priority: 'medium',
        clientId: 'client-1',
        lawyerId: 'lawyer-1',
        courtId: 'court-1',
        caseNumber: 'CASE-001',
        filingDate: new Date('2024-01-01'),
        expectedResolutionDate: new Date('2024-12-31'),
      }

      const expectedCase = {
        id: 'case-1',
        ...caseData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.case.create.mockResolvedValue(expectedCase)

      const result = await caseService.createCase(caseData)

      expect(result).toEqual(expectedCase)
      expect(mockPrisma.case.create).toHaveBeenCalledWith({
        data: caseData,
      })
    })

    it('should validate required fields', async () => {
      const invalidCaseData = {
        title: '', // 空のタイトル
        description: 'Test case description',
        category: 'civil',
        status: 'active',
        priority: 'medium',
        clientId: 'client-1',
        lawyerId: 'lawyer-1',
      }

      await expect(caseService.createCase(invalidCaseData))
        .rejects.toThrow('Title is required')
    })

    it('should validate case category', async () => {
      const invalidCaseData = {
        title: 'Test Case',
        description: 'Test case description',
        category: 'invalid_category', // 無効なカテゴリ
        status: 'active',
        priority: 'medium',
        clientId: 'client-1',
        lawyerId: 'lawyer-1',
      }

      await expect(caseService.createCase(invalidCaseData))
        .rejects.toThrow('Invalid case category')
    })

    it('should validate case status', async () => {
      const invalidCaseData = {
        title: 'Test Case',
        description: 'Test case description',
        category: 'civil',
        status: 'invalid_status', // 無効なステータス
        priority: 'medium',
        clientId: 'client-1',
        lawyerId: 'lawyer-1',
      }

      await expect(caseService.createCase(invalidCaseData))
        .rejects.toThrow('Invalid case status')
    })

    it('should validate case priority', async () => {
      const invalidCaseData = {
        title: 'Test Case',
        description: 'Test case description',
        category: 'civil',
        status: 'active',
        priority: 'invalid_priority', // 無効な優先度
        clientId: 'client-1',
        lawyerId: 'lawyer-1',
      }

      await expect(caseService.createCase(invalidCaseData))
        .rejects.toThrow('Invalid case priority')
    })
  })

  describe('getCases', () => {
    it('should return cases with pagination', async () => {
      const page = 1
      const limit = 10

      const mockCases = [
        {
          id: 'case-1',
          title: 'Test Case 1',
          status: 'active',
          category: 'civil',
          createdAt: new Date(),
        },
        {
          id: 'case-2',
          title: 'Test Case 2',
          status: 'completed',
          category: 'criminal',
          createdAt: new Date(),
        },
      ]

      mockPrisma.case.findMany.mockResolvedValue(mockCases)
      mockPrisma.case.count.mockResolvedValue(2)

      const result = await caseService.getCases(page, limit)

      expect(result.data).toEqual(mockCases)
      expect(result.pagination.page).toBe(page)
      expect(result.pagination.limit).toBe(limit)
      expect(result.pagination.total).toBe(2)
    })

    it('should filter by status when specified', async () => {
      const status = 'active'

      mockPrisma.case.findMany.mockResolvedValue([])
      mockPrisma.case.count.mockResolvedValue(0)

      await caseService.getCases(1, 10, { status })

      expect(mockPrisma.case.findMany).toHaveBeenCalledWith({
        where: { status },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      })
    })

    it('should filter by category when specified', async () => {
      const category = 'civil'

      mockPrisma.case.findMany.mockResolvedValue([])
      mockPrisma.case.count.mockResolvedValue(0)

      await caseService.getCases(1, 10, { category })

      expect(mockPrisma.case.findMany).toHaveBeenCalledWith({
        where: { category },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      })
    })

    it('should search by title when search term provided', async () => {
      const search = 'test'

      mockPrisma.case.findMany.mockResolvedValue([])
      mockPrisma.case.count.mockResolvedValue(0)

      await caseService.getCases(1, 10, { search })

      expect(mockPrisma.case.findMany).toHaveBeenCalledWith({
        where: {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      })
    })
  })

  describe('getCaseById', () => {
    it('should return case by id', async () => {
      const caseId = 'case-1'
      const expectedCase = {
        id: caseId,
        title: 'Test Case',
        description: 'Test case description',
        status: 'active',
        category: 'civil',
        createdAt: new Date(),
      }

      mockPrisma.case.findUnique.mockResolvedValue(expectedCase)

      const result = await caseService.getCaseById(caseId)

      expect(result).toEqual(expectedCase)
      expect(mockPrisma.case.findUnique).toHaveBeenCalledWith({
        where: { id: caseId },
      })
    })

    it('should throw error when case not found', async () => {
      const caseId = 'non-existent-case'

      mockPrisma.case.findUnique.mockResolvedValue(null)

      await expect(caseService.getCaseById(caseId))
        .rejects.toThrow('Case not found')
    })
  })

  describe('updateCase', () => {
    it('should update case successfully', async () => {
      const caseId = 'case-1'
      const updateData = {
        title: 'Updated Case Title',
        status: 'completed',
      }

      const updatedCase = {
        id: caseId,
        ...updateData,
        updatedAt: new Date(),
      }

      mockPrisma.case.update.mockResolvedValue(updatedCase)

      const result = await caseService.updateCase(caseId, updateData)

      expect(result).toEqual(updatedCase)
      expect(mockPrisma.case.update).toHaveBeenCalledWith({
        where: { id: caseId },
        data: updateData,
      })
    })

    it('should throw error when case not found', async () => {
      const caseId = 'non-existent-case'
      const updateData = { title: 'Updated Title' }

      mockPrisma.case.update.mockResolvedValue(null)

      await expect(caseService.updateCase(caseId, updateData))
        .rejects.toThrow('Case not found')
    })
  })

  describe('deleteCase', () => {
    it('should delete case successfully', async () => {
      const caseId = 'case-1'

      const deletedCase = {
        id: caseId,
        title: 'Test Case',
      }

      mockPrisma.case.delete.mockResolvedValue(deletedCase)

      const result = await caseService.deleteCase(caseId)

      expect(result).toEqual(deletedCase)
      expect(mockPrisma.case.delete).toHaveBeenCalledWith({
        where: { id: caseId },
      })
    })

    it('should throw error when case not found', async () => {
      const caseId = 'non-existent-case'

      mockPrisma.case.delete.mockResolvedValue(null)

      await expect(caseService.deleteCase(caseId))
        .rejects.toThrow('Case not found')
    })
  })

  describe('getCaseDetails', () => {
    it('should return case with related data', async () => {
      const caseId = 'case-1'
      const expectedCase = {
        id: caseId,
        title: 'Test Case',
        description: 'Test case description',
        status: 'active',
        category: 'civil',
        parties: [
          { id: 'party-1', name: 'Client 1', type: 'individual' },
        ],
        documents: [
          { id: 'doc-1', title: 'Document 1', type: 'contract' },
        ],
        timesheets: [
          { id: 'timesheet-1', description: 'Work 1', billableHours: 2.0 },
        ],
      }

      mockPrisma.case.findUnique.mockResolvedValue({
        id: caseId,
        title: 'Test Case',
        description: 'Test case description',
        status: 'active',
        category: 'civil',
      })
      mockPrisma.party.findMany.mockResolvedValue(expectedCase.parties)
      mockPrisma.document.findMany.mockResolvedValue(expectedCase.documents)
      mockPrisma.timesheet.findMany.mockResolvedValue(expectedCase.timesheets)

      const result = await caseService.getCaseDetails(caseId)

      expect(result.id).toBe(caseId)
      expect(result.parties).toEqual(expectedCase.parties)
      expect(result.documents).toEqual(expectedCase.documents)
      expect(result.timesheets).toEqual(expectedCase.timesheets)
    })
  })

  describe('updateCaseStatus', () => {
    it('should update case status successfully', async () => {
      const caseId = 'case-1'
      const newStatus = 'completed'

      const updatedCase = {
        id: caseId,
        status: newStatus,
        updatedAt: new Date(),
      }

      mockPrisma.case.update.mockResolvedValue(updatedCase)

      const result = await caseService.updateCaseStatus(caseId, newStatus)

      expect(result).toEqual(updatedCase)
      expect(mockPrisma.case.update).toHaveBeenCalledWith({
        where: { id: caseId },
        data: { status: newStatus },
      })
    })

    it('should validate case status', async () => {
      const caseId = 'case-1'
      const invalidStatus = 'invalid_status'

      await expect(caseService.updateCaseStatus(caseId, invalidStatus))
        .rejects.toThrow('Invalid case status')
    })
  })

  describe('getCaseStatistics', () => {
    it('should return case statistics', async () => {
      const mockStats = {
        totalCases: 100,
        activeCases: 50,
        completedCases: 30,
        pendingCases: 20,
        casesByCategory: {
          civil: 40,
          criminal: 30,
          family: 20,
          corporate: 10,
        },
        casesByStatus: {
          active: 50,
          completed: 30,
          pending: 20,
        },
      }

      mockPrisma.case.count.mockResolvedValue(100)
      mockPrisma.case.aggregate.mockResolvedValue({
        _count: {
          id: 100,
        },
      })

      // カテゴリ別の集計をモック
      mockPrisma.case.findMany.mockResolvedValue([
        { category: 'civil' },
        { category: 'criminal' },
        { category: 'family' },
        { category: 'corporate' },
      ])

      const result = await caseService.getCaseStatistics()

      expect(result.totalCases).toBe(100)
    })
  })

  describe('validateCaseData', () => {
    it('should validate case data successfully', () => {
      const validData = {
        title: 'Valid Case Title',
        description: 'Valid description',
        category: 'civil',
        status: 'active',
        priority: 'medium',
      }

      expect(() => caseService.validateCaseData(validData)).not.toThrow()
    })

    it('should throw error for empty title', () => {
      const invalidData = {
        title: '',
        description: 'Valid description',
        category: 'civil',
        status: 'active',
        priority: 'medium',
      }

      expect(() => caseService.validateCaseData(invalidData))
        .toThrow('Title is required')
    })

    it('should throw error for invalid category', () => {
      const invalidData = {
        title: 'Valid Case Title',
        description: 'Valid description',
        category: 'invalid_category',
        status: 'active',
        priority: 'medium',
      }

      expect(() => caseService.validateCaseData(invalidData))
        .toThrow('Invalid case category')
    })
  })
})
