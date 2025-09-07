import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateLawFirmOfficeData {
  lawFirmId: string;
  isPrimary?: boolean;
  officeName?: string;
  postalCode?: string;
  address1?: string;
  address2?: string;
  phone?: string;
  fax?: string;
}

export interface UpdateLawFirmOfficeData {
  isPrimary?: boolean;
  officeName?: string;
  postalCode?: string;
  address1?: string;
  address2?: string;
  phone?: string;
  fax?: string;
}

export class LawFirmOfficeService {
  /**
   * 法律事務所オフィスを作成
   */
  static async create(data: CreateLawFirmOfficeData) {
    return await prisma.lawFirmOffice.create({
      data: {
        lawFirmId: data.lawFirmId,
        isPrimary: data.isPrimary || false,
        officeName: data.officeName,
        postalCode: data.postalCode,
        address1: data.address1,
        address2: data.address2,
        phone: data.phone,
        fax: data.fax,
      },
      include: {
        lawFirm: true,
        lawyers: true,
      },
    });
  }

  /**
   * IDで法律事務所オフィスを取得
   */
  static async findById(id: string) {
    return await prisma.lawFirmOffice.findUnique({
      where: { id },
      include: {
        lawFirm: true,
        lawyers: true,
      },
    });
  }

  /**
   * 法律事務所IDでオフィスを取得
   */
  static async findByLawFirmId(lawFirmId: string) {
    return await prisma.lawFirmOffice.findMany({
      where: { lawFirmId },
      include: {
        lawFirm: true,
        lawyers: true,
      },
      orderBy: {
        isPrimary: 'desc',
      },
    });
  }

  /**
   * 本店を取得
   */
  static async findPrimaryOffice(lawFirmId: string) {
    return await prisma.lawFirmOffice.findFirst({
      where: {
        lawFirmId,
        isPrimary: true,
      },
      include: {
        lawFirm: true,
        lawyers: true,
      },
    });
  }

  /**
   * 支店を取得
   */
  static async findBranchOffices(lawFirmId: string) {
    return await prisma.lawFirmOffice.findMany({
      where: {
        lawFirmId,
        isPrimary: false,
      },
      include: {
        lawFirm: true,
        lawyers: true,
      },
      orderBy: {
        officeName: 'asc',
      },
    });
  }

  /**
   * 全法律事務所オフィスを取得
   */
  static async findAll() {
    return await prisma.lawFirmOffice.findMany({
      include: {
        lawFirm: true,
        lawyers: true,
      },
      orderBy: [
        { lawFirm: { name: 'asc' } },
        { isPrimary: 'desc' },
        { officeName: 'asc' },
      ],
    });
  }

  /**
   * 法律事務所オフィスを更新
   */
  static async update(id: string, data: UpdateLawFirmOfficeData) {
    return await prisma.lawFirmOffice.update({
      where: { id },
      data,
      include: {
        lawFirm: true,
        lawyers: true,
      },
    });
  }

  /**
   * 法律事務所オフィスを削除
   */
  static async delete(id: string) {
    return await prisma.lawFirmOffice.delete({
      where: { id },
    });
  }

  /**
   * 法律事務所オフィスが存在するかチェック
   */
  static async exists(id: string): Promise<boolean> {
    const office = await prisma.lawFirmOffice.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!office;
  }

  /**
   * 法律事務所のオフィス数を取得
   */
  static async countByLawFirm(lawFirmId: string) {
    return await prisma.lawFirmOffice.count({
      where: { lawFirmId },
    });
  }

  /**
   * 全法律事務所オフィス数を取得
   */
  static async count() {
    return await prisma.lawFirmOffice.count();
  }

  /**
   * 本店数を取得
   */
  static async countPrimaryOffices() {
    return await prisma.lawFirmOffice.count({
      where: { isPrimary: true },
    });
  }

  /**
   * 支店数を取得
   */
  static async countBranchOffices() {
    return await prisma.lawFirmOffice.count({
      where: { isPrimary: false },
    });
  }
}
