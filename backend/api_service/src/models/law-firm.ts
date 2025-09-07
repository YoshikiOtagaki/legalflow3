import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateLawFirmData {
  name: string;
}

export interface UpdateLawFirmData {
  name?: string;
}

export class LawFirmService {
  /**
   * 法律事務所を作成
   */
  static async create(data: CreateLawFirmData) {
    return await prisma.lawFirm.create({
      data: {
        name: data.name,
      },
      include: {
        offices: true,
      },
    });
  }

  /**
   * IDで法律事務所を取得
   */
  static async findById(id: string) {
    return await prisma.lawFirm.findUnique({
      where: { id },
      include: {
        offices: {
          include: {
            lawyers: true,
          },
        },
      },
    });
  }

  /**
   * 名前で法律事務所を取得
   */
  static async findByName(name: string) {
    return await prisma.lawFirm.findMany({
      where: {
        name: { contains: name },
      },
      include: {
        offices: {
          include: {
            lawyers: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * 全法律事務所を取得
   */
  static async findAll() {
    return await prisma.lawFirm.findMany({
      include: {
        offices: {
          include: {
            lawyers: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * 法律事務所を更新
   */
  static async update(id: string, data: UpdateLawFirmData) {
    return await prisma.lawFirm.update({
      where: { id },
      data,
      include: {
        offices: {
          include: {
            lawyers: true,
          },
        },
      },
    });
  }

  /**
   * 法律事務所を削除
   */
  static async delete(id: string) {
    return await prisma.lawFirm.delete({
      where: { id },
    });
  }

  /**
   * 法律事務所が存在するかチェック
   */
  static async exists(id: string): Promise<boolean> {
    const lawFirm = await prisma.lawFirm.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!lawFirm;
  }

  /**
   * 名前が既に使用されているかチェック
   */
  static async isNameTaken(name: string): Promise<boolean> {
    const lawFirm = await prisma.lawFirm.findUnique({
      where: { name },
      select: { id: true },
    });
    return !!lawFirm;
  }

  /**
   * 法律事務所数を取得
   */
  static async count() {
    return await prisma.lawFirm.count();
  }
}
