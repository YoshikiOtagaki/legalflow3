import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateLawyerData {
  lastName?: string;
  firstName?: string;
  lastNameKana?: string;
  firstNameKana?: string;
  honorific?: string;
  registrationNumber?: string;
  homePhone?: string;
  homePostalCode?: string;
  homeAddress1?: string;
  homeAddress2?: string;
  itemsInCustody?: string;
  cautions?: string;
  remarks?: string;
  officeId?: string;
}

export interface UpdateLawyerData {
  lastName?: string;
  firstName?: string;
  lastNameKana?: string;
  firstNameKana?: string;
  honorific?: string;
  registrationNumber?: string;
  homePhone?: string;
  homePostalCode?: string;
  homeAddress1?: string;
  homeAddress2?: string;
  itemsInCustody?: string;
  cautions?: string;
  remarks?: string;
  officeId?: string;
}

export class LawyerService {
  /**
   * 弁護士を作成
   */
  static async create(data: CreateLawyerData) {
    return await prisma.lawyer.create({
      data: {
        lastName: data.lastName,
        firstName: data.firstName,
        lastNameKana: data.lastNameKana,
        firstNameKana: data.firstNameKana,
        honorific: data.honorific,
        registrationNumber: data.registrationNumber,
        homePhone: data.homePhone,
        homePostalCode: data.homePostalCode,
        homeAddress1: data.homeAddress1,
        homeAddress2: data.homeAddress2,
        itemsInCustody: data.itemsInCustody,
        cautions: data.cautions,
        remarks: data.remarks,
        officeId: data.officeId,
      },
      include: {
        office: {
          include: {
            lawFirm: true,
          },
        },
      },
    });
  }

  /**
   * IDで弁護士を取得
   */
  static async findById(id: string) {
    return await prisma.lawyer.findUnique({
      where: { id },
      include: {
        office: {
          include: {
            lawFirm: true,
          },
        },
      },
    });
  }

  /**
   * 登録番号で弁護士を取得
   */
  static async findByRegistrationNumber(registrationNumber: string) {
    return await prisma.lawyer.findUnique({
      where: { registrationNumber },
      include: {
        office: {
          include: {
            lawFirm: true,
          },
        },
      },
    });
  }

  /**
   * 名前で検索
   */
  static async findByName(lastName?: string, firstName?: string) {
    return await prisma.lawyer.findMany({
      where: {
        ...(lastName && { lastName: { contains: lastName } }),
        ...(firstName && { firstName: { contains: firstName } }),
      },
      include: {
        office: {
          include: {
            lawFirm: true,
          },
        },
      },
      orderBy: {
        lastName: 'asc',
      },
    });
  }

  /**
   * 事務所IDで弁護士を取得
   */
  static async findByOfficeId(officeId: string) {
    return await prisma.lawyer.findMany({
      where: { officeId },
      include: {
        office: {
          include: {
            lawFirm: true,
          },
        },
      },
      orderBy: {
        lastName: 'asc',
      },
    });
  }

  /**
   * 全弁護士を取得
   */
  static async findAll() {
    return await prisma.lawyer.findMany({
      include: {
        office: {
          include: {
            lawFirm: true,
          },
        },
      },
      orderBy: {
        lastName: 'asc',
      },
    });
  }

  /**
   * 弁護士を更新
   */
  static async update(id: string, data: UpdateLawyerData) {
    return await prisma.lawyer.update({
      where: { id },
      data,
      include: {
        office: {
          include: {
            lawFirm: true,
          },
        },
      },
    });
  }

  /**
   * 弁護士を削除
   */
  static async delete(id: string) {
    return await prisma.lawyer.delete({
      where: { id },
    });
  }

  /**
   * 弁護士が存在するかチェック
   */
  static async exists(id: string): Promise<boolean> {
    const lawyer = await prisma.lawyer.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!lawyer;
  }

  /**
   * 登録番号が既に使用されているかチェック
   */
  static async isRegistrationNumberTaken(registrationNumber: string): Promise<boolean> {
    const lawyer = await prisma.lawyer.findUnique({
      where: { registrationNumber },
      select: { id: true },
    });
    return !!lawyer;
  }

  /**
   * 弁護士数を取得
   */
  static async count() {
    return await prisma.lawyer.count();
  }

  /**
   * 事務所別弁護士数を取得
   */
  static async countByOffice(officeId: string) {
    return await prisma.lawyer.count({
      where: { officeId },
    });
  }
}
