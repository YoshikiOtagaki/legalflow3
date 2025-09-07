import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateIndividualProfileData {
  partyId: string;
  lastName?: string;
  firstName?: string;
  lastNameKana?: string;
  firstNameKana?: string;
  honorific?: string;
  formerName?: string;
  dateOfBirth?: Date;
  legalDomicile?: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  fax?: string;
  postalCode?: string;
  address1?: string;
  address2?: string;
  companyName?: string;
  companyNameKana?: string;
  companyPostalCode?: string;
  companyAddress1?: string;
  companyAddress2?: string;
  companyPhone?: string;
  companyFax?: string;
  department?: string;
  position?: string;
  companyEmail?: string;
  itemsInCustody?: string;
  cautions?: string;
  remarks?: string;
}

export interface UpdateIndividualProfileData {
  lastName?: string;
  firstName?: string;
  lastNameKana?: string;
  firstNameKana?: string;
  honorific?: string;
  formerName?: string;
  dateOfBirth?: Date;
  legalDomicile?: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  fax?: string;
  postalCode?: string;
  address1?: string;
  address2?: string;
  companyName?: string;
  companyNameKana?: string;
  companyPostalCode?: string;
  companyAddress1?: string;
  companyAddress2?: string;
  companyPhone?: string;
  companyFax?: string;
  department?: string;
  position?: string;
  companyEmail?: string;
  itemsInCustody?: string;
  cautions?: string;
  remarks?: string;
}

export class IndividualProfileService {
  /**
   * 個人プロフィールを作成
   */
  static async create(data: CreateIndividualProfileData) {
    return await prisma.individualProfile.create({
      data: {
        partyId: data.partyId,
        lastName: data.lastName,
        firstName: data.firstName,
        lastNameKana: data.lastNameKana,
        firstNameKana: data.firstNameKana,
        honorific: data.honorific,
        formerName: data.formerName,
        dateOfBirth: data.dateOfBirth,
        legalDomicile: data.legalDomicile,
        email: data.email,
        phone: data.phone,
        mobilePhone: data.mobilePhone,
        fax: data.fax,
        postalCode: data.postalCode,
        address1: data.address1,
        address2: data.address2,
        companyName: data.companyName,
        companyNameKana: data.companyNameKana,
        companyPostalCode: data.companyPostalCode,
        companyAddress1: data.companyAddress1,
        companyAddress2: data.companyAddress2,
        companyPhone: data.companyPhone,
        companyFax: data.companyFax,
        department: data.department,
        position: data.position,
        companyEmail: data.companyEmail,
        itemsInCustody: data.itemsInCustody,
        cautions: data.cautions,
        remarks: data.remarks,
      },
      include: {
        party: true,
      },
    });
  }

  /**
   * IDで個人プロフィールを取得
   */
  static async findById(id: string) {
    return await prisma.individualProfile.findUnique({
      where: { id },
      include: {
        party: true,
      },
    });
  }

  /**
   * 当事者IDで個人プロフィールを取得
   */
  static async findByPartyId(partyId: string) {
    return await prisma.individualProfile.findUnique({
      where: { partyId },
      include: {
        party: true,
      },
    });
  }

  /**
   * 名前で検索
   */
  static async findByName(lastName?: string, firstName?: string) {
    return await prisma.individualProfile.findMany({
      where: {
        ...(lastName && { lastName: { contains: lastName } }),
        ...(firstName && { firstName: { contains: firstName } }),
      },
      include: {
        party: true,
      },
      orderBy: {
        lastName: 'asc',
      },
    });
  }

  /**
   * メールアドレスで検索
   */
  static async findByEmail(email: string) {
    return await prisma.individualProfile.findMany({
      where: {
        OR: [
          { email: { contains: email } },
          { companyEmail: { contains: email } },
        ],
      },
      include: {
        party: true,
      },
      orderBy: {
        lastName: 'asc',
      },
    });
  }

  /**
   * 全個人プロフィールを取得
   */
  static async findAll() {
    return await prisma.individualProfile.findMany({
      include: {
        party: true,
      },
      orderBy: {
        lastName: 'asc',
      },
    });
  }

  /**
   * 個人プロフィールを更新
   */
  static async update(id: string, data: UpdateIndividualProfileData) {
    return await prisma.individualProfile.update({
      where: { id },
      data,
      include: {
        party: true,
      },
    });
  }

  /**
   * 当事者IDで個人プロフィールを更新
   */
  static async updateByPartyId(partyId: string, data: UpdateIndividualProfileData) {
    return await prisma.individualProfile.update({
      where: { partyId },
      data,
      include: {
        party: true,
      },
    });
  }

  /**
   * 個人プロフィールを削除
   */
  static async delete(id: string) {
    return await prisma.individualProfile.delete({
      where: { id },
    });
  }

  /**
   * 当事者IDで個人プロフィールを削除
   */
  static async deleteByPartyId(partyId: string) {
    return await prisma.individualProfile.delete({
      where: { partyId },
    });
  }

  /**
   * 個人プロフィールが存在するかチェック
   */
  static async exists(id: string): Promise<boolean> {
    const profile = await prisma.individualProfile.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!profile;
  }

  /**
   * 当事者が個人プロフィールを持っているかチェック
   */
  static async hasProfile(partyId: string): Promise<boolean> {
    const profile = await prisma.individualProfile.findUnique({
      where: { partyId },
      select: { id: true },
    });
    return !!profile;
  }

  /**
   * 個人プロフィール数を取得
   */
  static async count() {
    return await prisma.individualProfile.count();
  }
}
