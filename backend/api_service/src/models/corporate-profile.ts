import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateCorporateProfileData {
  partyId: string;
  name?: string;
  nameKana?: string;
  postalCode?: string;
  address1?: string;
  address2?: string;
  phone?: string;
  mobilePhone?: string;
  fax?: string;
  email?: string;
  websiteURL?: string;
  representativeTitle?: string;
  representativeLastName?: string;
  representativeFirstName?: string;
  contactLastName?: string;
  contactFirstName?: string;
  contactLastNameKana?: string;
  contactFirstNameKana?: string;
  contactDepartment?: string;
  contactPosition?: string;
  contactDirectPhone?: string;
  contactEmail?: string;
  contactMobilePhone?: string;
  contactPostalCode?: string;
  contactAddress1?: string;
  contactAddress2?: string;
  itemsInCustody?: string;
  cautions?: string;
  remarks?: string;
}

export interface UpdateCorporateProfileData {
  name?: string;
  nameKana?: string;
  postalCode?: string;
  address1?: string;
  address2?: string;
  phone?: string;
  mobilePhone?: string;
  fax?: string;
  email?: string;
  websiteURL?: string;
  representativeTitle?: string;
  representativeLastName?: string;
  representativeFirstName?: string;
  contactLastName?: string;
  contactFirstName?: string;
  contactLastNameKana?: string;
  contactFirstNameKana?: string;
  contactDepartment?: string;
  contactPosition?: string;
  contactDirectPhone?: string;
  contactEmail?: string;
  contactMobilePhone?: string;
  contactPostalCode?: string;
  contactAddress1?: string;
  contactAddress2?: string;
  itemsInCustody?: string;
  cautions?: string;
  remarks?: string;
}

export class CorporateProfileService {
  /**
   * 法人プロフィールを作成
   */
  static async create(data: CreateCorporateProfileData) {
    return await prisma.corporateProfile.create({
      data: {
        partyId: data.partyId,
        name: data.name,
        nameKana: data.nameKana,
        postalCode: data.postalCode,
        address1: data.address1,
        address2: data.address2,
        phone: data.phone,
        mobilePhone: data.mobilePhone,
        fax: data.fax,
        email: data.email,
        websiteURL: data.websiteURL,
        representativeTitle: data.representativeTitle,
        representativeLastName: data.representativeLastName,
        representativeFirstName: data.representativeFirstName,
        contactLastName: data.contactLastName,
        contactFirstName: data.contactFirstName,
        contactLastNameKana: data.contactLastNameKana,
        contactFirstNameKana: data.contactFirstNameKana,
        contactDepartment: data.contactDepartment,
        contactPosition: data.contactPosition,
        contactDirectPhone: data.contactDirectPhone,
        contactEmail: data.contactEmail,
        contactMobilePhone: data.contactMobilePhone,
        contactPostalCode: data.contactPostalCode,
        contactAddress1: data.contactAddress1,
        contactAddress2: data.contactAddress2,
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
   * IDで法人プロフィールを取得
   */
  static async findById(id: string) {
    return await prisma.corporateProfile.findUnique({
      where: { id },
      include: {
        party: true,
      },
    });
  }

  /**
   * 当事者IDで法人プロフィールを取得
   */
  static async findByPartyId(partyId: string) {
    return await prisma.corporateProfile.findUnique({
      where: { partyId },
      include: {
        party: true,
      },
    });
  }

  /**
   * 会社名で検索
   */
  static async findByName(name?: string) {
    return await prisma.corporateProfile.findMany({
      where: {
        ...(name && { name: { contains: name } }),
      },
      include: {
        party: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * メールアドレスで検索
   */
  static async findByEmail(email: string) {
    return await prisma.corporateProfile.findMany({
      where: {
        OR: [
          { email: { contains: email } },
          { contactEmail: { contains: email } },
        ],
      },
      include: {
        party: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * 全法人プロフィールを取得
   */
  static async findAll() {
    return await prisma.corporateProfile.findMany({
      include: {
        party: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * 法人プロフィールを更新
   */
  static async update(id: string, data: UpdateCorporateProfileData) {
    return await prisma.corporateProfile.update({
      where: { id },
      data,
      include: {
        party: true,
      },
    });
  }

  /**
   * 当事者IDで法人プロフィールを更新
   */
  static async updateByPartyId(partyId: string, data: UpdateCorporateProfileData) {
    return await prisma.corporateProfile.update({
      where: { partyId },
      data,
      include: {
        party: true,
      },
    });
  }

  /**
   * 法人プロフィールを削除
   */
  static async delete(id: string) {
    return await prisma.corporateProfile.delete({
      where: { id },
    });
  }

  /**
   * 当事者IDで法人プロフィールを削除
   */
  static async deleteByPartyId(partyId: string) {
    return await prisma.corporateProfile.delete({
      where: { partyId },
    });
  }

  /**
   * 法人プロフィールが存在するかチェック
   */
  static async exists(id: string): Promise<boolean> {
    const profile = await prisma.corporateProfile.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!profile;
  }

  /**
   * 当事者が法人プロフィールを持っているかチェック
   */
  static async hasProfile(partyId: string): Promise<boolean> {
    const profile = await prisma.corporateProfile.findUnique({
      where: { partyId },
      select: { id: true },
    });
    return !!profile;
  }

  /**
   * 法人プロフィール数を取得
   */
  static async count() {
    return await prisma.corporateProfile.count();
  }
}
