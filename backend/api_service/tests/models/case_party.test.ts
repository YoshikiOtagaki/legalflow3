import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '../setup';
import { cleanupDatabase } from '../lib/db-test-utils';

describe('CaseParty Model CRUD Operations', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(cleanupDatabase);

  afterEach(cleanupDatabase);

  describe('Create CaseParty', () => {
    let caseId: string;
    let partyId: string;

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

      const party = await prisma.party.create({
        data: {
          isCorporation: false,
          isFormerClient: false,
        },
      });
      partyId = party.id;
    });

    it('should create a new case party with required fields', async () => {
      const casePartyData = {
        caseId: caseId,
        partyId: partyId,
        role: 'plaintiff',
      };

      const caseParty = await prisma.caseParty.create({
        data: casePartyData,
      });

      expect(caseParty).toBeDefined();
      expect(caseParty.caseId).toBe(caseId);
      expect(caseParty.partyId).toBe(partyId);
      expect(caseParty.role).toBe(casePartyData.role);
    });

    it('should create a case party with different roles', async () => {
      const roles = ['plaintiff', 'defendant', 'our_insurance', 'third_party'];

      for (const role of roles) {
        const caseParty = await prisma.caseParty.create({
          data: {
            caseId: caseId,
            partyId: partyId,
            role: role,
          },
        });

        expect(caseParty.role).toBe(role);
      }
    });

    it('should create multiple parties for same case', async () => {
      const party2 = await prisma.party.create({
        data: {
          isCorporation: true,
          isFormerClient: false,
        },
      });

      const caseParty1 = await prisma.caseParty.create({
        data: {
          caseId: caseId,
          partyId: partyId,
          role: 'plaintiff',
        },
      });

      const caseParty2 = await prisma.caseParty.create({
        data: {
          caseId: caseId,
          partyId: party2.id,
          role: 'defendant',
        },
      });

      expect(caseParty1.caseId).toBe(caseId);
      expect(caseParty2.caseId).toBe(caseId);
      expect(caseParty1.partyId).toBe(partyId);
      expect(caseParty2.partyId).toBe(party2.id);
      expect(caseParty1.role).toBe('plaintiff');
      expect(caseParty2.role).toBe('defendant');
    });

    it('should create same party with different roles in same case', async () => {
      const caseParty1 = await prisma.caseParty.create({
        data: {
          caseId: caseId,
          partyId: partyId,
          role: 'plaintiff',
        },
      });

      const caseParty2 = await prisma.caseParty.create({
        data: {
          caseId: caseId,
          partyId: partyId,
          role: 'our_insurance',
        },
      });

      expect(caseParty1.caseId).toBe(caseId);
      expect(caseParty2.caseId).toBe(caseId);
      expect(caseParty1.partyId).toBe(partyId);
      expect(caseParty2.partyId).toBe(partyId);
      expect(caseParty1.role).toBe('plaintiff');
      expect(caseParty2.role).toBe('our_insurance');
    });

    it('should fail to create case party without case', async () => {
      await expect(
        prisma.caseParty.create({
          data: {
            caseId: 'non-existent-case-id',
            partyId: partyId,
            role: 'plaintiff',
          },
        })
      ).rejects.toThrow();
    });

    it('should fail to create case party without party', async () => {
      await expect(
        prisma.caseParty.create({
          data: {
            caseId: caseId,
            partyId: 'non-existent-party-id',
            role: 'plaintiff',
          },
        })
      ).rejects.toThrow();
    });

    it('should fail to create duplicate case party', async () => {
      await prisma.caseParty.create({
        data: {
          caseId: caseId,
          partyId: partyId,
          role: 'plaintiff',
        },
      });

      await expect(
        prisma.caseParty.create({
          data: {
            caseId: caseId,
            partyId: partyId,
            role: 'plaintiff',
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Read CaseParty', () => {
    let caseId: string;
    let partyId: string;

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
      caseId = case_.id;

      const party = await prisma.party.create({
        data: {
          isCorporation: false,
          isFormerClient: false,
        },
      });
      partyId = party.id;

      await prisma.caseParty.create({
        data: {
          caseId: caseId,
          partyId: partyId,
          role: 'plaintiff',
        },
      });
    });

    it('should find case party by composite key', async () => {
      const foundCaseParty = await prisma.caseParty.findUnique({
        where: {
          caseId_partyId_role: {
            caseId: caseId,
            partyId: partyId,
            role: 'plaintiff',
          },
        },
      });

      expect(foundCaseParty).toBeDefined();
      expect(foundCaseParty?.caseId).toBe(caseId);
      expect(foundCaseParty?.partyId).toBe(partyId);
      expect(foundCaseParty?.role).toBe('plaintiff');
    });

    it('should find case party with case relation', async () => {
      const foundCaseParty = await prisma.caseParty.findUnique({
        where: {
          caseId_partyId_role: {
            caseId: caseId,
            partyId: partyId,
            role: 'plaintiff',
          },
        },
        include: {
          case: true,
        },
      });

      expect(foundCaseParty?.case).toBeDefined();
      expect(foundCaseParty?.case.name).toBe('読取テスト事件');
    });

    it('should find case party with party relation', async () => {
      const foundCaseParty = await prisma.caseParty.findUnique({
        where: {
          caseId_partyId_role: {
            caseId: caseId,
            partyId: partyId,
            role: 'plaintiff',
          },
        },
        include: {
          party: true,
        },
      });

      expect(foundCaseParty?.party).toBeDefined();
      expect(foundCaseParty?.party.isCorporation).toBe(false);
      expect(foundCaseParty?.party.isFormerClient).toBe(false);
    });

    it('should find case party with all relations', async () => {
      const foundCaseParty = await prisma.caseParty.findUnique({
        where: {
          caseId_partyId_role: {
            caseId: caseId,
            partyId: partyId,
            role: 'plaintiff',
          },
        },
        include: {
          case: {
            include: {
              category: true,
            },
          },
          party: {
            include: {
              individual: true,
              corporation: true,
            },
          },
        },
      });

      expect(foundCaseParty?.case).toBeDefined();
      expect(foundCaseParty?.party).toBeDefined();
      expect(foundCaseParty?.case.category).toBeDefined();
      expect(foundCaseParty?.case.name).toBe('読取テスト事件');
      expect(foundCaseParty?.case.category.name).toBe('読取テストカテゴリ');
    });

    it('should find all case parties', async () => {
      const caseParties = await prisma.caseParty.findMany();

      expect(caseParties).toHaveLength(1);
      expect(caseParties[0].role).toBe('plaintiff');
    });

    it('should find case parties by role', async () => {
      const plaintiffParties = await prisma.caseParty.findMany({
        where: { role: 'plaintiff' },
      });

      const defendantParties = await prisma.caseParty.findMany({
        where: { role: 'defendant' },
      });

      expect(plaintiffParties).toHaveLength(1);
      expect(defendantParties).toHaveLength(0);
    });

    it('should find case parties by case', async () => {
      const caseParties = await prisma.caseParty.findMany({
        where: {
          case: {
            name: '読取テスト事件',
          },
        },
      });

      expect(caseParties).toHaveLength(1);
      expect(caseParties[0].role).toBe('plaintiff');
    });

    it('should find case parties by party', async () => {
      const partyCases = await prisma.caseParty.findMany({
        where: {
          party: {
            isCorporation: false,
          },
        },
      });

      expect(partyCases).toHaveLength(1);
      expect(partyCases[0].role).toBe('plaintiff');
    });

    it('should return null for non-existent case party', async () => {
      const foundCaseParty = await prisma.caseParty.findUnique({
        where: {
          caseId_partyId_role: {
            caseId: 'non-existent-case-id',
            partyId: 'non-existent-party-id',
            role: 'plaintiff',
          },
        },
      });

      expect(foundCaseParty).toBeNull();
    });
  });

  describe('Update CaseParty', () => {
    let caseId: string;
    let partyId: string;

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
      caseId = case_.id;

      const party = await prisma.party.create({
        data: {
          isCorporation: false,
          isFormerClient: false,
        },
      });
      partyId = party.id;

      await prisma.caseParty.create({
        data: {
          caseId: caseId,
          partyId: partyId,
          role: 'plaintiff',
        },
      });
    });

    it('should update case party role', async () => {
      const updatedCaseParty = await prisma.caseParty.update({
        where: {
          caseId_partyId_role: {
            caseId: caseId,
            partyId: partyId,
            role: 'plaintiff',
          },
        },
        data: {
          role: 'defendant',
        },
      });

      expect(updatedCaseParty.role).toBe('defendant');
    });

    it('should fail to update non-existent case party', async () => {
      await expect(
        prisma.caseParty.update({
          where: {
            caseId_partyId_role: {
              caseId: 'non-existent-case-id',
              partyId: 'non-existent-party-id',
              role: 'plaintiff',
            },
          },
          data: { role: 'defendant' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Delete CaseParty', () => {
    let caseId: string;
    let partyId: string;

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
      caseId = case_.id;

      const party = await prisma.party.create({
        data: {
          isCorporation: false,
          isFormerClient: false,
        },
      });
      partyId = party.id;

      await prisma.caseParty.create({
        data: {
          caseId: caseId,
          partyId: partyId,
          role: 'plaintiff',
        },
      });
    });

    it('should delete case party by composite key', async () => {
      const deletedCaseParty = await prisma.caseParty.delete({
        where: {
          caseId_partyId_role: {
            caseId: caseId,
            partyId: partyId,
            role: 'plaintiff',
          },
        },
      });

      expect(deletedCaseParty.caseId).toBe(caseId);
      expect(deletedCaseParty.partyId).toBe(partyId);
      expect(deletedCaseParty.role).toBe('plaintiff');

      const foundCaseParty = await prisma.caseParty.findUnique({
        where: {
          caseId_partyId_role: {
            caseId: caseId,
            partyId: partyId,
            role: 'plaintiff',
          },
        },
      });
      expect(foundCaseParty).toBeNull();
    });

    it('should fail to delete non-existent case party', async () => {
      await expect(
        prisma.caseParty.delete({
          where: {
            caseId_partyId_role: {
              caseId: 'non-existent-case-id',
              partyId: 'non-existent-party-id',
              role: 'plaintiff',
            },
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('CaseParty Relations', () => {
    it('should find case with parties', async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: '案件当事者一覧テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: '案件当事者一覧テスト事件',
          categoryId: category.id,
        },
      });

      const party1 = await prisma.party.create({
        data: {
          isCorporation: false,
          isFormerClient: false,
        },
      });

      const party2 = await prisma.party.create({
        data: {
          isCorporation: true,
          isFormerClient: false,
        },
      });

      await prisma.caseParty.createMany({
        data: [
          {
            caseId: case_.id,
            partyId: party1.id,
            role: 'plaintiff',
          },
          {
            caseId: case_.id,
            partyId: party2.id,
            role: 'defendant',
          },
        ],
      });

      const caseWithParties = await prisma.case.findUnique({
        where: { id: case_.id },
        include: {
          parties: {
            include: {
              party: true,
            },
          },
        },
      });

      expect(caseWithParties?.parties).toHaveLength(2);
      expect(caseWithParties?.parties[0].party.isCorporation).toBe(false);
      expect(caseWithParties?.parties[1].party.isCorporation).toBe(true);
    });

    it('should find party with cases', async () => {
      const party = await prisma.party.create({
        data: {
          isCorporation: false,
          isFormerClient: false,
        },
      });

      const category = await prisma.caseCategory.create({
        data: {
          name: '当事者案件一覧テストカテゴリ',
          roleDefinitions: {},
        },
      });

      const case1 = await prisma.case.create({
        data: {
          name: '案件1',
          categoryId: category.id,
        },
      });

      const case2 = await prisma.case.create({
        data: {
          name: '案件2',
          categoryId: category.id,
        },
      });

      await prisma.caseParty.createMany({
        data: [
          {
            caseId: case1.id,
            partyId: party.id,
            role: 'plaintiff',
          },
          {
            caseId: case2.id,
            partyId: party.id,
            role: 'defendant',
          },
        ],
      });

      const partyWithCases = await prisma.party.findUnique({
        where: { id: party.id },
        include: {
          caseLinks: {
            include: {
              case: true,
            },
          },
        },
      });

      expect(partyWithCases?.caseLinks).toHaveLength(2);
      expect(partyWithCases?.caseLinks[0].case.name).toBe('案件1');
      expect(partyWithCases?.caseLinks[1].case.name).toBe('案件2');
    });
  });
});
