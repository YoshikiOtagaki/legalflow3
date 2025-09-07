import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateCourtDivisionData {
  name: string;
  type: string;
  phone?: string;
  fax?: string;
  courthouseId: string;
  parentId?: string;
}

export interface UpdateCourtDivisionData {
  name?: string;
  type?: string;
  phone?: string;
  fax?: string;
  parentId?: string;
}

export class CourtDivisionService {
  /**
   * 裁判所部局を作成
   */
  static async create(data: CreateCourtDivisionData) {
    return await prisma.courtDivision.create({
      data: {
        name: data.name,
        type: data.type,
        phone: data.phone,
        fax: data.fax,
        courthouseId: data.courthouseId,
        parentId: data.parentId,
      },
      include: {
        courthouse: true,
        parent: true,
        children: true,
        personnel: true,
      },
    });
  }

  /**
   * IDで裁判所部局を取得
   */
  static async findById(id: string) {
    return await prisma.courtDivision.findUnique({
      where: { id },
      include: {
        courthouse: true,
        parent: true,
        children: true,
        personnel: true,
      },
    });
  }

  /**
   * 裁判所IDで部局を取得
   */
  static async findByCourthouseId(courthouseId: string) {
    return await prisma.courtDivision.findMany({
      where: { courthouseId },
      include: {
        courthouse: true,
        parent: true,
        children: true,
        personnel: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * 親部局IDで子部局を取得
   */
  static async findByParentId(parentId: string) {
    return await prisma.courtDivision.findMany({
      where: { parentId },
      include: {
        courthouse: true,
        parent: true,
        children: true,
        personnel: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * ルート部局（親なし）を取得
   */
  static async findRootDivisions(courthouseId?: string) {
    return await prisma.courtDivision.findMany({
      where: {
        parentId: null,
        ...(courthouseId && { courthouseId }),
      },
      include: {
        courthouse: true,
        children: true,
        personnel: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * タイプ別部局を取得
   */
  static async findByType(type: string, courthouseId?: string) {
    return await prisma.courtDivision.findMany({
      where: {
        type,
        ...(courthouseId && { courthouseId }),
      },
      include: {
        courthouse: true,
        parent: true,
        children: true,
        personnel: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * 名前で部局を検索
   */
  static async findByName(name: string, courthouseId?: string) {
    return await prisma.courtDivision.findMany({
      where: {
        name: { contains: name },
        ...(courthouseId && { courthouseId }),
      },
      include: {
        courthouse: true,
        parent: true,
        children: true,
        personnel: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * 全裁判所部局を取得
   */
  static async findAll() {
    return await prisma.courtDivision.findMany({
      include: {
        courthouse: true,
        parent: true,
        children: true,
        personnel: true,
      },
      orderBy: [
        { courthouse: { name: 'asc' } },
        { name: 'asc' },
      ],
    });
  }

  /**
   * 裁判所部局を更新
   */
  static async update(id: string, data: UpdateCourtDivisionData) {
    return await prisma.courtDivision.update({
      where: { id },
      data,
      include: {
        courthouse: true,
        parent: true,
        children: true,
        personnel: true,
      },
    });
  }

  /**
   * 裁判所部局を削除
   */
  static async delete(id: string) {
    return await prisma.courtDivision.delete({
      where: { id },
    });
  }

  /**
   * 裁判所部局が存在するかチェック
   */
  static async exists(id: string): Promise<boolean> {
    const division = await prisma.courtDivision.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!division;
  }

  /**
   * 裁判所の部局数を取得
   */
  static async countByCourthouse(courthouseId: string) {
    return await prisma.courtDivision.count({
      where: { courthouseId },
    });
  }

  /**
   * 全裁判所部局数を取得
   */
  static async count() {
    return await prisma.courtDivision.count();
  }

  /**
   * タイプ別部局数を取得
   */
  static async countByType(type: string) {
    return await prisma.courtDivision.count({
      where: { type },
    });
  }

  /**
   * ルート部局数を取得
   */
  static async countRootDivisions() {
    return await prisma.courtDivision.count({
      where: { parentId: null },
    });
  }
}
