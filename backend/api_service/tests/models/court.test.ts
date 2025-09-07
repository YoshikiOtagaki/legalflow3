import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '../setup';
import { cleanupDatabase } from '../lib/db-test-utils';

describe('Courthouse, CourtDivision, and CourtPersonnel Model CRUD Operations', () => {
  beforeAll(async () => {
    // テスト用のデータベース接続を確立
    await prisma.$connect();
  });

  afterAll(async () => {
    // テスト用のデータベース接続を閉じる
    await prisma.$disconnect();
  });

  beforeEach(cleanupDatabase);

  afterEach(cleanupDatabase);

  describe('Create Courthouse', () => {
    it('should create a new courthouse with required fields', async () => {
      const courthouseData = {
        name: '東京地方裁判所',
        postalCode: '100-0001',
        address1: '東京都千代田区千代田1-1-1',
        address2: '裁判所ビル',
        phone: '03-1234-5678',
      };

      const courthouse = await prisma.courthouse.create({
        data: courthouseData,
      });

      expect(courthouse).toBeDefined();
      expect(courthouse.id).toBeDefined();
      expect(courthouse.name).toBe(courthouseData.name);
      expect(courthouse.postalCode).toBe(courthouseData.postalCode);
      expect(courthouse.address1).toBe(courthouseData.address1);
      expect(courthouse.address2).toBe(courthouseData.address2);
      expect(courthouse.phone).toBe(courthouseData.phone);
    });

    it('should create a courthouse with minimal required fields', async () => {
      const courthouse = await prisma.courthouse.create({
        data: {
          name: '大阪地方裁判所',
        },
      });

      expect(courthouse).toBeDefined();
      expect(courthouse.name).toBe('大阪地方裁判所');
      expect(courthouse.postalCode).toBeNull();
    });
  });

  describe('Read Courthouse', () => {
    let courthouseId: string;

    beforeEach(async () => {
      // テスト用の裁判所を作成
      const courthouse = await prisma.courthouse.create({
        data: {
          name: '読取テスト地方裁判所',
          postalCode: '150-0001',
          address1: '東京都渋谷区神宮前1-1-1',
          phone: '03-9876-5432',
        },
      });
      courthouseId = courthouse.id;
    });

    it('should find courthouse by id', async () => {
      const foundCourthouse = await prisma.courthouse.findUnique({
        where: { id: courthouseId },
      });

      expect(foundCourthouse).toBeDefined();
      expect(foundCourthouse?.id).toBe(courthouseId);
      expect(foundCourthouse?.name).toBe('読取テスト地方裁判所');
    });

    it('should find all courthouses', async () => {
      const courthouses = await prisma.courthouse.findMany();

      expect(courthouses).toHaveLength(1);
      expect(courthouses[0].name).toBe('読取テスト地方裁判所');
    });

    it('should find courthouses by name', async () => {
      const courthouses = await prisma.courthouse.findMany({
        where: {
          name: {
            contains: '読取',
          },
        },
      });

      expect(courthouses).toHaveLength(1);
      expect(courthouses[0].name).toBe('読取テスト地方裁判所');
    });

    it('should return null for non-existent courthouse', async () => {
      const foundCourthouse = await prisma.courthouse.findUnique({
        where: { id: 'non-existent-id' },
      });

      expect(foundCourthouse).toBeNull();
    });
  });

  describe('Update Courthouse', () => {
    let courthouseId: string;

    beforeEach(async () => {
      // テスト用の裁判所を作成
      const courthouse = await prisma.courthouse.create({
        data: {
          name: '更新前地方裁判所',
          phone: '03-1111-1111',
        },
      });
      courthouseId = courthouse.id;
    });

    it('should update courthouse name', async () => {
      const updatedCourthouse = await prisma.courthouse.update({
        where: { id: courthouseId },
        data: {
          name: '更新後地方裁判所',
        },
      });

      expect(updatedCourthouse.name).toBe('更新後地方裁判所');
    });

    it('should update courthouse contact info', async () => {
      const updatedCourthouse = await prisma.courthouse.update({
        where: { id: courthouseId },
        data: {
          phone: '03-2222-2222',
          postalCode: '200-0001',
          address1: '神奈川県横浜市西区みなとみらい1-1-1',
        },
      });

      expect(updatedCourthouse.phone).toBe('03-2222-2222');
      expect(updatedCourthouse.postalCode).toBe('200-0001');
      expect(updatedCourthouse.address1).toBe('神奈川県横浜市西区みなとみらい1-1-1');
    });

    it('should fail to update non-existent courthouse', async () => {
      await expect(
        prisma.courthouse.update({
          where: { id: 'non-existent-id' },
          data: { name: '更新' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Delete Courthouse', () => {
    let courthouseId: string;

    beforeEach(async () => {
      // テスト用の裁判所を作成
      const courthouse = await prisma.courthouse.create({
        data: {
          name: '削除テスト地方裁判所',
        },
      });
      courthouseId = courthouse.id;
    });

    it('should delete courthouse by id', async () => {
      const deletedCourthouse = await prisma.courthouse.delete({
        where: { id: courthouseId },
      });

      expect(deletedCourthouse.id).toBe(courthouseId);
      expect(deletedCourthouse.name).toBe('削除テスト地方裁判所');

      // 削除された裁判所が存在しないことを確認
      const foundCourthouse = await prisma.courthouse.findUnique({
        where: { id: courthouseId },
      });
      expect(foundCourthouse).toBeNull();
    });

    it('should fail to delete non-existent courthouse', async () => {
      await expect(
        prisma.courthouse.delete({
          where: { id: 'non-existent-id' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Create CourtDivision', () => {
    let courthouseId: string;

    beforeEach(async () => {
      // テスト用の裁判所を作成
      const courthouse = await prisma.courthouse.create({
        data: {
          name: '事務部テスト地方裁判所',
        },
      });
      courthouseId = courthouse.id;
    });

    it('should create a new court division with required fields', async () => {
      const divisionData = {
        name: '民事部',
        type: 'DIVISION' as const,
        phone: '03-1234-5678',
        fax: '03-1234-5679',
        courthouseId: courthouseId,
      };

      const division = await prisma.courtDivision.create({
        data: divisionData,
      });

      expect(division).toBeDefined();
      expect(division.id).toBeDefined();
      expect(division.name).toBe(divisionData.name);
      expect(division.type).toBe(divisionData.type);
      expect(division.phone).toBe(divisionData.phone);
      expect(division.fax).toBe(divisionData.fax);
      expect(division.courthouseId).toBe(courthouseId);
    });

    it('should create a court division with default values', async () => {
      const division = await prisma.courtDivision.create({
        data: {
          name: '刑事部',
          type: 'COURT' as const,
          courthouseId: courthouseId,
        },
      });

      expect(division.name).toBe('刑事部');
      expect(division.type).toBe('COURT');
      expect(division.phone).toBeNull();
      expect(division.fax).toBeNull();
    });

    it('should create a court division with parent-child hierarchy', async () => {
      // 親の部を作成
      const parentDivision = await prisma.courtDivision.create({
        data: {
          name: '民事部',
          type: 'DIVISION' as const,
          courthouseId: courthouseId,
        },
      });

      // 子の課を作成
      const childDivision = await prisma.courtDivision.create({
        data: {
          name: '民事第1課',
          type: 'SECTION' as const,
          courthouseId: courthouseId,
          parentId: parentDivision.id,
        },
      });

      expect(childDivision.parentId).toBe(parentDivision.id);
    });

    it('should fail to create division without courthouse', async () => {
      await expect(
        prisma.courtDivision.create({
          data: {
            name: 'テスト部',
            type: 'DIVISION' as const,
            courthouseId: 'non-existent-courthouse-id',
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Read CourtDivision', () => {
    let divisionId: string;

    beforeEach(async () => {
      // テスト用の裁判所と部を作成
      const courthouse = await prisma.courthouse.create({
        data: {
          name: '部読取テスト地方裁判所',
        },
      });

      const division = await prisma.courtDivision.create({
        data: {
          name: '民事部',
          type: 'DIVISION' as const,
          phone: '03-9876-5432',
          fax: '03-9876-5433',
          courthouseId: courthouse.id,
        },
      });
      divisionId = division.id;
    });

    it('should find division by id', async () => {
      const foundDivision = await prisma.courtDivision.findUnique({
        where: { id: divisionId },
      });

      expect(foundDivision).toBeDefined();
      expect(foundDivision?.id).toBe(divisionId);
      expect(foundDivision?.name).toBe('民事部');
    });

    it('should find division with courthouse relation', async () => {
      const foundDivision = await prisma.courtDivision.findUnique({
        where: { id: divisionId },
        include: {
          courthouse: true,
        },
      });

      expect(foundDivision?.courthouse).toBeDefined();
      expect(foundDivision?.courthouse.name).toBe('部読取テスト地方裁判所');
    });

    it('should find all divisions', async () => {
      const divisions = await prisma.courtDivision.findMany();

      expect(divisions).toHaveLength(1);
      expect(divisions[0].name).toBe('民事部');
    });

    it('should find divisions by type', async () => {
      const courtDivisions = await prisma.courtDivision.findMany({
        where: { type: 'COURT' },
      });

      const divisionDivisions = await prisma.courtDivision.findMany({
        where: { type: 'DIVISION' },
      });

      expect(courtDivisions).toHaveLength(0);
      expect(divisionDivisions).toHaveLength(1);
    });

    it('should return null for non-existent division', async () => {
      const foundDivision = await prisma.courtDivision.findUnique({
        where: { id: 'non-existent-id' },
      });

      expect(foundDivision).toBeNull();
    });
  });

  describe('Update CourtDivision', () => {
    let divisionId: string;

    beforeEach(async () => {
      // テスト用の裁判所と部を作成
      const courthouse = await prisma.courthouse.create({
        data: {
          name: '部更新テスト地方裁判所',
        },
      });

      const division = await prisma.courtDivision.create({
        data: {
          name: '更新前部',
          type: 'DIVISION' as const,
          courthouseId: courthouse.id,
        },
      });
      divisionId = division.id;
    });

    it('should update division name', async () => {
      const updatedDivision = await prisma.courtDivision.update({
        where: { id: divisionId },
        data: {
          name: '更新後部',
        },
      });

      expect(updatedDivision.name).toBe('更新後部');
    });

    it('should update division type', async () => {
      const updatedDivision = await prisma.courtDivision.update({
        where: { id: divisionId },
        data: {
          type: 'COURT' as const,
        },
      });

      expect(updatedDivision.type).toBe('COURT');
    });

    it('should update division contact info', async () => {
      const updatedDivision = await prisma.courtDivision.update({
        where: { id: divisionId },
        data: {
          phone: '03-3333-3333',
          fax: '03-3333-3334',
        },
      });

      expect(updatedDivision.phone).toBe('03-3333-3333');
      expect(updatedDivision.fax).toBe('03-3333-3334');
    });

    it('should fail to update non-existent division', async () => {
      await expect(
        prisma.courtDivision.update({
          where: { id: 'non-existent-id' },
          data: { name: '更新' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Delete CourtDivision', () => {
    let divisionId: string;

    beforeEach(async () => {
      // テスト用の裁判所と部を作成
      const courthouse = await prisma.courthouse.create({
        data: {
          name: '部削除テスト地方裁判所',
        },
      });

      const division = await prisma.courtDivision.create({
        data: {
          name: '削除テスト部',
          type: 'DIVISION' as const,
          courthouseId: courthouse.id,
        },
      });
      divisionId = division.id;
    });

    it('should delete division by id', async () => {
      const deletedDivision = await prisma.courtDivision.delete({
        where: { id: divisionId },
      });

      expect(deletedDivision.id).toBe(divisionId);
      expect(deletedDivision.name).toBe('削除テスト部');

      // 削除された部が存在しないことを確認
      const foundDivision = await prisma.courtDivision.findUnique({
        where: { id: divisionId },
      });
      expect(foundDivision).toBeNull();
    });

    it('should fail to delete non-existent division', async () => {
      await expect(
        prisma.courtDivision.delete({
          where: { id: 'non-existent-id' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Create CourtPersonnel', () => {
    let divisionId: string;

    beforeEach(async () => {
      // テスト用の裁判所と部を作成
      const courthouse = await prisma.courthouse.create({
        data: {
          name: '職員テスト地方裁判所',
        },
      });

      const division = await prisma.courtDivision.create({
        data: {
          name: '民事部',
          type: 'DIVISION' as const,
          courthouseId: courthouse.id,
        },
      });
      divisionId = division.id;
    });

    it('should create a new court personnel with required fields', async () => {
      const personnelData = {
        name: '田中 太郎',
        email: 'tanaka@court.go.jp',
        role: 'JUDGE' as const,
        courtDivisionId: divisionId,
      };

      const personnel = await prisma.courtPersonnel.create({
        data: personnelData,
      });

      expect(personnel).toBeDefined();
      expect(personnel.id).toBeDefined();
      expect(personnel.name).toBe(personnelData.name);
      expect(personnel.email).toBe(personnelData.email);
      expect(personnel.role).toBe(personnelData.role);
      expect(personnel.courtDivisionId).toBe(divisionId);
    });

    it('should create a court personnel with minimal required fields', async () => {
      const personnel = await prisma.courtPersonnel.create({
        data: {
          name: '佐藤 花子',
          role: 'CLERK' as const,
          courtDivisionId: divisionId,
        },
      });

      expect(personnel.name).toBe('佐藤 花子');
      expect(personnel.role).toBe('CLERK');
      expect(personnel.email).toBeNull();
    });

    it('should fail to create personnel without division', async () => {
      await expect(
        prisma.courtPersonnel.create({
          data: {
            name: 'テスト職員',
            role: 'JUDGE' as const,
            courtDivisionId: 'non-existent-division-id',
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Read CourtPersonnel', () => {
    let personnelId: string;

    beforeEach(async () => {
      // テスト用の裁判所、部、職員を作成
      const courthouse = await prisma.courthouse.create({
        data: {
          name: '職員読取テスト地方裁判所',
        },
      });

      const division = await prisma.courtDivision.create({
        data: {
          name: '民事部',
          type: 'DIVISION' as const,
          courthouseId: courthouse.id,
        },
      });

      const personnel = await prisma.courtPersonnel.create({
        data: {
          name: '山田 次郎',
          email: 'yamada@court.go.jp',
          role: 'JUDGE' as const,
          courtDivisionId: division.id,
        },
      });
      personnelId = personnel.id;
    });

    it('should find personnel by id', async () => {
      const foundPersonnel = await prisma.courtPersonnel.findUnique({
        where: { id: personnelId },
      });

      expect(foundPersonnel).toBeDefined();
      expect(foundPersonnel?.id).toBe(personnelId);
      expect(foundPersonnel?.name).toBe('山田 次郎');
    });

    it('should find personnel with division relation', async () => {
      const foundPersonnel = await prisma.courtPersonnel.findUnique({
        where: { id: personnelId },
        include: {
          courtDivision: true,
        },
      });

      expect(foundPersonnel?.courtDivision).toBeDefined();
      expect(foundPersonnel?.courtDivision.name).toBe('民事部');
    });

    it('should find all personnel', async () => {
      const personnel = await prisma.courtPersonnel.findMany();

      expect(personnel).toHaveLength(1);
      expect(personnel[0].name).toBe('山田 次郎');
    });

    it('should find personnel by role', async () => {
      const judges = await prisma.courtPersonnel.findMany({
        where: { role: 'JUDGE' },
      });

      const clerks = await prisma.courtPersonnel.findMany({
        where: { role: 'CLERK' },
      });

      expect(judges).toHaveLength(1);
      expect(clerks).toHaveLength(0);
    });

    it('should return null for non-existent personnel', async () => {
      const foundPersonnel = await prisma.courtPersonnel.findUnique({
        where: { id: 'non-existent-id' },
      });

      expect(foundPersonnel).toBeNull();
    });
  });

  describe('Update CourtPersonnel', () => {
    let personnelId: string;

    beforeEach(async () => {
      // テスト用の裁判所、部、職員を作成
      const courthouse = await prisma.courthouse.create({
        data: {
          name: '職員更新テスト地方裁判所',
        },
      });

      const division = await prisma.courtDivision.create({
        data: {
          name: '民事部',
          type: 'DIVISION' as const,
          courthouseId: courthouse.id,
        },
      });

      const personnel = await prisma.courtPersonnel.create({
        data: {
          name: '更新前職員',
          role: 'JUDGE' as const,
          courtDivisionId: division.id,
        },
      });
      personnelId = personnel.id;
    });

    it('should update personnel name', async () => {
      const updatedPersonnel = await prisma.courtPersonnel.update({
        where: { id: personnelId },
        data: {
          name: '更新後職員',
        },
      });

      expect(updatedPersonnel.name).toBe('更新後職員');
    });

    it('should update personnel role', async () => {
      const updatedPersonnel = await prisma.courtPersonnel.update({
        where: { id: personnelId },
        data: {
          role: 'CLERK' as const,
        },
      });

      expect(updatedPersonnel.role).toBe('CLERK');
    });

    it('should update personnel email', async () => {
      const updatedPersonnel = await prisma.courtPersonnel.update({
        where: { id: personnelId },
        data: {
          email: 'updated@court.go.jp',
        },
      });

      expect(updatedPersonnel.email).toBe('updated@court.go.jp');
    });

    it('should fail to update non-existent personnel', async () => {
      await expect(
        prisma.courtPersonnel.update({
          where: { id: 'non-existent-id' },
          data: { name: '更新' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Delete CourtPersonnel', () => {
    let personnelId: string;

    beforeEach(async () => {
      // テスト用の裁判所、部、職員を作成
      const courthouse = await prisma.courthouse.create({
        data: {
          name: '職員削除テスト地方裁判所',
        },
      });

      const division = await prisma.courtDivision.create({
        data: {
          name: '民事部',
          type: 'DIVISION' as const,
          courthouseId: courthouse.id,
        },
      });

      const personnel = await prisma.courtPersonnel.create({
        data: {
          name: '削除テスト職員',
          role: 'JUDGE' as const,
          courtDivisionId: division.id,
        },
      });
      personnelId = personnel.id;
    });

    it('should delete personnel by id', async () => {
      const deletedPersonnel = await prisma.courtPersonnel.delete({
        where: { id: personnelId },
      });

      expect(deletedPersonnel.id).toBe(personnelId);
      expect(deletedPersonnel.name).toBe('削除テスト職員');

      // 削除された職員が存在しないことを確認
      const foundPersonnel = await prisma.courtPersonnel.findUnique({
        where: { id: personnelId },
      });
      expect(foundPersonnel).toBeNull();
    });

    it('should fail to delete non-existent personnel', async () => {
      await expect(
        prisma.courtPersonnel.delete({
          where: { id: 'non-existent-id' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Court Relations', () => {
    it('should create courthouse with divisions and personnel', async () => {
      const courthouse = await prisma.courthouse.create({
        data: {
          name: '関係テスト地方裁判所',
          divisions: {
            create: [
              {
                name: '民事部',
                type: 'DIVISION' as const,
                personnel: {
                  create: [
                    {
                      name: '裁判官1',
                      role: 'JUDGE' as const,
                    },
                    {
                      name: '書記官1',
                      role: 'CLERK' as const,
                    },
                  ],
                },
              },
              {
                name: '刑事部',
                type: 'DIVISION' as const,
                personnel: {
                  create: {
                    name: '裁判官2',
                    role: 'JUDGE' as const,
                  },
                },
              },
            ],
          },
        },
        include: {
          divisions: {
            include: {
              personnel: true,
            },
          },
        },
      });

      expect(courthouse.divisions).toHaveLength(2);
      expect(courthouse.divisions[0].personnel).toHaveLength(2);
      expect(courthouse.divisions[1].personnel).toHaveLength(1);
    });
  });
});
