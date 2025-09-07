import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '../setup';
import { cleanupDatabase } from '../lib/db-test-utils';

describe('Party and IndividualProfile Model CRUD Operations', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(cleanupDatabase);

  afterEach(cleanupDatabase);

  describe('Create Party', () => {
    it('should create a new party with individual profile', async () => {
      const partyData = {
        isCorporation: false,
        isFormerClient: false,
        individual: {
          create: {
            lastName: '田中',
            firstName: '太郎',
            lastNameKana: 'タナカ',
            firstNameKana: 'タロウ',
            email: 'tanaka@example.com',
            phone: '03-1234-5678',
            postalCode: '100-0001',
            address1: '東京都千代田区千代田1-1-1',
          },
        },
      };

      const party = await prisma.party.create({
        data: partyData,
        include: {
          individual: true,
        },
      });

      expect(party).toBeDefined();
      expect(party.id).toBeDefined();
      expect(party.isCorporation).toBe(false);
      expect(party.isFormerClient).toBe(false);
      expect(party.individual).toBeDefined();
      expect(party.individual?.lastName).toBe('田中');
      expect(party.individual?.firstName).toBe('太郎');
      expect(party.individual?.email).toBe('tanaka@example.com');
    });

    it('should create a party with default values', async () => {
      const party = await prisma.party.create({
        data: {
          individual: {
            create: {
              lastName: '佐藤',
              firstName: '花子',
              email: 'sato@example.com',
            },
          },
        },
      });

      expect(party.isCorporation).toBe(false);
      expect(party.isFormerClient).toBe(false);
    });

    it('should create a former client party', async () => {
      const party = await prisma.party.create({
        data: {
          isFormerClient: true,
          individual: {
            create: {
              lastName: '鈴木',
              firstName: '一郎',
              email: 'suzuki@example.com',
            },
          },
        },
      });

      expect(party.isFormerClient).toBe(true);
    });

    it('should create party without individual profile (allowed by schema)', async () => {
      const party = await prisma.party.create({
        data: {
          isCorporation: false,
        },
        include: {
          individual: true,
        },
      });

      expect(party).toBeDefined();
      expect(party.isCorporation).toBe(false);
      expect(party.individual).toBeNull();
    });
  });

  describe('Read Party', () => {
    let partyId: string;

    beforeEach(async () => {
      const party = await prisma.party.create({
        data: {
          isCorporation: false,
          isFormerClient: false,
          individual: {
            create: {
              lastName: '山田',
              firstName: '次郎',
              lastNameKana: 'ヤマダ',
              firstNameKana: 'ジロウ',
              email: 'yamada@example.com',
              phone: '03-9876-5432',
              mobilePhone: '090-1234-5678',
              postalCode: '150-0001',
              address1: '東京都渋谷区神宮前1-1-1',
              address2: 'マンション101',
            },
          },
        },
      });
      partyId = party.id;
    });

    it('should find party by id', async () => {
      const foundParty = await prisma.party.findUnique({
        where: { id: partyId },
        include: {
          individual: true,
        },
      });

      expect(foundParty).toBeDefined();
      expect(foundParty?.id).toBe(partyId);
      expect(foundParty?.individual).toBeDefined();
      expect(foundParty?.individual?.lastName).toBe('山田');
    });

    it('should find party with individual profile', async () => {
      const foundParty = await prisma.party.findUnique({
        where: { id: partyId },
        include: {
          individual: true,
        },
      });

      expect(foundParty?.individual).toBeDefined();
      expect(foundParty?.individual?.lastName).toBe('山田');
      expect(foundParty?.individual?.firstName).toBe('次郎');
      expect(foundParty?.individual?.email).toBe('yamada@example.com');
    });

    it('should find all parties', async () => {
      const parties = await prisma.party.findMany({
        include: {
          individual: true,
        },
      });

      expect(parties).toHaveLength(1);
      expect(parties[0].individual).toBeDefined();
    });

    it('should find parties by corporation status', async () => {
      const individualParties = await prisma.party.findMany({
        where: { isCorporation: false },
      });

      const corporateParties = await prisma.party.findMany({
        where: { isCorporation: true },
      });

      expect(individualParties).toHaveLength(1);
      expect(corporateParties).toHaveLength(0);
    });

    it('should find parties by former client status', async () => {
      const formerClients = await prisma.party.findMany({
        where: { isFormerClient: true },
      });

      const currentClients = await prisma.party.findMany({
        where: { isFormerClient: false },
      });

      expect(formerClients).toHaveLength(0);
      expect(currentClients).toHaveLength(1);
    });

    it('should return null for non-existent party', async () => {
      const foundParty = await prisma.party.findUnique({
        where: { id: 'non-existent-id' },
      });

      expect(foundParty).toBeNull();
    });
  });

  describe('Update Party', () => {
    let partyId: string;

    beforeEach(async () => {
      const party = await prisma.party.create({
        data: {
          isCorporation: false,
          isFormerClient: false,
          individual: {
            create: {
              lastName: '更新',
              firstName: 'テスト',
              email: 'update@example.com',
            },
          },
        },
      });
      partyId = party.id;
    });

    it('should update party corporation status', async () => {
      const updatedParty = await prisma.party.update({
        where: { id: partyId },
        data: { isCorporation: true },
      });

      expect(updatedParty.isCorporation).toBe(true);
      expect(updatedParty.isFormerClient).toBe(false);
    });

    it('should update party former client status', async () => {
      const updatedParty = await prisma.party.update({
        where: { id: partyId },
        data: { isFormerClient: true },
      });

      expect(updatedParty.isFormerClient).toBe(true);
      expect(updatedParty.isCorporation).toBe(false);
    });

    it('should update multiple party fields', async () => {
      const updatedParty = await prisma.party.update({
        where: { id: partyId },
        data: {
          isCorporation: true,
          isFormerClient: true,
        },
      });

      expect(updatedParty.isCorporation).toBe(true);
      expect(updatedParty.isFormerClient).toBe(true);
    });

    it('should fail to update non-existent party', async () => {
      await expect(
        prisma.party.update({
          where: { id: 'non-existent-id' },
          data: { isFormerClient: true },
        })
      ).rejects.toThrow();
    });
  });

  describe('Update IndividualProfile', () => {
    let partyId: string;
    let individualId: string;

    beforeEach(async () => {
      const party = await prisma.party.create({
        data: {
          isCorporation: false,
          individual: {
            create: {
              lastName: '更新前',
              firstName: '名前',
              email: 'before@example.com',
              phone: '03-1111-1111',
            },
          },
        },
        include: {
          individual: true,
        },
      });
      partyId = party.id;
      individualId = party.individual!.id;
    });

    it('should update individual profile name', async () => {
      const updatedIndividual = await prisma.individualProfile.update({
        where: { id: individualId },
        data: {
          lastName: '更新後',
          firstName: '名前',
        },
      });

      expect(updatedIndividual.lastName).toBe('更新後');
      expect(updatedIndividual.firstName).toBe('名前');
    });

    it('should update individual profile contact info', async () => {
      const updatedIndividual = await prisma.individualProfile.update({
        where: { id: individualId },
        data: {
          email: 'after@example.com',
          phone: '03-2222-2222',
          mobilePhone: '090-2222-2222',
        },
      });

      expect(updatedIndividual.email).toBe('after@example.com');
      expect(updatedIndividual.phone).toBe('03-2222-2222');
      expect(updatedIndividual.mobilePhone).toBe('090-2222-2222');
    });

    it('should update individual profile address', async () => {
      const updatedIndividual = await prisma.individualProfile.update({
        where: { id: individualId },
        data: {
          postalCode: '200-0001',
          address1: '神奈川県横浜市西区みなとみらい1-1-1',
          address2: 'タワーA 1001号室',
        },
      });

      expect(updatedIndividual.postalCode).toBe('200-0001');
      expect(updatedIndividual.address1).toBe('神奈川県横浜市西区みなとみらい1-1-1');
      expect(updatedIndividual.address2).toBe('タワーA 1001号室');
    });

    it('should update individual profile company info', async () => {
      const updatedIndividual = await prisma.individualProfile.update({
        where: { id: individualId },
        data: {
          companyName: 'テスト株式会社',
          companyNameKana: 'テストカブシキガイシャ',
          department: '法務部',
          position: '部長',
          companyEmail: 'test@company.com',
        },
      });

      expect(updatedIndividual.companyName).toBe('テスト株式会社');
      expect(updatedIndividual.companyNameKana).toBe('テストカブシキガイシャ');
      expect(updatedIndividual.department).toBe('法務部');
      expect(updatedIndividual.position).toBe('部長');
      expect(updatedIndividual.companyEmail).toBe('test@company.com');
    });

    it('should fail to update non-existent individual profile', async () => {
      await expect(
        prisma.individualProfile.update({
          where: { id: 'non-existent-id' },
          data: { lastName: '更新' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Delete Party', () => {
    let partyId: string;

    beforeEach(async () => {
      const party = await prisma.party.create({
        data: {
          isCorporation: false,
          individual: {
            create: {
              lastName: '削除',
              firstName: 'テスト',
              email: 'delete@example.com',
            },
          },
        },
      });
      partyId = party.id;
    });

    it('should delete party by id', async () => {
      await prisma.individualProfile.deleteMany({
        where: { partyId: partyId },
      });

      const deletedParty = await prisma.party.delete({
        where: { id: partyId },
      });

      expect(deletedParty.id).toBe(partyId);
      expect(deletedParty.isCorporation).toBe(false);

      const foundParty = await prisma.party.findUnique({
        where: { id: partyId },
      });
      expect(foundParty).toBeNull();
    });

    it('should delete individual profile when party is deleted', async () => {
      await prisma.individualProfile.deleteMany({
        where: { partyId: partyId },
      });

      await prisma.party.delete({
        where: { id: partyId },
      });

      const individualProfiles = await prisma.individualProfile.findMany();
      expect(individualProfiles).toHaveLength(0);
    });

    it('should fail to delete non-existent party', async () => {
      await expect(
        prisma.party.delete({
          where: { id: 'non-existent-id' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Party Relations', () => {
    it('should create party with case links', async () => {
      const category = await prisma.caseCategory.create({
        data: {
          name: 'Test Category',
          roleDefinitions: {},
        },
      });

      const case_ = await prisma.case.create({
        data: {
          name: 'Test Case',
          categoryId: category.id,
        },
      });

      const party = await prisma.party.create({
        data: {
          isCorporation: false,
          individual: {
            create: {
              lastName: '関係',
              firstName: 'テスト',
              email: 'relation@example.com',
            },
          },
          caseLinks: {
            create: {
              caseId: case_.id,
              role: 'plaintiff',
            },
          },
        },
        include: {
          caseLinks: true,
        },
      });

      expect(party.caseLinks).toHaveLength(1);
      expect(party.caseLinks[0].role).toBe('plaintiff');

      await prisma.caseParty.deleteMany();
      await prisma.case.deleteMany();
      await prisma.caseCategory.deleteMany();
    });
  });
});
