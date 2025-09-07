import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateTaskTemplateItemData {
  taskTemplateId: string;
  description: string;
  dueDateOffsetDays: number;
}

export interface UpdateTaskTemplateItemData {
  description?: string;
  dueDateOffsetDays?: number;
}

export class TaskTemplateItemService {
  /**
   * タスクテンプレート項目を作成
   */
  static async create(data: CreateTaskTemplateItemData) {
    return await prisma.taskTemplateItem.create({
      data: {
        taskTemplateId: data.taskTemplateId,
        description: data.description,
        dueDateOffsetDays: data.dueDateOffsetDays,
      },
      include: {
        taskTemplate: true,
      },
    });
  }

  /**
   * 複数のタスクテンプレート項目を一括作成
   */
  static async createMany(items: CreateTaskTemplateItemData[]) {
    return await prisma.taskTemplateItem.createMany({
      data: items.map(item => ({
        taskTemplateId: item.taskTemplateId,
        description: item.description,
        dueDateOffsetDays: item.dueDateOffsetDays,
      })),
    });
  }

  /**
   * IDでタスクテンプレート項目を取得
   */
  static async findById(id: string) {
    return await prisma.taskTemplateItem.findUnique({
      where: { id },
      include: {
        taskTemplate: true,
      },
    });
  }

  /**
   * タスクテンプレートIDで項目を取得
   */
  static async findByTaskTemplateId(taskTemplateId: string) {
    return await prisma.taskTemplateItem.findMany({
      where: { taskTemplateId },
      include: {
        taskTemplate: true,
      },
      orderBy: {
        dueDateOffsetDays: 'asc',
      },
    });
  }

  /**
   * 説明でタスクテンプレート項目を検索
   */
  static async searchByDescription(description: string, taskTemplateId?: string) {
    return await prisma.taskTemplateItem.findMany({
      where: {
        description: { contains: description },
        ...(taskTemplateId && { taskTemplateId }),
      },
      include: {
        taskTemplate: true,
      },
      orderBy: {
        dueDateOffsetDays: 'asc',
      },
    });
  }

  /**
   * 期限オフセット日数で項目を取得
   */
  static async findByDueDateOffset(dueDateOffsetDays: number, taskTemplateId?: string) {
    return await prisma.taskTemplateItem.findMany({
      where: {
        dueDateOffsetDays,
        ...(taskTemplateId && { taskTemplateId }),
      },
      include: {
        taskTemplate: true,
      },
      orderBy: {
        description: 'asc',
      },
    });
  }

  /**
   * 全タスクテンプレート項目を取得
   */
  static async findAll() {
    return await prisma.taskTemplateItem.findMany({
      include: {
        taskTemplate: true,
      },
      orderBy: [
        { taskTemplate: { name: 'asc' } },
        { dueDateOffsetDays: 'asc' },
      ],
    });
  }

  /**
   * タスクテンプレート項目を更新
   */
  static async update(id: string, data: UpdateTaskTemplateItemData) {
    return await prisma.taskTemplateItem.update({
      where: { id },
      data,
      include: {
        taskTemplate: true,
      },
    });
  }

  /**
   * タスクテンプレート項目を削除
   */
  static async delete(id: string) {
    return await prisma.taskTemplateItem.delete({
      where: { id },
    });
  }

  /**
   * タスクテンプレートの全項目を削除
   */
  static async deleteByTaskTemplateId(taskTemplateId: string) {
    return await prisma.taskTemplateItem.deleteMany({
      where: { taskTemplateId },
    });
  }

  /**
   * タスクテンプレート項目が存在するかチェック
   */
  static async exists(id: string): Promise<boolean> {
    const item = await prisma.taskTemplateItem.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!item;
  }

  /**
   * タスクテンプレートの項目数を取得
   */
  static async countByTaskTemplate(taskTemplateId: string) {
    return await prisma.taskTemplateItem.count({
      where: { taskTemplateId },
    });
  }

  /**
   * 全タスクテンプレート項目数を取得
   */
  static async count() {
    return await prisma.taskTemplateItem.count();
  }

  /**
   * 期限オフセット日数別項目数を取得
   */
  static async countByDueDateOffset(dueDateOffsetDays: number) {
    return await prisma.taskTemplateItem.count({
      where: { dueDateOffsetDays },
    });
  }
}
