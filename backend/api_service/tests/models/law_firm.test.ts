import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '../setup';
import { cleanupDatabase } from '../lib/db-test-utils';

describe('LawFirm and LawFirmOffice Model CRUD Operations', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(cleanupDatabase);

  afterEach(cleanupDatabase);

  describe('Create LawFirm', () => {
    it('should create a new law firm with required fields', async () => {
      const lawFirmData = {
        name: 'テスト法律事務所',
      };

      const lawFirm = await prisma.lawFirm.create({
        data: lawFirmData,
      });

      expect(lawFirm).toBeDefined();
      expect(lawFirm.id).toBeDefined();
      expect(lawFirm.name).toBe(lawFirmData.name);
    });

    it('should create a law firm with offices', async () => {
      const lawFirm = await prisma.lawFirm.create({
        data: {
          name: '複数事務所法律事務所',
          offices: {
            create: [
              {
                isPrimary: true,
                officeName: '本店',
                postalCode: '100-0001',
                address1: '東京都千代田区千代田1-1-1',
                phone: '03-1234-5678',
                fax: '03-1234-5679',
              },
              {
                isPrimary: false,
                officeName: '支店',
                postalCode: '150-0001',
                address1: '東京都渋谷区神宮前1-1-1',
                phone: '03-9876-5432',
                fax: '03-9876-5433',
              },
            ],
          },
        },
        include: {
          offices: true,
        },
      });

      expect(lawFirm).toBeDefined();
      expect(lawFirm.name).toBe('複数事務所法律事務所');
      expect(lawFirm.offices).toHaveLength(2);
      expect(lawFirm.offices[0].isPrimary).toBe(true);
      expect(lawFirm.offices[1].isPrimary).toBe(false);
    });
  });

  describe('Read LawFirm', () => {
    let lawFirmId: string;

    beforeEach(async () => {
      const lawFirm = await prisma.lawFirm.create({
        data: {
          name: '読取テスト法律事務所',
        },
      });
      lawFirmId = lawFirm.id;
    });

    it('should find law firm by id', async () => {
      const foundLawFirm = await prisma.lawFirm.findUnique({
        where: { id: lawFirmId },
      });

      expect(foundLawFirm).toBeDefined();
      expect(foundLawFirm?.id).toBe(lawFirmId);
      expect(foundLawFirm?.name).toBe('読取テスト法律事務所');
    });

    it('should find all law firms', async () => {
      const lawFirms = await prisma.lawFirm.findMany();

      expect(lawFirms).toHaveLength(1);
      expect(lawFirms[0].name).toBe('読取テスト法律事務所');
    });

    it('should find law firms by name', async () => {
      const lawFirms = await prisma.lawFirm.findMany({
        where: {
          name: {
            contains: '読取',
          },
        },
      });

      expect(lawFirms).toHaveLength(1);
      expect(lawFirms[0].name).toBe('読取テスト法律事務所');
    });

    it('should return null for non-existent law firm', async () => {
      const foundLawFirm = await prisma.lawFirm.findUnique({
        where: { id: 'non-existent-id' },
      });

      expect(foundLawFirm).toBeNull();
    });
  });

  describe('Update LawFirm', () => {
    let lawFirmId: string;

    beforeEach(async () => {
      const lawFirm = await prisma.lawFirm.create({
        data: {
          name: '更新前法律事務所',
        },
      });
      lawFirmId = lawFirm.id;
    });

    it('should update law firm name', async () => {
      const updatedLawFirm = await prisma.lawFirm.update({
        where: { id: lawFirmId },
        data: {
          name: '更新後法律事務所',
        },
      });

      expect(updatedLawFirm.name).toBe('更新後法律事務所');
    });

    it('should fail to update non-existent law firm', async () => {
      await expect(
        prisma.lawFirm.update({
          where: { id: 'non-existent-id' },
          data: { name: '更新' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Delete LawFirm', () => {
    let lawFirmId: string;

    beforeEach(async () => {
      const lawFirm = await prisma.lawFirm.create({
        data: {
          name: '削除テスト法律事務所',
        },
      });
      lawFirmId = lawFirm.id;
    });

    it('should delete law firm by id', async () => {
      const deletedLawFirm = await prisma.lawFirm.delete({
        where: { id: lawFirmId },
      });

      expect(deletedLawFirm.id).toBe(lawFirmId);
      expect(deletedLawFirm.name).toBe('削除テスト法律事務所');

      const foundLawFirm = await prisma.lawFirm.findUnique({
        where: { id: lawFirmId },
      });
      expect(foundLawFirm).toBeNull();
    });

    it('should fail to delete non-existent law firm', async () => {
      await expect(
        prisma.lawFirm.delete({
          where: { id: 'non-existent-id' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Create LawFirmOffice', () => {
    let lawFirmId: string;

    beforeEach(async () => {
      const lawFirm = await prisma.lawFirm.create({
        data: {
          name: '事務所テスト法律事務所',
        },
      });
      lawFirmId = lawFirm.id;
    });

    it('should create a new law firm office with required fields', async () => {
      const officeData = {
        lawFirmId: lawFirmId,
        isPrimary: true,
        officeName: '本店',
        postalCode: '100-0001',
        address1: '東京都千代田区千代田1-1-1',
        address2: 'ビル10階',
        phone: '03-1234-5678',
        fax: '03-1234-5679',
      };

      const office = await prisma.lawFirmOffice.create({
        data: officeData,
      });

      expect(office).toBeDefined();
      expect(office.id).toBeDefined();
      expect(office.lawFirmId).toBe(lawFirmId);
      expect(office.isPrimary).toBe(officeData.isPrimary);
      expect(office.officeName).toBe(officeData.officeName);
      expect(office.postalCode).toBe(officeData.postalCode);
      expect(office.address1).toBe(officeData.address1);
      expect(office.address2).toBe(officeData.address2);
      expect(office.phone).toBe(officeData.phone);
      expect(office.fax).toBe(officeData.fax);
    });

    it('should create a law firm office with default values', async () => {
      const office = await prisma.lawFirmOffice.create({
        data: {
          lawFirmId: lawFirmId,
          officeName: '支店',
        },
      });

      expect(office.isPrimary).toBe(false);
      expect(office.officeName).toBe('支店');
    });

    it('should fail to create office without law firm', async () => {
      await expect(
        prisma.lawFirmOffice.create({
          data: {
            lawFirmId: 'non-existent-law-firm-id',
            officeName: '支店',
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Read LawFirmOffice', () => {
    let officeId: string;

    beforeEach(async () => {
      const lawFirm = await prisma.lawFirm.create({
        data: {
          name: '事務所読取テスト法律事務所',
        },
      });

      const office = await prisma.lawFirmOffice.create({
        data: {
          lawFirmId: lawFirm.id,
          isPrimary: true,
          officeName: '本店',
          postalCode: '150-0001',
          address1: '東京都渋谷区神宮前1-1-1',
          phone: '03-9876-5432',
        },
      });
      officeId = office.id;
    });

    it('should find office by id', async () => {
      const foundOffice = await prisma.lawFirmOffice.findUnique({
        where: { id: officeId },
      });

      expect(foundOffice).toBeDefined();
      expect(foundOffice?.id).toBe(officeId);
      expect(foundOffice?.officeName).toBe('本店');
    });

    it('should find office with law firm relation', async () => {
      const foundOffice = await prisma.lawFirmOffice.findUnique({
        where: { id: officeId },
        include: {
          lawFirm: true,
        },
      });

      expect(foundOffice?.lawFirm).toBeDefined();
      expect(foundOffice?.lawFirm.name).toBe('事務所読取テスト法律事務所');
    });

    it('should find all offices', async () => {
      const offices = await prisma.lawFirmOffice.findMany();

      expect(offices).toHaveLength(1);
      expect(offices[0].officeName).toBe('本店');
    });

    it('should find offices by primary status', async () => {
      const primaryOffices = await prisma.lawFirmOffice.findMany({
        where: { isPrimary: true },
      });

      const nonPrimaryOffices = await prisma.lawFirmOffice.findMany({
        where: { isPrimary: false },
      });

      expect(primaryOffices).toHaveLength(1);
      expect(nonPrimaryOffices).toHaveLength(0);
    });

    it('should return null for non-existent office', async () => {
      const foundOffice = await prisma.lawFirmOffice.findUnique({
        where: { id: 'non-existent-id' },
      });

      expect(foundOffice).toBeNull();
    });
  });

  describe('Update LawFirmOffice', () => {
    let officeId: string;

    beforeEach(async () => {
      const lawFirm = await prisma.lawFirm.create({
        data: {
          name: '事務所更新テスト法律事務所',
        },
      });

      const office = await prisma.lawFirmOffice.create({
        data: {
          lawFirmId: lawFirm.id,
          isPrimary: false,
          officeName: '更新前支店',
          phone: '03-1111-1111',
        },
      });
      officeId = office.id;
    });

    it('should update office name', async () => {
      const updatedOffice = await prisma.lawFirmOffice.update({
        where: { id: officeId },
        data: {
          officeName: '更新後支店',
        },
      });

      expect(updatedOffice.officeName).toBe('更新後支店');
      expect(updatedOffice.isPrimary).toBe(false);
    });

    it('should update office primary status', async () => {
      const updatedOffice = await prisma.lawFirmOffice.update({
        where: { id: officeId },
        data: {
          isPrimary: true,
        },
      });

      expect(updatedOffice.isPrimary).toBe(true);
      expect(updatedOffice.officeName).toBe('更新前支店');
    });

    it('should update office contact info', async () => {
      const updatedOffice = await prisma.lawFirmOffice.update({
        where: { id: officeId },
        data: {
          phone: '03-2222-2222',
          fax: '03-2222-2223',
          postalCode: '200-0001',
          address1: '神奈川県横浜市西区みなとみらい1-1-1',
          address2: 'タワーA 1001号室',
        },
      });

      expect(updatedOffice.phone).toBe('03-2222-2222');
      expect(updatedOffice.fax).toBe('03-2222-2223');
      expect(updatedOffice.postalCode).toBe('200-0001');
      expect(updatedOffice.address1).toBe('神奈川県横浜市西区みなとみらい1-1-1');
      expect(updatedOffice.address2).toBe('タワーA 1001号室');
    });

    it('should fail to update non-existent office', async () => {
      await expect(
        prisma.lawFirmOffice.update({
          where: { id: 'non-existent-id' },
          data: { officeName: '更新' },
        })
      ).rejects.toThrow();
    });
  });

  describe('Delete LawFirmOffice', () => {
    let officeId: string;

    beforeEach(async () => {
      const lawFirm = await prisma.lawFirm.create({
        data: {
          name: '事務所削除テスト法律事務所',
        },
      });

      const office = await prisma.lawFirmOffice.create({
        data: {
          lawFirmId: lawFirm.id,
          isPrimary: false,
          officeName: '削除テスト支店',
        },
      });
      officeId = office.id;
    });

    it('should delete office by id', async () => {
      const deletedOffice = await prisma.lawFirmOffice.delete({
        where: { id: officeId },
      });

      expect(deletedOffice.id).toBe(officeId);
      expect(deletedOffice.officeName).toBe('削除テスト支店');

      const foundOffice = await prisma.lawFirmOffice.findUnique({
        where: { id: officeId },
      });
      expect(foundOffice).toBeNull();
    });

    it('should fail to delete non-existent office', async () => {
      await expect(
        prisma.lawFirmOffice.delete({
          where: { id: 'non-existent-id' },
        })
      ).rejects.toThrow();
    });
  });

  describe('LawFirm and Office Relations', () => {
    it('should create law firm with multiple offices', async () => {
      const lawFirm = await prisma.lawFirm.create({
        data: {
          name: '複数事務所関係テスト法律事務所',
          offices: {
            create: [
              {
                isPrimary: true,
                officeName: '本店',
                postalCode: '100-0001',
                address1: '東京都千代田区千代田1-1-1',
                phone: '03-1234-5678',
              },
              {
                isPrimary: false,
                officeName: '大阪支店',
                postalCode: '530-0001',
                address1: '大阪府大阪市北区梅田1-1-1',
                phone: '06-1234-5678',
              },
              {
                isPrimary: false,
                officeName: '名古屋支店',
                postalCode: '460-0001',
                address1: '愛知県名古屋市中区三の丸1-1-1',
                phone: '052-1234-5678',
              },
            ],
          },
        },
        include: {
          offices: true,
        },
      });

      expect(lawFirm.offices).toHaveLength(3);
      expect(lawFirm.offices.filter(o => o.isPrimary)).toHaveLength(1);
      expect(lawFirm.offices.filter(o => !o.isPrimary)).toHaveLength(2);
    });

    it('should find law firm with offices and lawyers', async () => {
      const lawFirm = await prisma.lawFirm.create({
        data: {
          name: '弁護士関係テスト法律事務所',
          offices: {
            create: {
              isPrimary: true,
              officeName: '本店',
              lawyers: {
                create: [
                  {
                    lastName: '弁護士1',
                    firstName: '名前',
                  },
                  {
                    lastName: '弁護士2',
                    firstName: '名前',
                  },
                ],
              },
            },
          },
        },
        include: {
          offices: {
            include: {
              lawyers: true,
            },
          },
        },
      });

      expect(lawFirm.offices).toHaveLength(1);
      expect(lawFirm.offices[0].lawyers).toHaveLength(2);
      expect(lawFirm.offices[0].lawyers[0].lastName).toBe('弁護士1');
      expect(lawFirm.offices[0].lawyers[1].lastName).toBe('弁護士2');
    });
  });
});
