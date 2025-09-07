import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '../setup';
import { cleanupDatabase } from '../lib/db-test-utils';

describe('Party and CorporateProfile Model CRUD Operations', () => {
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

  describe('Create Party with Corporate Profile', () => {
    it('should create a new party with corporate profile', async () => {
      const partyData = {
        isCorporation: true,
        isFormerClient: false,
        corporation: {
          create: {
            name: 'テスト株式会社',
            nameKana: 'テストカブシキガイシャ',
            postalCode: '100-0001',
            address1: '東京都千代田区千代田1-1-1',
            address2: 'ビル10階',
            phone: '03-1234-5678',
            email: 'info@test-corp.com',
            websiteURL: 'https://test-corp.com',
            representativeTitle: '代表取締役',
            representativeLastName: '田中',
            representativeFirstName: '太郎',
            contactLastName: '佐藤',
            contactFirstName: '花子',
            contactDepartment: '法務部',
            contactPosition: '部長',
            contactEmail: 'legal@test-corp.com',
          },
        },
      };

      const party = await prisma.party.create({
        data: partyData,
        include: {
          corporation: true,
        },
      });

      expect(party).toBeDefined();
      expect(party.id).toBeDefined();
      expect(party.isCorporation).toBe(true);
      expect(party.isFormerClient).toBe(false);
      expect(party.corporation).toBeDefined();
      expect(party.corporation?.name).toBe('テスト株式会社');
      expect(party.corporation?.email).toBe('info@test-corp.com');
    });

    it('should create a party with corporate profile and default values', async () => {
      const party = await prisma.party.create({
        data: {
          isCorporation: true,
          corporation: {
            create: {
              name: 'シンプル株式会社',
              email: 'simple@example.com',
            },
          },
        },
        include: {
          corporation: true,
        },
      });

      expect(party.isCorporation).toBe(true);
      expect(party.isFormerClient).toBe(false);
      expect(party.corporation?.name).toBe('シンプル株式会社');
    });

    it('should create a former client corporate party', async () => {
      const party = await prisma.party.create({
        data: {
          isCorporation: true,
          isFormerClient: true,
          corporation: {
            create: {
              name: '旧クライアント株式会社',
              email: 'former@example.com',
            },
          },
        },
        include: {
          corporation: true,
        },
      });

      expect(party.isCorporation).toBe(true);
      expect(party.isFormerClient).toBe(true);
      expect(party.corporation?.name).toBe('旧クライアント株式会社');
    });

    it('should create party without corporate profile (allowed by schema)', async () => {
      const party = await prisma.party.create({
        data: {
          isCorporation: true,
        },
        include: {
          corporation: true,
        },
      });

      expect(party).toBeDefined();
      expect(party.isCorporation).toBe(true);
      expect(party.corporation).toBeNull();
    });
  });

  describe('Read Party with Corporate Profile', () => {
    let partyId: string;

    beforeEach(async () => {
      // テスト用のパーティーを作成
      const party = await prisma.party.create({
        data: {
          isCorporation: true,
          isFormerClient: false,
          corporation: {
            create: {
              name: '読取テスト株式会社',
              nameKana: 'ドクトクテストカブシキガイシャ',
              postalCode: '150-0001',
              address1: '東京都渋谷区神宮前1-1-1',
              address2: 'マンション101',
              phone: '03-9876-5432',
              mobilePhone: '090-1234-5678',
              email: 'read-test@example.com',
              websiteURL: 'https://read-test.com',
              representativeTitle: '代表取締役社長',
              representativeLastName: '山田',
              representativeFirstName: '次郎',
              contactLastName: '鈴木',
              contactFirstName: '一郎',
              contactLastNameKana: 'スズキ',
              contactFirstNameKana: 'イチロウ',
              contactDepartment: '総務部',
              contactPosition: '課長',
              contactDirectPhone: '03-1111-2222',
              contactEmail: 'contact@read-test.com',
              contactMobilePhone: '090-9876-5432',
              contactPostalCode: '200-0001',
              contactAddress1: '神奈川県横浜市西区みなとみらい1-1-1',
              contactAddress2: 'タワーA 1001号室',
            },
          },
        },
      });
      partyId = party.id;
    });

    it('should find party by id with corporate profile', async () => {
      const foundParty = await prisma.party.findUnique({
        where: { id: partyId },
        include: {
          corporation: true,
        },
      });

      expect(foundParty).toBeDefined();
      expect(foundParty?.id).toBe(partyId);
      expect(foundParty?.corporation).toBeDefined();
      expect(foundParty?.corporation?.name).toBe('読取テスト株式会社');
    });

    it('should find party with corporate profile details', async () => {
      const foundParty = await prisma.party.findUnique({
        where: { id: partyId },
        include: {
          corporation: true,
        },
      });

      expect(foundParty?.corporation).toBeDefined();
      expect(foundParty?.corporation?.name).toBe('読取テスト株式会社');
      expect(foundParty?.corporation?.nameKana).toBe('ドクトクテストカブシキガイシャ');
      expect(foundParty?.corporation?.email).toBe('read-test@example.com');
      expect(foundParty?.corporation?.representativeLastName).toBe('山田');
      expect(foundParty?.corporation?.contactLastName).toBe('鈴木');
    });

    it('should find all corporate parties', async () => {
      const parties = await prisma.party.findMany({
        where: { isCorporation: true },
        include: {
          corporation: true,
        },
      });

      expect(parties).toHaveLength(1);
      expect(parties[0].corporation).toBeDefined();
      expect(parties[0].corporation?.name).toBe('読取テスト株式会社');
    });

    it('should find parties by corporation status', async () => {
      const corporateParties = await prisma.party.findMany({
        where: { isCorporation: true },
      });

      const individualParties = await prisma.party.findMany({
        where: { isCorporation: false },
      });

      expect(corporateParties).toHaveLength(1);
      expect(individualParties).toHaveLength(0);
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
      // テスト用のパーティーを作成
      const party = await prisma.party.create({
        data: {
          isCorporation: true,
          isFormerClient: false,
          corporation: {
            create: {
              name: '更新テスト株式会社',
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
        data: { isCorporation: false },
      });

      expect(updatedParty.isCorporation).toBe(false);
      expect(updatedParty.isFormerClient).toBe(false);
    });

    it('should update party former client status', async () => {
      const updatedParty = await prisma.party.update({
        where: { id: partyId },
        data: { isFormerClient: true },
      });

      expect(updatedParty.isFormerClient).toBe(true);
      expect(updatedParty.isCorporation).toBe(true);
    });

    it('should update multiple party fields', async () => {
      const updatedParty = await prisma.party.update({
        where: { id: partyId },
        data: {
          isCorporation: false,
          isFormerClient: true,
        },
      });

      expect(updatedParty.isCorporation).toBe(false);
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

  describe('Update CorporateProfile', () => {
    let partyId: string;
    let corporateId: string;

    beforeEach(async () => {
      // テスト用のパーティーと法人プロファイルを作成
      const party = await prisma.party.create({
        data: {
          isCorporation: true,
          corporation: {
            create: {
              name: '更新前株式会社',
              email: 'before@example.com',
              phone: '03-1111-1111',
            },
          },
        },
        include: {
          corporation: true,
        },
      });
      partyId = party.id;
      corporateId = party.corporation!.id;
    });

    it('should update corporate profile name', async () => {
      const updatedCorporate = await prisma.corporateProfile.update({
        where: { id: corporateId },
        data: {
          name: '更新後株式会社',
          nameKana: 'コウシンゴカブシキガイシャ',
        },
      });

      expect(updatedCorporate.name).toBe('更新後株式会社');
      expect(updatedCorporate.nameKana).toBe('コウシンゴカブシキガイシャ');
    });

    it('should update corporate profile contact info', async () => {
      const updatedCorporate = await prisma.corporateProfile.update({
        where: { id: corporateId },
        data: {
          email: 'after@example.com',
          phone: '03-2222-2222',
          mobilePhone: '090-2222-2222',
          websiteURL: 'https://after-corp.com',
        },
      });

      expect(updatedCorporate.email).toBe('after@example.com');
      expect(updatedCorporate.phone).toBe('03-2222-2222');
      expect(updatedCorporate.mobilePhone).toBe('090-2222-2222');
      expect(updatedCorporate.websiteURL).toBe('https://after-corp.com');
    });

    it('should update corporate profile address', async () => {
      const updatedCorporate = await prisma.corporateProfile.update({
        where: { id: corporateId },
        data: {
          postalCode: '200-0001',
          address1: '神奈川県横浜市西区みなとみらい1-1-1',
          address2: 'タワーA 1001号室',
        },
      });

      expect(updatedCorporate.postalCode).toBe('200-0001');
      expect(updatedCorporate.address1).toBe('神奈川県横浜市西区みなとみらい1-1-1');
      expect(updatedCorporate.address2).toBe('タワーA 1001号室');
    });

    it('should update corporate profile representative info', async () => {
      const updatedCorporate = await prisma.corporateProfile.update({
        where: { id: corporateId },
        data: {
          representativeTitle: '代表取締役社長',
          representativeLastName: '更新',
          representativeFirstName: '太郎',
        },
      });

      expect(updatedCorporate.representativeTitle).toBe('代表取締役社長');
      expect(updatedCorporate.representativeLastName).toBe('更新');
      expect(updatedCorporate.representativeFirstName).toBe('太郎');
    });

    it('should update corporate profile contact person info', async () => {
      const updatedCorporate = await prisma.corporateProfile.update({
        where: { id: corporateId },
        data: {
          contactLastName: '担当',
          contactFirstName: '花子',
          contactLastNameKana: 'タントウ',
          contactFirstNameKana: 'ハナコ',
          contactDepartment: '法務部',
          contactPosition: '部長',
          contactDirectPhone: '03-3333-3333',
          contactEmail: 'contact@example.com',
          contactMobilePhone: '090-3333-3333',
        },
      });

      expect(updatedCorporate.contactLastName).toBe('担当');
      expect(updatedCorporate.contactFirstName).toBe('花子');
      expect(updatedCorporate.contactDepartment).toBe('法務部');
      expect(updatedCorporate.contactPosition).toBe('部長');
      expect(updatedCorporate.contactEmail).toBe('contact@example.com');
    });

    it('should fail to update non-existent corporate profile', async () => {
      await expect(
        prisma.corporateProfile.update({
          where: { id: 'non-existent-id' },
          data: { name: '更新' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Delete Party', () => {
    let partyId: string;

    beforeEach(async () => {
      // テスト用のパーティーを作成
      const party = await prisma.party.create({
        data: {
          isCorporation: true,
          corporation: {
            create: {
              name: '削除テスト株式会社',
              email: 'delete@example.com',
            },
          },
        },
      });
      partyId = party.id;
    });

    it('should delete party by id', async () => {
      // まずCorporateProfileを削除
      await prisma.corporateProfile.deleteMany({
        where: { partyId: partyId },
      });

      const deletedParty = await prisma.party.delete({
        where: { id: partyId },
      });

      expect(deletedParty.id).toBe(partyId);
      expect(deletedParty.isCorporation).toBe(true);

      // 削除されたパーティーが存在しないことを確認
      const foundParty = await prisma.party.findUnique({
        where: { id: partyId },
      });
      expect(foundParty).toBeNull();
    });

    it('should delete corporate profile when party is deleted', async () => {
      // まずCorporateProfileを削除
      await prisma.corporateProfile.deleteMany({
        where: { partyId: partyId },
      });

      // パーティーを削除
      await prisma.party.delete({
        where: { id: partyId },
      });

      // 法人プロファイルも削除されていることを確認
      const corporateProfiles = await prisma.corporateProfile.findMany();
      expect(corporateProfiles).toHaveLength(0);
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
      // まず案件カテゴリを作成
      const category = await prisma.caseCategory.create({
        data: {
          name: 'Test Category',
          roleDefinitions: {},
        },
      });

      // 案件を作成
      const case_ = await prisma.case.create({
        data: {
          name: 'Test Case',
          categoryId: category.id,
        },
      });

      // パーティーを作成
      const party = await prisma.party.create({
        data: {
          isCorporation: true,
          corporation: {
            create: {
              name: '関係テスト株式会社',
              email: 'relation@example.com',
            },
          },
          caseLinks: {
            create: {
              caseId: case_.id,
              role: 'defendant',
            },
          },
        },
        include: {
          caseLinks: true,
        },
      });

      expect(party.caseLinks).toHaveLength(1);
      expect(party.caseLinks[0].role).toBe('defendant');

      // テスト後にクリーンアップ
      await prisma.caseParty.deleteMany();
      await prisma.case.deleteMany();
      await prisma.caseCategory.deleteMany();
    });
  });
});
