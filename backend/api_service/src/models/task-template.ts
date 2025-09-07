import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateTaskTemplateData {
  name: string;
}

export interface UpdateTaskTemplateData {
  name?: string;
}

export class TaskTemplateService {
  /**
   * タスクテンプレートを作成
   */
  static async create(data: CreateTaskTemplateData) {
    return await prisma.taskTemplate.create({
      data: {
        name: data.name,
      },
      include: {
        items: {
          orderBy: {
            id: 'asc',
          },
        },
        phaseTransitionRules: {
          include: {
            fromPhase: {
              include: {
                category: true,
              },
            },
            toPhase: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * IDでタスクテンプレートを取得
   */
  static async findById(id: string) {
    return await prisma.taskTemplate.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: {
            id: 'asc',
          },
        },
        phaseTransitionRules: {
          include: {
            fromPhase: {
              include: {
                category: true,
              },
            },
            toPhase: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * 名前でタスクテンプレートを検索
   */
  static async findByName(name: string) {
    return await prisma.taskTemplate.findMany({
      where: {
        name: { contains: name },
      },
      include: {
        items: {
          orderBy: {
            id: 'asc',
          },
        },
        phaseTransitionRules: {
          include: {
            fromPhase: {
              include: {
                category: true,
              },
            },
            toPhase: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * 全タスクテンプレートを取得
   */
  static async findAll() {
    return await prisma.taskTemplate.findMany({
      include: {
        items: {
          orderBy: {
            id: 'asc',
          },
        },
        phaseTransitionRules: {
          include: {
            fromPhase: {
              include: {
                category: true,
              },
            },
            toPhase: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * タスクテンプレートを更新
   */
  static async update(id: string, data: UpdateTaskTemplateData) {
    return await prisma.taskTemplate.update({
      where: { id },
      data,
      include: {
        items: {
          orderBy: {
            id: 'asc',
          },
        },
        phaseTransitionRules: {
          include: {
            fromPhase: {
              include: {
                category: true,
              },
            },
            toPhase: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * タスクテンプレートを削除
   */
  static async delete(id: string) {
    return await prisma.taskTemplate.delete({
      where: { id },
    });
  }

  /**
   * タスクテンプレートが存在するかチェック
   */
  static async exists(id: string): Promise<boolean> {
    const template = await prisma.taskTemplate.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!template;
  }

  /**
   * 名前が既に使用されているかチェック
   */
  static async isNameTaken(name: string): Promise<boolean> {
    const template = await prisma.taskTemplate.findFirst({
      where: { name },
      select: { id: true },
    });
    return !!template;
  }

  /**
   * 全タスクテンプレート数を取得
   */
  static async count() {
    return await prisma.taskTemplate.count();
  }
}
