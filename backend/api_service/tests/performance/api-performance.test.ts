import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import { createApp } from '../../src/index'
import { PrismaClient } from '@prisma/client'

const app = createApp()
const prisma = new PrismaClient()

// パフォーマンステスト用のデータ
const testData = {
  users: [],
  cases: [],
  parties: [],
  documents: [],
  timesheets: [],
}

describe('API Performance Tests', () => {
  beforeAll(async () => {
    // テストデータの準備
    await setupTestData()
  })

  afterAll(async () => {
    // テストデータのクリーンアップ
    await cleanupTestData()
    await prisma.$disconnect()
  })

  describe('Authentication Performance', () => {
    it('should handle login requests within acceptable time', async () => {
      const startTime = Date.now()

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })

      const endTime = Date.now()
      const responseTime = endTime - startTime

      // ログインは500ms以内に完了することを期待
      expect(responseTime).toBeLessThan(500)
      expect(response.status).toBe(200)
    })

    it('should handle registration requests within acceptable time', async () => {
      const startTime = Date.now()

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: `test${Date.now()}@example.com`,
          password: 'password123',
          role: 'lawyer',
        })

      const endTime = Date.now()
      const responseTime = endTime - startTime

      // 登録は1秒以内に完了することを期待
      expect(responseTime).toBeLessThan(1000)
      expect(response.status).toBe(201)
    })
  })

  describe('Case Management Performance', () => {
    it('should handle case listing with pagination efficiently', async () => {
      const startTime = Date.now()

      const response = await request(app)
        .get('/api/cases?page=1&limit=20')
        .set('Authorization', 'Bearer valid-token')

      const endTime = Date.now()
      const responseTime = endTime - startTime

      // ケース一覧は300ms以内に完了することを期待
      expect(responseTime).toBeLessThan(300)
      expect(response.status).toBe(200)
    })

    it('should handle case creation efficiently', async () => {
      const startTime = Date.now()

      const response = await request(app)
        .post('/api/cases')
        .set('Authorization', 'Bearer valid-token')
        .send({
          title: 'Performance Test Case',
          description: 'Test case for performance testing',
          category: 'civil',
          status: 'active',
          priority: 'medium',
        })

      const endTime = Date.now()
      const responseTime = endTime - startTime

      // ケース作成は500ms以内に完了することを期待
      expect(responseTime).toBeLessThan(500)
      expect(response.status).toBe(201)
    })

    it('should handle case search efficiently', async () => {
      const startTime = Date.now()

      const response = await request(app)
        .get('/api/cases?search=test&page=1&limit=10')
        .set('Authorization', 'Bearer valid-token')

      const endTime = Date.now()
      const responseTime = endTime - startTime

      // 検索は400ms以内に完了することを期待
      expect(responseTime).toBeLessThan(400)
      expect(response.status).toBe(200)
    })
  })

  describe('Document Management Performance', () => {
    it('should handle document listing efficiently', async () => {
      const startTime = Date.now()

      const response = await request(app)
        .get('/api/documents?page=1&limit=20')
        .set('Authorization', 'Bearer valid-token')

      const endTime = Date.now()
      const responseTime = endTime - startTime

      // ドキュメント一覧は300ms以内に完了することを期待
      expect(responseTime).toBeLessThan(300)
      expect(response.status).toBe(200)
    })

    it('should handle document upload efficiently', async () => {
      const startTime = Date.now()

      const response = await request(app)
        .post('/api/documents/upload')
        .set('Authorization', 'Bearer valid-token')
        .attach('file', Buffer.from('test file content'), 'test.txt')
        .field('title', 'Performance Test Document')
        .field('type', 'contract')
        .field('caseId', 'test-case-id')

      const endTime = Date.now()
      const responseTime = endTime - startTime

      // ドキュメントアップロードは2秒以内に完了することを期待
      expect(responseTime).toBeLessThan(2000)
      expect(response.status).toBe(201)
    })
  })

  describe('Timesheet Performance', () => {
    it('should handle timesheet listing efficiently', async () => {
      const startTime = Date.now()

      const response = await request(app)
        .get('/api/timesheets?page=1&limit=20')
        .set('Authorization', 'Bearer valid-token')

      const endTime = Date.now()
      const responseTime = endTime - startTime

      // タイムシート一覧は300ms以内に完了することを期待
      expect(responseTime).toBeLessThan(300)
      expect(response.status).toBe(200)
    })

    it('should handle timesheet creation efficiently', async () => {
      const startTime = Date.now()

      const response = await request(app)
        .post('/api/timesheets')
        .set('Authorization', 'Bearer valid-token')
        .send({
          caseId: 'test-case-id',
          description: 'Performance test work',
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 3600000).toISOString(),
          billableHours: 1.0,
          hourlyRate: 10000,
        })

      const endTime = Date.now()
      const responseTime = endTime - startTime

      // タイムシート作成は400ms以内に完了することを期待
      expect(responseTime).toBeLessThan(400)
      expect(response.status).toBe(201)
    })
  })

  describe('Dashboard Performance', () => {
    it('should handle dashboard data loading efficiently', async () => {
      const startTime = Date.now()

      const response = await request(app)
        .get('/api/dashboard')
        .set('Authorization', 'Bearer valid-token')

      const endTime = Date.now()
      const responseTime = endTime - startTime

      // ダッシュボードデータは1秒以内に完了することを期待
      expect(responseTime).toBeLessThan(1000)
      expect(response.status).toBe(200)
    })
  })

  describe('Concurrent Request Performance', () => {
    it('should handle multiple concurrent requests efficiently', async () => {
      const concurrentRequests = 10
      const startTime = Date.now()

      const promises = Array.from({ length: concurrentRequests }, () =>
        request(app)
          .get('/api/cases?page=1&limit=10')
          .set('Authorization', 'Bearer valid-token')
      )

      const responses = await Promise.all(promises)
      const endTime = Date.now()
      const totalTime = endTime - startTime

      // 10個の同時リクエストが2秒以内に完了することを期待
      expect(totalTime).toBeLessThan(2000)

      // すべてのリクエストが成功することを期待
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })

    it('should handle mixed concurrent requests efficiently', async () => {
      const startTime = Date.now()

      const promises = [
        request(app).get('/api/cases?page=1&limit=10').set('Authorization', 'Bearer valid-token'),
        request(app).get('/api/parties?page=1&limit=10').set('Authorization', 'Bearer valid-token'),
        request(app).get('/api/documents?page=1&limit=10').set('Authorization', 'Bearer valid-token'),
        request(app).get('/api/timesheets?page=1&limit=10').set('Authorization', 'Bearer valid-token'),
        request(app).get('/api/dashboard').set('Authorization', 'Bearer valid-token'),
      ]

      const responses = await Promise.all(promises)
      const endTime = Date.now()
      const totalTime = endTime - startTime

      // 混合リクエストが1.5秒以内に完了することを期待
      expect(totalTime).toBeLessThan(1500)

      // すべてのリクエストが成功することを期待
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })
  })

  describe('Memory Usage Performance', () => {
    it('should not exceed memory limits during heavy operations', async () => {
      const initialMemory = process.memoryUsage()

      // 大量のデータを処理するリクエスト
      const promises = Array.from({ length: 50 }, () =>
        request(app)
          .get('/api/cases?page=1&limit=100')
          .set('Authorization', 'Bearer valid-token')
      )

      await Promise.all(promises)

      const finalMemory = process.memoryUsage()
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed

      // メモリ使用量の増加が50MB以内であることを期待
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
    })
  })

  describe('Database Query Performance', () => {
    it('should execute complex queries efficiently', async () => {
      const startTime = Date.now()

      // 複雑なクエリを含むリクエスト
      const response = await request(app)
        .get('/api/cases?search=complex&status=active&category=civil&page=1&limit=50')
        .set('Authorization', 'Bearer valid-token')

      const endTime = Date.now()
      const responseTime = endTime - startTime

      // 複雑なクエリが800ms以内に完了することを期待
      expect(responseTime).toBeLessThan(800)
      expect(response.status).toBe(200)
    })
  })
})

