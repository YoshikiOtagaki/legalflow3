import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreatePartyData {
  isCorporation?: boolean;
  isFormerClient?: boolean;
}

export interface UpdatePartyData {
  isCorporation?: boolean;
  isFormerClient?: boolean;
}

export class PartyService {
  /**
   * 当事者を作成
   */
  static async create(data: CreatePartyData) {
    return await prisma.party.create({
      data: {
        isCorporation: data.isCorporation || false,
        isFormerClient: data.isFormerClient || false,
      },
    });
  }

  /**
   * IDで当事者を取得
   */
  static async findById(id: string) {
    return await prisma.party.findUnique({
      where: { id },
      include: {
        individualProfile: true,
        corporateProfile: true,
      },
    });
  }

  /**
   * 全当事者を取得
   */
  static async findAll() {
    return await prisma.party.findMany({
      include: {
        individualProfile: true,
        corporateProfile: true,
      },
      orderBy: {
        id: 'desc',
      },
    });
  }

  /**
   * 法人当事者を取得
   */
  static async findCorporations() {
    return await prisma.party.findMany({
      where: { isCorporation: true },
      include: {
        corporateProfile: true,
      },
      orderBy: {
        id: 'desc',
      },
    });
  }

  /**
   * 個人当事者を取得
   */
  static async findIndividuals() {
    return await prisma.party.findMany({
      where: { isCorporation: false },
      include: {
        individualProfile: true,
      },
      orderBy: {
        id: 'desc',
      },
    });
  }

  /**
   * 元クライアントを取得
   */
  static async findFormerClients() {
    return await prisma.party.findMany({
      where: { isFormerClient: true },
      include: {
        individualProfile: true,
        corporateProfile: true,
      },
      orderBy: {
        id: 'desc',
      },
    });
  }

  /**
   * 当事者を更新
   */
  static async update(id: string, data: UpdatePartyData) {
    return await prisma.party.update({
      where: { id },
      data,
      include: {
        individualProfile: true,
        corporateProfile: true,
      },
    });
  }

  /**
   * 当事者を削除
   */
  static async delete(id: string) {
    return await prisma.party.delete({
      where: { id },
    });
  }

  /**
   * 当事者が存在するかチェック
   */
  static async exists(id: string): Promise<boolean> {
    const party = await prisma.party.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!party;
  }

  /**
   * 当事者数を取得
   */
  static async count() {
    return await prisma.party.count();
  }

  /**
   * 法人当事者数を取得
   */
  static async countCorporations() {
    return await prisma.party.count({
      where: { isCorporation: true },
    });
  }

  /**
   * 個人当事者数を取得
   */
  static async countIndividuals() {
    return await prisma.party.count({
      where: { isCorporation: false },
    });
  }

  /**
   * 元クライアント数を取得
   */
  static async countFormerClients() {
    return await prisma.party.count({
      where: { isFormerClient: true },
    });
  }
}
