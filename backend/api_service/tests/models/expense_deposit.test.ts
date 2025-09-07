import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '../setup';
import { cleanupDatabase } from '../lib/db-test-utils';

describe('Expense and Deposit Model CRUD Operations', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(cleanupDatabase);

  afterEach(cleanupDatabase);

  describe('Create Expense', () => {
    let caseId: string;

    beforeEach(async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: 'テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: 'テスト事件',
          categoryId: category.id,
        },
      });
      caseId = case_.id;
    });

    it('should create a new expense with required fields', async () => {
      const expenseData = {
        caseId: caseId,
        date: new Date('2024-12-15'),
        amount: 50000.0,
        description: '弁護士報酬',
      };

      const expense = await prisma.expense.create({
        data: expenseData,
      });

      expect(expense).toBeDefined();
      expect(expense.id).toBeDefined();
      expect(expense.caseId).toBe(caseId);
      expect(expense.date).toEqual(expenseData.date);
      expect(expense.amount).toBe(expenseData.amount);
      expect(expense.description).toBe(expenseData.description);
    });

    it('should create an expense with different amounts', async () => {
      const amounts = [1000.0, 5000.0, 10000.0, 50000.0, 100000.0];

      for (const amount of amounts) {
        const expense = await prisma.expense.create({
          data: {
            caseId: caseId,
            date: new Date('2024-12-15'),
            amount: amount,
            description: `${amount}円の費用`,
          },
        });

        expect(expense.amount).toBe(amount);
      }
    });

    it('should create multiple expenses for same case', async () => {
      const expenses = [
        { date: '2024-12-01', amount: 10000.0, description: '交通費' },
        { date: '2024-12-02', amount: 5000.0, description: '資料作成費' },
        { date: '2024-12-03', amount: 20000.0, description: '専門家鑑定料' },
      ];

      for (const expenseData of expenses) {
        const expense = await prisma.expense.create({
          data: {
            caseId: caseId,
            date: new Date(expenseData.date),
            amount: expenseData.amount,
            description: expenseData.description,
          },
        });

        expect(expense.description).toBe(expenseData.description);
        expect(expense.amount).toBe(expenseData.amount);
      }
    });

    it('should fail to create expense without case', async () => {
      await expect(
        prisma.expense.create({
          data: {
            caseId: 'non-existent-case-id',
            date: new Date('2024-12-15'),
            amount: 10000.0,
            description: 'テスト費用',
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Read Expense', () => {
    let expenseId: string;

    beforeEach(async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: '読取テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: '読取テスト事件',
          categoryId: category.id,
        },
      });

      const expense = await prisma.expense.create({
        data: {
          caseId: case_.id,
          date: new Date('2024-12-15'),
          amount: 30000.0,
          description: '読取テスト費用',
        },
      });
      expenseId = expense.id;
    });

    it('should find expense by id', async () => {
      const foundExpense = await prisma.expense.findUnique({
        where: { id: expenseId },
      });

      expect(foundExpense).toBeDefined();
      expect(foundExpense?.id).toBe(expenseId);
      expect(foundExpense?.description).toBe('読取テスト費用');
    });

    it('should find expense with case relation', async () => {
      const foundExpense = await prisma.expense.findUnique({
        where: { id: expenseId },
        include: {
          case: true,
        },
      });

      expect(foundExpense?.case).toBeDefined();
      expect(foundExpense?.case.name).toBe('読取テスト事件');
    });

    it('should find all expenses', async () => {
      const expenses = await prisma.expense.findMany();

      expect(expenses).toHaveLength(1);
      expect(expenses[0].description).toBe('読取テスト費用');
    });

    it('should find expenses by case', async () => {
      const expenses = await prisma.expense.findMany({
        where: {
          case: {
            name: '読取テスト事件',
          },
        },
      });

      expect(expenses).toHaveLength(1);
      expect(expenses[0].description).toBe('読取テスト費用');
    });

    it('should find expenses by amount range', async () => {
      const expenses = await prisma.expense.findMany({
        where: {
          amount: {
            gte: 20000.0,
            lte: 50000.0,
          },
        },
      });

      expect(expenses).toHaveLength(1);
      expect(expenses[0].description).toBe('読取テスト費用');
    });

    it('should find expenses by date range', async () => {
      const expenses = await prisma.expense.findMany({
        where: {
          date: {
            gte: new Date('2024-12-01'),
            lte: new Date('2024-12-31'),
          },
        },
      });

      expect(expenses).toHaveLength(1);
      expect(expenses[0].description).toBe('読取テスト費用');
    });

    it('should return null for non-existent expense', async () => {
      const foundExpense = await prisma.expense.findUnique({
        where: { id: 'non-existent-id' },
      });

      expect(foundExpense).toBeNull();
    });
  });

  describe('Update Expense', () => {
    let expenseId: string;

    beforeEach(async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: '更新テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: '更新テスト事件',
          categoryId: category.id,
        },
      });

      const expense = await prisma.expense.create({
        data: {
          caseId: case_.id,
          date: new Date('2024-12-15'),
          amount: 20000.0,
          description: '更新前費用',
        },
      });
      expenseId = expense.id;
    });

    it('should update expense description', async () => {
      const updatedExpense = await prisma.expense.update({
        where: { id: expenseId },
        data: {
          description: '更新後費用',
        },
      });

      expect(updatedExpense.description).toBe('更新後費用');
    });

    it('should update expense amount', async () => {
      const updatedExpense = await prisma.expense.update({
        where: { id: expenseId },
        data: {
          amount: 50000.0,
        },
      });

      expect(updatedExpense.amount).toBe(50000.0);
    });

    it('should update expense date', async () => {
      const newDate = new Date('2024-12-20');
      const updatedExpense = await prisma.expense.update({
        where: { id: expenseId },
        data: {
          date: newDate,
        },
      });

      expect(updatedExpense.date).toEqual(newDate);
    });

    it('should update multiple fields', async () => {
      const updatedExpense = await prisma.expense.update({
        where: { id: expenseId },
        data: {
          date: new Date('2024-12-25'),
          amount: 75000.0,
          description: '複数更新費用',
        },
      });

      expect(updatedExpense.date).toEqual(new Date('2024-12-25'));
      expect(updatedExpense.amount).toBe(75000.0);
      expect(updatedExpense.description).toBe('複数更新費用');
    });

    it('should fail to update non-existent expense', async () => {
      await expect(
        prisma.expense.update({
          where: { id: 'non-existent-id' },
          data: { description: '更新' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Delete Expense', () => {
    let expenseId: string;

    beforeEach(async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: '削除テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: '削除テスト事件',
          categoryId: category.id,
        },
      });

      const expense = await prisma.expense.create({
        data: {
          caseId: case_.id,
          date: new Date('2024-12-15'),
          amount: 15000.0,
          description: '削除テスト費用',
        },
      });
      expenseId = expense.id;
    });

    it('should delete expense by id', async () => {
      const deletedExpense = await prisma.expense.delete({
        where: { id: expenseId },
      });

      expect(deletedExpense.id).toBe(expenseId);
      expect(deletedExpense.description).toBe('削除テスト費用');

      const foundExpense = await prisma.expense.findUnique({
        where: { id: expenseId },
      });
      expect(foundExpense).toBeNull();
    });

    it('should fail to delete non-existent expense', async () => {
      await expect(
        prisma.expense.delete({
          where: { id: 'non-existent-id' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Create Deposit', () => {
    let caseId: string;

    beforeEach(async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: 'テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: 'テスト事件',
          categoryId: category.id,
        },
      });
      caseId = case_.id;
    });

    it('should create a new deposit with required fields', async () => {
      const depositData = {
        caseId: caseId,
        date: new Date('2024-12-15'),
        amount: 100000.0,
        description: '預かり金',
      };

      const deposit = await prisma.deposit.create({
        data: depositData,
      });

      expect(deposit).toBeDefined();
      expect(deposit.id).toBeDefined();
      expect(deposit.caseId).toBe(caseId);
      expect(deposit.date).toEqual(depositData.date);
      expect(deposit.amount).toBe(depositData.amount);
      expect(deposit.description).toBe(depositData.description);
    });

    it('should create a deposit with different amounts', async () => {
      const amounts = [5000.0, 10000.0, 50000.0, 100000.0, 500000.0];

      for (const amount of amounts) {
        const deposit = await prisma.deposit.create({
          data: {
            caseId: caseId,
            date: new Date('2024-12-15'),
            amount: amount,
            description: `${amount}円の預かり金`,
          },
        });

        expect(deposit.amount).toBe(amount);
      }
    });

    it('should create multiple deposits for same case', async () => {
      const deposits = [
        { date: '2024-12-01', amount: 50000.0, description: '初期預かり金' },
        { date: '2024-12-02', amount: 25000.0, description: '追加預かり金' },
        { date: '2024-12-03', amount: 10000.0, description: '最終預かり金' },
      ];

      for (const depositData of deposits) {
        const deposit = await prisma.deposit.create({
          data: {
            caseId: caseId,
            date: new Date(depositData.date),
            amount: depositData.amount,
            description: depositData.description,
          },
        });

        expect(deposit.description).toBe(depositData.description);
        expect(deposit.amount).toBe(depositData.amount);
      }
    });

    it('should fail to create deposit without case', async () => {
      await expect(
        prisma.deposit.create({
          data: {
            caseId: 'non-existent-case-id',
            date: new Date('2024-12-15'),
            amount: 50000.0,
            description: 'テスト預かり金',
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Read Deposit', () => {
    let depositId: string;

    beforeEach(async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: '読取テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: '読取テスト事件',
          categoryId: category.id,
        },
      });

      const deposit = await prisma.deposit.create({
        data: {
          caseId: case_.id,
          date: new Date('2024-12-15'),
          amount: 200000.0,
          description: '読取テスト預かり金',
        },
      });
      depositId = deposit.id;
    });

    it('should find deposit by id', async () => {
      const foundDeposit = await prisma.deposit.findUnique({
        where: { id: depositId },
      });

      expect(foundDeposit).toBeDefined();
      expect(foundDeposit?.id).toBe(depositId);
      expect(foundDeposit?.description).toBe('読取テスト預かり金');
    });

    it('should find deposit with case relation', async () => {
      const foundDeposit = await prisma.deposit.findUnique({
        where: { id: depositId },
        include: {
          case: true,
        },
      });

      expect(foundDeposit?.case).toBeDefined();
      expect(foundDeposit?.case.name).toBe('読取テスト事件');
    });

    it('should find all deposits', async () => {
      const deposits = await prisma.deposit.findMany();

      expect(deposits).toHaveLength(1);
      expect(deposits[0].description).toBe('読取テスト預かり金');
    });

    it('should find deposits by case', async () => {
      const deposits = await prisma.deposit.findMany({
        where: {
          case: {
            name: '読取テスト事件',
          },
        },
      });

      expect(deposits).toHaveLength(1);
      expect(deposits[0].description).toBe('読取テスト預かり金');
    });

    it('should find deposits by amount range', async () => {
      const deposits = await prisma.deposit.findMany({
        where: {
          amount: {
            gte: 100000.0,
            lte: 500000.0,
          },
        },
      });

      expect(deposits).toHaveLength(1);
      expect(deposits[0].description).toBe('読取テスト預かり金');
    });

    it('should find deposits by date range', async () => {
      const deposits = await prisma.deposit.findMany({
        where: {
          date: {
            gte: new Date('2024-12-01'),
            lte: new Date('2024-12-31'),
          },
        },
      });

      expect(deposits).toHaveLength(1);
      expect(deposits[0].description).toBe('読取テスト預かり金');
    });

    it('should return null for non-existent deposit', async () => {
      const foundDeposit = await prisma.deposit.findUnique({
        where: { id: 'non-existent-id' },
      });

      expect(foundDeposit).toBeNull();
    });
  });

  describe('Update Deposit', () => {
    let depositId: string;

    beforeEach(async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: '更新テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: '更新テスト事件',
          categoryId: category.id,
        },
      });

      const deposit = await prisma.deposit.create({
        data: {
          caseId: case_.id,
          date: new Date('2024-12-15'),
          amount: 150000.0,
          description: '更新前預かり金',
        },
      });
      depositId = deposit.id;
    });

    it('should update deposit description', async () => {
      const updatedDeposit = await prisma.deposit.update({
        where: { id: depositId },
        data: {
          description: '更新後預かり金',
        },
      });

      expect(updatedDeposit.description).toBe('更新後預かり金');
    });

    it('should update deposit amount', async () => {
      const updatedDeposit = await prisma.deposit.update({
        where: { id: depositId },
        data: {
          amount: 300000.0,
        },
      });

      expect(updatedDeposit.amount).toBe(300000.0);
    });

    it('should update deposit date', async () => {
      const newDate = new Date('2024-12-20');
      const updatedDeposit = await prisma.deposit.update({
        where: { id: depositId },
        data: {
          date: newDate,
        },
      });

      expect(updatedDeposit.date).toEqual(newDate);
    });

    it('should update multiple fields', async () => {
      const updatedDeposit = await prisma.deposit.update({
        where: { id: depositId },
        data: {
          date: new Date('2024-12-25'),
          amount: 400000.0,
          description: '複数更新預かり金',
        },
      });

      expect(updatedDeposit.date).toEqual(new Date('2024-12-25'));
      expect(updatedDeposit.amount).toBe(400000.0);
      expect(updatedDeposit.description).toBe('複数更新預かり金');
    });

    it('should fail to update non-existent deposit', async () => {
      await expect(
        prisma.deposit.update({
          where: { id: 'non-existent-id' },
          data: { description: '更新' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Delete Deposit', () => {
    let depositId: string;

    beforeEach(async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: '削除テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: '削除テスト事件',
          categoryId: category.id,
        },
      });

      const deposit = await prisma.deposit.create({
        data: {
          caseId: case_.id,
          date: new Date('2024-12-15'),
          amount: 80000.0,
          description: '削除テスト預かり金',
        },
      });
      depositId = deposit.id;
    });

    it('should delete deposit by id', async () => {
      const deletedDeposit = await prisma.deposit.delete({
        where: { id: depositId },
      });

      expect(deletedDeposit.id).toBe(depositId);
      expect(deletedDeposit.description).toBe('削除テスト預かり金');

      const foundDeposit = await prisma.deposit.findUnique({
        where: { id: depositId },
      });
      expect(foundDeposit).toBeNull();
    });

    it('should fail to delete non-existent deposit', async () => {
      await expect(
        prisma.deposit.delete({
          where: { id: 'non-existent-id' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Expense and Deposit Relations', () => {
    it('should find case with expenses and deposits', async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: '関係テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: '関係テスト事件',
          categoryId: category.id,
        },
      });

      await prisma.expense.createMany({
        data: [
          {
            caseId: case_.id,
            date: new Date('2024-12-01'),
            amount: 10000.0,
            description: '費用1',
          },
          {
            caseId: case_.id,
            date: new Date('2024-12-02'),
            amount: 20000.0,
            description: '費用2',
          },
        ],
      });

      await prisma.deposit.createMany({
        data: [
          {
            caseId: case_.id,
            date: new Date('2024-12-01'),
            amount: 50000.0,
            description: '預かり金1',
          },
          {
            caseId: case_.id,
            date: new Date('2024-12-02'),
            amount: 100000.0,
            description: '預かり金2',
          },
        ],
      });

      const caseWithFinancials = await prisma.case.findUnique({
        where: { id: case_.id },
        include: {
          expenses: true,
          deposits: true,
        },
      });

      expect(caseWithFinancials?.expenses).toHaveLength(2);
      expect(caseWithFinancials?.deposits).toHaveLength(2);
      expect(caseWithFinancials?.expenses[0].description).toBe('費用1');
      expect(caseWithFinancials?.expenses[1].description).toBe('費用2');
      expect(caseWithFinancials?.deposits[0].description).toBe('預かり金1');
      expect(caseWithFinancials?.deposits[1].description).toBe('預かり金2');
    });
  });
});