// テストデータの準備
async function setupTestData() {
  // ユーザーデータの作成
  for (let i = 0; i < 100; i++) {
    const user = await prisma.user.create({
      data: {
        name: `Test User ${i}`,
        email: `test${i}@example.com`,
        password: 'hashedpassword',
        role: 'lawyer',
      },
    })
    testData.users.push(user)
  }

  // ケースデータの作成
  for (let i = 0; i < 200; i++) {
    const case_ = await prisma.case.create({
      data: {
        title: `Test Case ${i}`,
        description: `Test case description ${i}`,
        category: ['civil', 'criminal', 'family', 'corporate'][i % 4],
        status: ['active', 'completed', 'pending'][i % 3],
        priority: ['low', 'medium', 'high'][i % 3],
        clientId: testData.users[i % testData.users.length].id,
        lawyerId: testData.users[i % testData.users.length].id,
        caseNumber: `CASE-${i.toString().padStart(3, '0')}`,
      },
    })
    testData.cases.push(case_)
  }

  // 当事者データの作成
  for (let i = 0; i < 300; i++) {
    const party = await prisma.party.create({
      data: {
        name: `Test Party ${i}`,
        type: ['individual', 'corporate'][i % 2],
        email: `party${i}@example.com`,
        phone: `090-${i.toString().padStart(8, '0')}`,
        caseId: testData.cases[i % testData.cases.length].id,
      },
    })
    testData.parties.push(party)
  }
}

// テストデータのクリーンアップ
async function cleanupTestData() {
  await prisma.timesheet.deleteMany({
    where: {
      description: {
        contains: 'Performance Test',
      },
    },
  })

  await prisma.document.deleteMany({
    where: {
      title: {
        contains: 'Performance Test',
      },
    },
  })

  await prisma.party.deleteMany({
    where: {
      name: {
        contains: 'Test Party',
      },
    },
  })

  await prisma.case.deleteMany({
    where: {
      title: {
        contains: 'Test Case',
      },
    },
  })

  await prisma.user.deleteMany({
    where: {
      name: {
        contains: 'Test User',
      },
    },
  })
}
