import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateDocumentTemplateData {
  name: string;
  filePath: string;
  placeholders: any;
}

export interface UpdateDocumentTemplateData {
  name?: string;
  filePath?: string;
  placeholders?: any;
}

export class DocumentTemplateService {
  /**
   * 文書テンプレートを作成
   */
  static async create(data: CreateDocumentTemplateData) {
    return await prisma.documentTemplate.create({
      data: {
        name: data.name,
        filePath: data.filePath,
        placeholders: data.placeholders,
      },
    });
  }

  /**
   * IDで文書テンプレートを取得
   */
  static async findById(id: string) {
    return await prisma.documentTemplate.findUnique({
      where: { id },
    });
  }

  /**
   * 名前で文書テンプレートを検索
   */
  static async findByName(name: string) {
    return await prisma.documentTemplate.findMany({
      where: {
        name: { contains: name },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * ファイルパスで文書テンプレートを検索
   */
  static async findByFilePath(filePath: string) {
    return await prisma.documentTemplate.findMany({
      where: {
        filePath: { contains: filePath },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * プレースホルダーで文書テンプレートを検索
   */
  static async findByPlaceholder(placeholder: string) {
    return await prisma.documentTemplate.findMany({
      where: {
        placeholders: {
          path: [],
          array_contains: placeholder,
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * 全文書テンプレートを取得
   */
  static async findAll() {
    return await prisma.documentTemplate.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * 文書テンプレートを更新
   */
  static async update(id: string, data: UpdateDocumentTemplateData) {
    return await prisma.documentTemplate.update({
      where: { id },
      data,
    });
  }

  /**
   * 文書テンプレートを削除
   */
  static async delete(id: string) {
    return await prisma.documentTemplate.delete({
      where: { id },
    });
  }

  /**
   * 文書テンプレートが存在するかチェック
   */
  static async exists(id: string): Promise<boolean> {
    const template = await prisma.documentTemplate.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!template;
  }

  /**
   * 名前が既に使用されているかチェック
   */
  static async isNameTaken(name: string): Promise<boolean> {
    const template = await prisma.documentTemplate.findFirst({
      where: { name },
      select: { id: true },
    });
    return !!template;
  }

  /**
   * ファイルパスが既に使用されているかチェック
   */
  static async isFilePathTaken(filePath: string): Promise<boolean> {
    const template = await prisma.documentTemplate.findFirst({
      where: { filePath },
      select: { id: true },
    });
    return !!template;
  }

  /**
   * 全文書テンプレート数を取得
   */
  static async count() {
    return await prisma.documentTemplate.count();
  }

  /**
   * プレースホルダー別テンプレート数を取得
   */
  static async countByPlaceholder(placeholder: string) {
    return await prisma.documentTemplate.count({
      where: {
        placeholders: {
          path: [],
          array_contains: placeholder,
        },
      },
    });
  }
}
