import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { TimesheetService } from '../../../src/services/timesheet'
import { PrismaClient } from '@prisma/client'

// Prismaクライアントのモック
const mockPrisma = {
  timesheet: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    aggregate: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  case: {
    findUnique: jest.fn(),
  },
} as any

// タイムシートサービスインスタンス
const timesheetService = new TimesheetService(mockPrisma)

describe('TimesheetService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createTimesheetEntry', () => {
    it('should create a timesheet entry successfully', async () => {
      const timesheetData = {
        userId: 'user-1',
        caseId: 'case-1',
        description: 'Document review',
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T10:00:00Z'),
        billableHours: 1.0,
        hourlyRate: 10000,
      }

      const expectedTimesheet = {
        id: 'timesheet-1',
        ...timesheetData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockPrisma.timesheet.create.mockResolvedValue(expectedTimesheet)

      const result = await timesheetService.createTimesheetEntry(timesheetData)

      expect(result).toEqual(expectedTimesheet)
      expect(mockPrisma.timesheet.create).toHaveBeenCalledWith({
        data: timesheetData,
      })
    })

    it('should throw error when user does not exist', async () => {
      const timesheetData = {
        userId: 'non-existent-user',
        caseId: 'case-1',
        description: 'Document review',
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T10:00:00Z'),
        billableHours: 1.0,
        hourlyRate: 10000,
      }

      mockPrisma.user.findUnique.mockResolvedValue(null)

      await expect(timesheetService.createTimesheetEntry(timesheetData))
        .rejects.toThrow('User not found')
    })

    it('should throw error when case does not exist', async () => {
      const timesheetData = {
        userId: 'user-1',
        caseId: 'non-existent-case',
        description: 'Document review',
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T10:00:00Z'),
        billableHours: 1.0,
        hourlyRate: 10000,
      }

      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' })
      mockPrisma.case.findUnique.mockResolvedValue(null)

      await expect(timesheetService.createTimesheetEntry(timesheetData))
        .rejects.toThrow('Case not found')
    })

    it('should validate that end time is after start time', async () => {
      const timesheetData = {
        userId: 'user-1',
        caseId: 'case-1',
        description: 'Document review',
        startTime: new Date('2024-01-01T10:00:00Z'),
        endTime: new Date('2024-01-01T09:00:00Z'), // 終了時間が開始時間より前
        billableHours: 1.0,
        hourlyRate: 10000,
      }

      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' })
      mockPrisma.case.findUnique.mockResolvedValue({ id: 'case-1' })

      await expect(timesheetService.createTimesheetEntry(timesheetData))
        .rejects.toThrow('End time must be after start time')
    })
  })

  describe('getUserTimesheets', () => {
    it('should return user timesheets with pagination', async () => {
      const userId = 'user-1'
      const page = 1
      const limit = 10

      const mockTimesheets = [
        {
          id: 'timesheet-1',
          userId,
          caseId: 'case-1',
          description: 'Document review',
          startTime: new Date('2024-01-01T09:00:00Z'),
          endTime: new Date('2024-01-01T10:00:00Z'),
          billableHours: 1.0,
          hourlyRate: 10000,
          createdAt: new Date(),
        },
      ]

      mockPrisma.timesheet.findMany.mockResolvedValue(mockTimesheets)

      const result = await timesheetService.getUserTimesheets(userId, page, limit)

      expect(result.data).toEqual(mockTimesheets)
      expect(result.pagination.page).toBe(page)
      expect(result.pagination.limit).toBe(limit)
      expect(mockPrisma.timesheet.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      })
    })

    it('should filter by case when specified', async () => {
      const userId = 'user-1'
      const caseId = 'case-1'

      mockPrisma.timesheet.findMany.mockResolvedValue([])

      await timesheetService.getUserTimesheets(userId, 1, 10, caseId)

      expect(mockPrisma.timesheet.findMany).toHaveBeenCalledWith({
        where: { userId, caseId },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      })
    })

    it('should filter by date range when specified', async () => {
      const userId = 'user-1'
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      mockPrisma.timesheet.findMany.mockResolvedValue([])

      await timesheetService.getUserTimesheets(userId, 1, 10, undefined, startDate, endDate)

      expect(mockPrisma.timesheet.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          startTime: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      })
    })
  })

  describe('updateTimesheetEntry', () => {
    it('should update timesheet entry successfully', async () => {
      const timesheetId = 'timesheet-1'
      const userId = 'user-1'
      const updateData = {
        description: 'Updated description',
        billableHours: 2.0,
      }

      const updatedTimesheet = {
        id: timesheetId,
        userId,
        ...updateData,
        updatedAt: new Date(),
      }

      mockPrisma.timesheet.update.mockResolvedValue(updatedTimesheet)

      const result = await timesheetService.updateTimesheetEntry(timesheetId, userId, updateData)

      expect(result).toEqual(updatedTimesheet)
      expect(mockPrisma.timesheet.update).toHaveBeenCalledWith({
        where: { id: timesheetId, userId },
        data: updateData,
      })
    })

    it('should throw error when timesheet not found', async () => {
      const timesheetId = 'non-existent-timesheet'
      const userId = 'user-1'
      const updateData = { description: 'Updated description' }

      mockPrisma.timesheet.update.mockResolvedValue(null)

      await expect(timesheetService.updateTimesheetEntry(timesheetId, userId, updateData))
        .rejects.toThrow('Timesheet entry not found')
    })
  })

  describe('deleteTimesheetEntry', () => {
    it('should delete timesheet entry successfully', async () => {
      const timesheetId = 'timesheet-1'
      const userId = 'user-1'

      const deletedTimesheet = {
        id: timesheetId,
        userId,
        description: 'Test timesheet',
      }

      mockPrisma.timesheet.delete.mockResolvedValue(deletedTimesheet)

      const result = await timesheetService.deleteTimesheetEntry(timesheetId, userId)

      expect(result).toEqual(deletedTimesheet)
      expect(mockPrisma.timesheet.delete).toHaveBeenCalledWith({
        where: { id: timesheetId, userId },
      })
    })

    it('should throw error when timesheet not found', async () => {
      const timesheetId = 'non-existent-timesheet'
      const userId = 'user-1'

      mockPrisma.timesheet.delete.mockResolvedValue(null)

      await expect(timesheetService.deleteTimesheetEntry(timesheetId, userId))
        .rejects.toThrow('Timesheet entry not found')
    })
  })

  describe('getTimesheetStats', () => {
    it('should return timesheet statistics', async () => {
      const userId = 'user-1'
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      const mockStats = {
        totalHours: 40.0,
        billableHours: 35.0,
        nonBillableHours: 5.0,
        totalRevenue: 350000,
        averageDailyHours: 1.29,
      }

      mockPrisma.timesheet.aggregate.mockResolvedValue({
        _sum: {
          billableHours: 35.0,
          nonBillableHours: 5.0,
        },
        _count: {
          id: 30,
        },
      })

      // モックの設定を追加
      mockPrisma.timesheet.findMany.mockResolvedValue([
        { caseId: 'case-1', billableHours: 20.0 },
        { caseId: 'case-2', billableHours: 15.0 },
      ])

      const result = await timesheetService.getTimesheetStats(userId, startDate, endDate)

      expect(result.totalHours).toBe(40.0)
      expect(result.billableHours).toBe(35.0)
      expect(result.nonBillableHours).toBe(5.0)
      expect(result.totalRevenue).toBe(350000)
    })
  })

  describe('getCaseTimesheets', () => {
    it('should return timesheets for a specific case', async () => {
      const caseId = 'case-1'
      const page = 1
      const limit = 10

      const mockTimesheets = [
        {
          id: 'timesheet-1',
          userId: 'user-1',
          caseId,
          description: 'Case work',
          startTime: new Date('2024-01-01T09:00:00Z'),
          endTime: new Date('2024-01-01T10:00:00Z'),
          billableHours: 1.0,
          hourlyRate: 10000,
          createdAt: new Date(),
        },
      ]

      mockPrisma.timesheet.findMany.mockResolvedValue(mockTimesheets)

      const result = await timesheetService.getCaseTimesheets(caseId, page, limit)

      expect(result.data).toEqual(mockTimesheets)
      expect(mockPrisma.timesheet.findMany).toHaveBeenCalledWith({
        where: { caseId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      })
    })
  })

  describe('calculateBillableAmount', () => {
    it('should calculate billable amount correctly', () => {
      const billableHours = 2.5
      const hourlyRate = 10000

      const result = timesheetService.calculateBillableAmount(billableHours, hourlyRate)

      expect(result).toBe(25000)
    })

    it('should handle zero hours', () => {
      const billableHours = 0
      const hourlyRate = 10000

      const result = timesheetService.calculateBillableAmount(billableHours, hourlyRate)

      expect(result).toBe(0)
    })

    it('should handle zero hourly rate', () => {
      const billableHours = 2.5
      const hourlyRate = 0

      const result = timesheetService.calculateBillableAmount(billableHours, hourlyRate)

      expect(result).toBe(0)
    })
  })

  describe('validateTimesheetData', () => {
    it('should validate timesheet data successfully', () => {
      const validData = {
        userId: 'user-1',
        caseId: 'case-1',
        description: 'Valid description',
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T10:00:00Z'),
        billableHours: 1.0,
        hourlyRate: 10000,
      }

      expect(() => timesheetService.validateTimesheetData(validData)).not.toThrow()
    })

    it('should throw error for invalid description', () => {
      const invalidData = {
        userId: 'user-1',
        caseId: 'case-1',
        description: '', // 空の説明
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T10:00:00Z'),
        billableHours: 1.0,
        hourlyRate: 10000,
      }

      expect(() => timesheetService.validateTimesheetData(invalidData))
        .toThrow('Description is required')
    })

    it('should throw error for negative billable hours', () => {
      const invalidData = {
        userId: 'user-1',
        caseId: 'case-1',
        description: 'Valid description',
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T10:00:00Z'),
        billableHours: -1.0, // 負の時間
        hourlyRate: 10000,
      }

      expect(() => timesheetService.validateTimesheetData(invalidData))
        .toThrow('Billable hours must be positive')
    })

    it('should throw error for negative hourly rate', () => {
      const invalidData = {
        userId: 'user-1',
        caseId: 'case-1',
        description: 'Valid description',
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T10:00:00Z'),
        billableHours: 1.0,
        hourlyRate: -10000, // 負の時給
      }

      expect(() => timesheetService.validateTimesheetData(invalidData))
        .toThrow('Hourly rate must be positive')
    })
  })
})
