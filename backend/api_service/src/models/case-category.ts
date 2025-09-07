import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateCaseCategoryData {
  name: string;
  parentCategoryId?: string;
  roleDefinitions: any;
}

export interface UpdateCaseCategoryData {
  name?: string;
  parentCategoryId?: string;
  roleDefinitions?: any;
}

export class CaseCategoryService {
  /**
   * 事件カテゴリを作成
   */
  static async create(data: CreateCaseCategoryData) {
    return await prisma.caseCategory.create({
      data: {
        name: data.name,
        parentCategoryId: data.parentCategoryId,
        roleDefinitions: data.roleDefinitions,
      },
      include: {
        parentCategory: true,
        childCategories: true,
        phases: {
          orderBy: {
            order: 'asc',
          },
        },
        cases: {
          include: {
            assignments: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * IDで事件カテゴリを取得
   */
  static async findById(id: string) {
    return await prisma.caseCategory.findUnique({
      where: { id },
      include: {
        parentCategory: true,
        childCategories: true,
        phases: {
          orderBy: {
            order: 'asc',
          },
        },
        cases: {
          include: {
            assignments: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * 名前で事件カテゴリを取得
   */
  static async findByName(name: string) {
    return await prisma.caseCategory.findUnique({
      where: { name },
      include: {
        parentCategory: true,
        childCategories: true,
        phases: {
          orderBy: {
            order: 'asc',
          },
        },
        cases: {
          include: {
            assignments: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * 名前で事件カテゴリを検索
   */
  static async searchByName(name: string) {
    return await prisma.caseCategory.findMany({
      where: {
        name: { contains: name },
      },
      include: {
        parentCategory: true,
        childCategories: true,
        phases: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * 親カテゴリIDで子カテゴリを取得
   */
  static async findByParentId(parentCategoryId: string) {
    return await prisma.caseCategory.findMany({
      where: { parentCategoryId },
      include: {
        parentCategory: true,
        childCategories: true,
        phases: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * ルートカテゴリ（親なし）を取得
   */
  static async findRootCategories() {
    return await prisma.caseCategory.findMany({
      where: { parentCategoryId: null },
      include: {
        childCategories: true,
        phases: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * 全事件カテゴリを取得
   */
  static async findAll() {
    return await prisma.caseCategory.findMany({
      include: {
        parentCategory: true,
        childCategories: true,
        phases: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * 事件カテゴリを更新
   */
  static async update(id: string, data: UpdateCaseCategoryData) {
    return await prisma.caseCategory.update({
      where: { id },
      data,
      include: {
        parentCategory: true,
        childCategories: true,
        phases: {
          orderBy: {
            order: 'asc',
          },
        },
        cases: {
          include: {
            assignments: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * 事件カテゴリを削除
   */
  static async delete(id: string) {
    return await prisma.caseCategory.delete({
      where: { id },
    });
  }

  /**
   * 事件カテゴリが存在するかチェック
   */
  static async exists(id: string): Promise<boolean> {
    const category = await prisma.caseCategory.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!category;
  }

  /**
   * 名前が既に使用されているかチェック
   */
  static async isNameTaken(name: string): Promise<boolean> {
    const category = await prisma.caseCategory.findUnique({
      where: { name },
      select: { id: true },
    });
    return !!category;
  }

  /**
   * 事件カテゴリ数を取得
   */
  static async count() {
    return await prisma.caseCategory.count();
  }

  /**
   * 親カテゴリ別子カテゴリ数を取得
   */
  static async countByParent(parentCategoryId: string) {
    return await prisma.caseCategory.count({
      where: { parentCategoryId },
    });
  }

  /**
   * ルートカテゴリ数を取得
   */
  static async countRootCategories() {
    return await prisma.caseCategory.count({
      where: { parentCategoryId: null },
    });
  }
}
