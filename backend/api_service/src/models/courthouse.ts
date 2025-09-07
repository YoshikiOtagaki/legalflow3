import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateCourthouseData {
  name: string;
  postalCode?: string;
  address1?: string;
  address2?: string;
  phone?: string;
}

export interface UpdateCourthouseData {
  name?: string;
  postalCode?: string;
  address1?: string;
  address2?: string;
  phone?: string;
}

export class CourthouseService {
  /**
   * 裁判所を作成
   */
  static async create(data: CreateCourthouseData) {
    return await prisma.courthouse.create({
      data: {
        name: data.name,
        postalCode: data.postalCode,
        address1: data.address1,
        address2: data.address2,
        phone: data.phone,
      },
      include: {
        divisions: {
          include: {
            personnel: true,
          },
        },
        lowerJurisdictionRules: {
          include: {
            superiorCourthouse: true,
            caseCategory: true,
          },
        },
        superiorJurisdictionRules: {
          include: {
            lowerCourthouse: true,
            caseCategory: true,
          },
        },
      },
    });
  }

  /**
   * IDで裁判所を取得
   */
  static async findById(id: string) {
    return await prisma.courthouse.findUnique({
      where: { id },
      include: {
        divisions: {
          include: {
            personnel: true,
          },
        },
        lowerJurisdictionRules: {
          include: {
            superiorCourthouse: true,
            caseCategory: true,
          },
        },
        superiorJurisdictionRules: {
          include: {
            lowerCourthouse: true,
            caseCategory: true,
          },
        },
      },
    });
  }

  /**
   * 名前で裁判所を検索
   */
  static async findByName(name: string) {
    return await prisma.courthouse.findMany({
      where: {
        name: { contains: name },
      },
      include: {
        divisions: {
          include: {
            personnel: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * 全裁判所を取得
   */
  static async findAll() {
    return await prisma.courthouse.findMany({
      include: {
        divisions: {
          include: {
            personnel: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * 裁判所を更新
   */
  static async update(id: string, data: UpdateCourthouseData) {
    return await prisma.courthouse.update({
      where: { id },
      data,
      include: {
        divisions: {
          include: {
            personnel: true,
          },
        },
        lowerJurisdictionRules: {
          include: {
            superiorCourthouse: true,
            caseCategory: true,
          },
        },
        superiorJurisdictionRules: {
          include: {
            lowerCourthouse: true,
            caseCategory: true,
          },
        },
      },
    });
  }

  /**
   * 裁判所を削除
   */
  static async delete(id: string) {
    return await prisma.courthouse.delete({
      where: { id },
    });
  }

  /**
   * 裁判所が存在するかチェック
   */
  static async exists(id: string): Promise<boolean> {
    const courthouse = await prisma.courthouse.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!courthouse;
  }

  /**
   * 名前が既に使用されているかチェック
   */
  static async isNameTaken(name: string): Promise<boolean> {
    const courthouse = await prisma.courthouse.findUnique({
      where: { name },
      select: { id: true },
    });
    return !!courthouse;
  }

  /**
   * 裁判所数を取得
   */
  static async count() {
    return await prisma.courthouse.count();
  }
}
