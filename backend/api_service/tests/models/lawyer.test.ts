import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '../setup';
import { cleanupDatabase } from '../lib/db-test-utils';

describe('Lawyer Model CRUD Operations', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(cleanupDatabase);

  afterEach(cleanupDatabase);

  describe('Create Lawyer', () => {
    it('should create a new lawyer with required fields', async () => {
      const lawyerData = {
        lastName: '田中',
        firstName: '太郎',
        lastNameKana: 'タナカ',
        firstNameKana: 'タロウ',
        honorific: '先生',
        registrationNumber: '12345',
        homePhone: '03-1234-5678',
        homePostalCode: '100-0001',
        homeAddress1: '東京都千代田区千代田1-1-1',
        homeAddress2: 'マンション101',
        itemsInCustody: '重要書類',
        cautions: '特記事項なし',
        remarks: '備考欄',
      };

      const lawyer = await prisma.lawyer.create({
        data: lawyerData,
      });

      expect(lawyer).toBeDefined();
      expect(lawyer.id).toBeDefined();
      expect(lawyer.lastName).toBe(lawyerData.lastName);
      expect(lawyer.firstName).toBe(lawyerData.firstName);
      expect(lawyer.lastNameKana).toBe(lawyerData.lastNameKana);
      expect(lawyer.firstNameKana).toBe(lawyerData.firstNameKana);
      expect(lawyer.honorific).toBe(lawyerData.honorific);
      expect(lawyer.registrationNumber).toBe(lawyerData.registrationNumber);
      expect(lawyer.homePhone).toBe(lawyerData.homePhone);
      expect(lawyer.homePostalCode).toBe(lawyerData.homePostalCode);
      expect(lawyer.homeAddress1).toBe(lawyerData.homeAddress1);
      expect(lawyer.homeAddress2).toBe(lawyerData.homeAddress2);
      expect(lawyer.itemsInCustody).toBe(lawyerData.itemsInCustody);
      expect(lawyer.cautions).toBe(lawyerData.cautions);
      expect(lawyer.remarks).toBe(lawyerData.remarks);
    });

    it('should create a lawyer with minimal required fields', async () => {
      const lawyer = await prisma.lawyer.create({
        data: {
          lastName: '佐藤',
          firstName: '花子',
        },
      });

      expect(lawyer).toBeDefined();
      expect(lawyer.lastName).toBe('佐藤');
      expect(lawyer.firstName).toBe('花子');
      expect(lawyer.registrationNumber).toBeNull();
      expect(lawyer.homePhone).toBeNull();
    });

    it('should create a lawyer with unique registration number', async () => {
      const lawyer1 = await prisma.lawyer.create({
        data: {
          lastName: '山田',
          firstName: '一郎',
          registrationNumber: '54321',
        },
      });

      const lawyer2 = await prisma.lawyer.create({
        data: {
          lastName: '鈴木',
          firstName: '次郎',
          registrationNumber: '67890',
        },
      });

      expect(lawyer1.registrationNumber).toBe('54321');
      expect(lawyer2.registrationNumber).toBe('67890');
    });

    it('should fail to create lawyer with duplicate registration number', async () => {
      await prisma.lawyer.create({
        data: {
          lastName: '最初',
          firstName: '弁護士',
          registrationNumber: '11111',
        },
      });

      await expect(
        prisma.lawyer.create({
          data: {
            lastName: '重複',
            firstName: '弁護士',
            registrationNumber: '11111',
          },
        })
      ).rejects.toThrow();
    });

    it('should create a lawyer with office relation', async () => {
      const lawFirm = await prisma.lawFirm.create({
        data: {
          name: 'テスト法律事務所',
        },
      });

      const office = await prisma.lawFirmOffice.create({
        data: {
          lawFirmId: lawFirm.id,
          isPrimary: true,
          officeName: '本店',
          postalCode: '100-0001',
          address1: '東京都千代田区千代田1-1-1',
          phone: '03-1234-5678',
        },
      });

      const lawyer = await prisma.lawyer.create({
        data: {
          lastName: '事務所',
          firstName: '弁護士',
          officeId: office.id,
        },
        include: {
          office: true,
        },
      });

      expect(lawyer.office).toBeDefined();
      expect(lawyer.office?.id).toBe(office.id);
      expect(lawyer.office?.officeName).toBe('本店');
    });
  });

  describe('Read Lawyer', () => {
    let lawyerId: string;

    beforeEach(async () => {
      const lawyer = await prisma.lawyer.create({
        data: {
          lastName: '読取',
          firstName: 'テスト',
          lastNameKana: 'ドクトク',
          firstNameKana: 'テスト',
          honorific: '先生',
          registrationNumber: '99999',
          homePhone: '03-9999-9999',
          homePostalCode: '150-0001',
          homeAddress1: '東京都渋谷区神宮前1-1-1',
          homeAddress2: 'マンション201',
          itemsInCustody: 'テスト書類',
          cautions: 'テスト注意事項',
          remarks: 'テスト備考',
        },
      });
      lawyerId = lawyer.id;
    });

    it('should find lawyer by id', async () => {
      const foundLawyer = await prisma.lawyer.findUnique({
        where: { id: lawyerId },
      });

      expect(foundLawyer).toBeDefined();
      expect(foundLawyer?.id).toBe(lawyerId);
      expect(foundLawyer?.lastName).toBe('読取');
      expect(foundLawyer?.firstName).toBe('テスト');
    });

    it('should find lawyer by registration number', async () => {
      const foundLawyer = await prisma.lawyer.findUnique({
        where: { registrationNumber: '99999' },
      });

      expect(foundLawyer).toBeDefined();
      expect(foundLawyer?.registrationNumber).toBe('99999');
      expect(foundLawyer?.lastName).toBe('読取');
    });

    it('should find all lawyers', async () => {
      const lawyers = await prisma.lawyer.findMany();

      expect(lawyers).toHaveLength(1);
      expect(lawyers[0].lastName).toBe('読取');
    });

    it('should find lawyers by name', async () => {
      const lawyers = await prisma.lawyer.findMany({
        where: {
          lastName: '読取',
        },
      });

      expect(lawyers).toHaveLength(1);
      expect(lawyers[0].firstName).toBe('テスト');
    });

    it('should find lawyers by kana name', async () => {
      const lawyers = await prisma.lawyer.findMany({
        where: {
          lastNameKana: 'ドクトク',
        },
      });

      expect(lawyers).toHaveLength(1);
      expect(lawyers[0].lastName).toBe('読取');
    });

    it('should return null for non-existent lawyer', async () => {
      const foundLawyer = await prisma.lawyer.findUnique({
        where: { id: 'non-existent-id' },
      });

      expect(foundLawyer).toBeNull();
    });
  });

  describe('Update Lawyer', () => {
    let lawyerId: string;

    beforeEach(async () => {
      const lawyer = await prisma.lawyer.create({
        data: {
          lastName: '更新前',
          firstName: '名前',
          registrationNumber: '88888',
          homePhone: '03-8888-8888',
        },
      });
      lawyerId = lawyer.id;
    });

    it('should update lawyer name', async () => {
      const updatedLawyer = await prisma.lawyer.update({
        where: { id: lawyerId },
        data: {
          lastName: '更新後',
          firstName: '名前',
        },
      });

      expect(updatedLawyer.lastName).toBe('更新後');
      expect(updatedLawyer.firstName).toBe('名前');
      expect(updatedLawyer.registrationNumber).toBe('88888');
    });

    it('should update lawyer kana name', async () => {
      const updatedLawyer = await prisma.lawyer.update({
        where: { id: lawyerId },
        data: {
          lastNameKana: 'コウシンゴ',
          firstNameKana: 'ナマエ',
        },
      });

      expect(updatedLawyer.lastNameKana).toBe('コウシンゴ');
      expect(updatedLawyer.firstNameKana).toBe('ナマエ');
    });

    it('should update lawyer registration number', async () => {
      const updatedLawyer = await prisma.lawyer.update({
        where: { id: lawyerId },
        data: {
          registrationNumber: '77777',
        },
      });

      expect(updatedLawyer.registrationNumber).toBe('77777');
    });

    it('should update lawyer contact info', async () => {
      const updatedLawyer = await prisma.lawyer.update({
        where: { id: lawyerId },
        data: {
          homePhone: '03-7777-7777',
          homePostalCode: '200-0001',
          homeAddress1: '神奈川県横浜市西区みなとみらい1-1-1',
          homeAddress2: 'タワーA 1001号室',
        },
      });

      expect(updatedLawyer.homePhone).toBe('03-7777-7777');
      expect(updatedLawyer.homePostalCode).toBe('200-0001');
      expect(updatedLawyer.homeAddress1).toBe('神奈川県横浜市西区みなとみらい1-1-1');
      expect(updatedLawyer.homeAddress2).toBe('タワーA 1001号室');
    });

    it('should update lawyer additional info', async () => {
      const updatedLawyer = await prisma.lawyer.update({
        where: { id: lawyerId },
        data: {
          itemsInCustody: '更新された書類',
          cautions: '更新された注意事項',
          remarks: '更新された備考',
        },
      });

      expect(updatedLawyer.itemsInCustody).toBe('更新された書類');
      expect(updatedLawyer.cautions).toBe('更新された注意事項');
      expect(updatedLawyer.remarks).toBe('更新された備考');
    });

    it('should update multiple fields', async () => {
      const updatedLawyer = await prisma.lawyer.update({
        where: { id: lawyerId },
        data: {
          lastName: '複数更新',
          firstName: 'テスト',
          registrationNumber: '66666',
          homePhone: '03-6666-6666',
        },
      });

      expect(updatedLawyer.lastName).toBe('複数更新');
      expect(updatedLawyer.firstName).toBe('テスト');
      expect(updatedLawyer.registrationNumber).toBe('66666');
      expect(updatedLawyer.homePhone).toBe('03-6666-6666');
    });

    it('should fail to update non-existent lawyer', async () => {
      await expect(
        prisma.lawyer.update({
          where: { id: 'non-existent-id' },
          data: { lastName: '更新' },
        })
      ).rejects.toThrow();
    });

    it('should fail to update registration number to existing one', async () => {
      await prisma.lawyer.create({
        data: {
          lastName: '別の弁護士',
          firstName: '名前',
          registrationNumber: '55555',
        },
      });

      await expect(
        prisma.lawyer.update({
          where: { id: lawyerId },
          data: { registrationNumber: '55555' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Delete Lawyer', () => {
    let lawyerId: string;

    beforeEach(async () => {
      const lawyer = await prisma.lawyer.create({
        data: {
          lastName: '削除',
          firstName: 'テスト',
          registrationNumber: '44444',
        },
      });
      lawyerId = lawyer.id;
    });

    it('should delete lawyer by id', async () => {
      const deletedLawyer = await prisma.lawyer.delete({
        where: { id: lawyerId },
      });

      expect(deletedLawyer.id).toBe(lawyerId);
      expect(deletedLawyer.lastName).toBe('削除');

      const foundLawyer = await prisma.lawyer.findUnique({
        where: { id: lawyerId },
      });
      expect(foundLawyer).toBeNull();
    });

    it('should fail to delete non-existent lawyer', async () => {
      await expect(
        prisma.lawyer.delete({
          where: { id: 'non-existent-id' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Lawyer Relations', () => {
    it('should create lawyer with office relation', async () => {
      const lawFirm = await prisma.lawFirm.create({
        data: {
          name: '関係テスト法律事務所',
        },
      });

      const office = await prisma.lawFirmOffice.create({
        data: {
          lawFirmId: lawFirm.id,
          isPrimary: true,
          officeName: '本店',
          postalCode: '100-0001',
          address1: '東京都千代田区千代田1-1-1',
          phone: '03-1234-5678',
        },
      });

      const lawyer = await prisma.lawyer.create({
        data: {
          lastName: '関係',
          firstName: 'テスト',
          officeId: office.id,
        },
        include: {
          office: {
            include: {
              lawFirm: true,
            },
          },
        },
      });

      expect(lawyer.office).toBeDefined();
      expect(lawyer.office?.officeName).toBe('本店');
      expect(lawyer.office?.lawFirm.name).toBe('関係テスト法律事務所');
    });

    it('should find office with lawyers', async () => {
      const lawFirm = await prisma.lawFirm.create({
        data: {
          name: '弁護士一覧テスト事務所',
        },
      });

      const office = await prisma.lawFirmOffice.create({
        data: {
          lawFirmId: lawFirm.id,
          isPrimary: true,
          officeName: '本店',
        },
      });

      await prisma.lawyer.createMany({
        data: [
          {
            lastName: '弁護士1',
            firstName: '名前',
            officeId: office.id,
          },
          {
            lastName: '弁護士2',
            firstName: '名前',
            officeId: office.id,
          },
        ],
      });

      const officeWithLawyers = await prisma.lawFirmOffice.findUnique({
        where: { id: office.id },
        include: {
          lawyers: true,
        },
      });

      expect(officeWithLawyers?.lawyers).toHaveLength(2);
      expect(officeWithLawyers?.lawyers[0].lastName).toBe('弁護士1');
      expect(officeWithLawyers?.lawyers[1].lastName).toBe('弁護士2');
    });
  });
});
