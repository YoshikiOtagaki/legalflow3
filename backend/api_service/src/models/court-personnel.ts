import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateCourtPersonnelData {
  name: string;
  email?: string;
  role: string;
  courtDivisionId: string;
}

export interface UpdateCourtPersonnelData {
  name?: string;
  email?: string;
  role?: string;
}

export class CourtPersonnelService {
  /**
   * 裁判所職員を作成
   */
  static async create(data: CreateCourtPersonnelData) {
    return await prisma.courtPersonnel.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        courtDivisionId: data.courtDivisionId,
      },
      include: {
        courtDivision: {
          include: {
            courthouse: true,
          },
        },
      },
    });
  }

  /**
   * IDで裁判所職員を取得
   */
  static async findById(id: string) {
    return await prisma.courtPersonnel.findUnique({
      where: { id },
      include: {
        courtDivision: {
          include: {
            courthouse: true,
          },
        },
      },
    });
  }

  /**
   * 部局IDで職員を取得
   */
  static async findByCourtDivisionId(courtDivisionId: string) {
    return await prisma.courtPersonnel.findMany({
      where: { courtDivisionId },
      include: {
        courtDivision: {
          include: {
            courthouse: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * 裁判所IDで職員を取得
   */
  static async findByCourthouseId(courthouseId: string) {
    return await prisma.courtPersonnel.findMany({
      where: {
        courtDivision: {
          courthouseId,
        },
      },
      include: {
        courtDivision: {
          include: {
            courthouse: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * ロール別職員を取得
   */
  static async findByRole(role: string, courtDivisionId?: string) {
    return await prisma.courtPersonnel.findMany({
      where: {
        role,
        ...(courtDivisionId && { courtDivisionId }),
      },
      include: {
        courtDivision: {
          include: {
            courthouse: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * 名前で職員を検索
   */
  static async findByName(name: string, courtDivisionId?: string) {
    return await prisma.courtPersonnel.findMany({
      where: {
        name: { contains: name },
        ...(courtDivisionId && { courtDivisionId }),
      },
      include: {
        courtDivision: {
          include: {
            courthouse: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * メールアドレスで職員を検索
   */
  static async findByEmail(email: string) {
    return await prisma.courtPersonnel.findMany({
      where: {
        email: { contains: email },
      },
      include: {
        courtDivision: {
          include: {
            courthouse: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * 全裁判所職員を取得
   */
  static async findAll() {
    return await prisma.courtPersonnel.findMany({
      include: {
        courtDivision: {
          include: {
            courthouse: true,
          },
        },
      },
      orderBy: [
        { courtDivision: { courthouse: { name: 'asc' } } },
        { courtDivision: { name: 'asc' } },
        { name: 'asc' },
      ],
    });
  }

  /**
   * 裁判所職員を更新
   */
  static async update(id: string, data: UpdateCourtPersonnelData) {
    return await prisma.courtPersonnel.update({
      where: { id },
      data,
      include: {
        courtDivision: {
          include: {
            courthouse: true,
          },
        },
      },
    });
  }

  /**
   * 裁判所職員を削除
   */
  static async delete(id: string) {
    return await prisma.courtPersonnel.delete({
      where: { id },
    });
  }

  /**
   * 裁判所職員が存在するかチェック
   */
  static async exists(id: string): Promise<boolean> {
    const personnel = await prisma.courtPersonnel.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!personnel;
  }

  /**
   * 部局の職員数を取得
   */
  static async countByCourtDivision(courtDivisionId: string) {
    return await prisma.courtPersonnel.count({
      where: { courtDivisionId },
    });
  }

  /**
   * 全裁判所職員数を取得
   */
  static async count() {
    return await prisma.courtPersonnel.count();
  }

  /**
   * ロール別職員数を取得
   */
  static async countByRole(role: string) {
    return await prisma.courtPersonnel.count({
      where: { role },
    });
  }

  /**
   * 裁判所別職員数を取得
   */
  static async countByCourthouse(courthouseId: string) {
    return await prisma.courtPersonnel.count({
      where: {
        courtDivision: {
          courthouseId,
        },
      },
    });
  }
}
