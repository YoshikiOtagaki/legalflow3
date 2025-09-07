import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateJurisdictionRuleData {
  lowerCourthouseId: string;
  superiorCourthouseId: string;
  caseCategoryId?: string;
}

export interface UpdateJurisdictionRuleData {
  caseCategoryId?: string;
}

export class JurisdictionRuleService {
  /**
   * 管轄ルールを作成
   */
  static async create(data: CreateJurisdictionRuleData) {
    return await prisma.jurisdictionRule.create({
      data: {
        lowerCourthouseId: data.lowerCourthouseId,
        superiorCourthouseId: data.superiorCourthouseId,
        caseCategoryId: data.caseCategoryId,
      },
      include: {
        lowerCourthouse: true,
        superiorCourthouse: true,
        caseCategory: true,
      },
    });
  }

  /**
   * IDで管轄ルールを取得
   */
  static async findById(id: string) {
    return await prisma.jurisdictionRule.findUnique({
      where: { id },
      include: {
        lowerCourthouse: true,
        superiorCourthouse: true,
        caseCategory: true,
      },
    });
  }

  /**
   * 下級裁判所IDで管轄ルールを取得
   */
  static async findByLowerCourthouseId(lowerCourthouseId: string) {
    return await prisma.jurisdictionRule.findMany({
      where: { lowerCourthouseId },
      include: {
        lowerCourthouse: true,
        superiorCourthouse: true,
        caseCategory: true,
      },
      orderBy: {
        superiorCourthouse: { name: 'asc' },
      },
    });
  }

  /**
   * 上級裁判所IDで管轄ルールを取得
   */
  static async findBySuperiorCourthouseId(superiorCourthouseId: string) {
    return await prisma.jurisdictionRule.findMany({
      where: { superiorCourthouseId },
      include: {
        lowerCourthouse: true,
        superiorCourthouse: true,
        caseCategory: true,
      },
      orderBy: {
        lowerCourthouse: { name: 'asc' },
      },
    });
  }

  /**
   * 事件カテゴリIDで管轄ルールを取得
   */
  static async findByCaseCategoryId(caseCategoryId: string) {
    return await prisma.jurisdictionRule.findMany({
      where: { caseCategoryId },
      include: {
        lowerCourthouse: true,
        superiorCourthouse: true,
        caseCategory: true,
      },
      orderBy: {
        lowerCourthouse: { name: 'asc' },
      },
    });
  }

  /**
   * 特定の下級・上級裁判所の管轄ルールを取得
   */
  static async findByCourthouses(lowerCourthouseId: string, superiorCourthouseId: string) {
    return await prisma.jurisdictionRule.findMany({
      where: {
        lowerCourthouseId,
        superiorCourthouseId,
      },
      include: {
        lowerCourthouse: true,
        superiorCourthouse: true,
        caseCategory: true,
      },
    });
  }

  /**
   * 全管轄ルールを取得
   */
  static async findAll() {
    return await prisma.jurisdictionRule.findMany({
      include: {
        lowerCourthouse: true,
        superiorCourthouse: true,
        caseCategory: true,
      },
      orderBy: [
        { lowerCourthouse: { name: 'asc' } },
        { superiorCourthouse: { name: 'asc' } },
      ],
    });
  }

  /**
   * 管轄ルールを更新
   */
  static async update(id: string, data: UpdateJurisdictionRuleData) {
    return await prisma.jurisdictionRule.update({
      where: { id },
      data,
      include: {
        lowerCourthouse: true,
        superiorCourthouse: true,
        caseCategory: true,
      },
    });
  }

  /**
   * 管轄ルールを削除
   */
  static async delete(id: string) {
    return await prisma.jurisdictionRule.delete({
      where: { id },
    });
  }

  /**
   * 管轄ルールが存在するかチェック
   */
  static async exists(id: string): Promise<boolean> {
    const rule = await prisma.jurisdictionRule.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!rule;
  }

  /**
   * 特定の下級・上級裁判所の管轄ルールが存在するかチェック
   */
  static async existsByCourthouses(lowerCourthouseId: string, superiorCourthouseId: string): Promise<boolean> {
    const rule = await prisma.jurisdictionRule.findFirst({
      where: {
        lowerCourthouseId,
        superiorCourthouseId,
      },
      select: { id: true },
    });
    return !!rule;
  }

  /**
   * 管轄ルール数を取得
   */
  static async count() {
    return await prisma.jurisdictionRule.count();
  }

  /**
   * 下級裁判所別管轄ルール数を取得
   */
  static async countByLowerCourthouse(lowerCourthouseId: string) {
    return await prisma.jurisdictionRule.count({
      where: { lowerCourthouseId },
    });
  }

  /**
   * 上級裁判所別管轄ルール数を取得
   */
  static async countBySuperiorCourthouse(superiorCourthouseId: string) {
    return await prisma.jurisdictionRule.count({
      where: { superiorCourthouseId },
    });
  }

  /**
   * 事件カテゴリ別管轄ルール数を取得
   */
  static async countByCaseCategory(caseCategoryId: string) {
    return await prisma.jurisdictionRule.count({
      where: { caseCategoryId },
    });
  }
}
