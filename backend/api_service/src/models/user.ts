import prisma from '../../db';
import { Role } from '@prisma/client';

export interface CreateUserData {
  email: string;
  name?: string;
  role?: Role;
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  role?: Role;
}

export class UserService {
  /**
   * ユーザーを作成
   */
  static async create(data: CreateUserData) {
    return await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: data.role || Role.Lawyer,
      },
    });
  }

  /**
   * IDでユーザーを取得
   */
  static async findById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        subscription: true,
      },
    });
  }

  /**
   * メールアドレスでユーザーを取得
   */
  static async findByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        subscription: true,
      },
    });
  }

  /**
   * 全ユーザーを取得
   */
  static async findAll() {
    return await prisma.user.findMany({
      include: {
        subscription: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * ユーザーを更新
   */
  static async update(id: string, data: UpdateUserData) {
    return await prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        subscription: true,
      },
    });
  }

  /**
   * ユーザーを削除
   */
  static async delete(id: string) {
    return await prisma.user.delete({
      where: { id },
    });
  }

  /**
   * ユーザーが存在するかチェック
   */
  static async exists(id: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!user;
  }

  /**
   * メールアドレスが既に使用されているかチェック
   */
  static async isEmailTaken(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    return !!user;
  }

  /**
   * ユーザー数を取得
   */
  static async count() {
    return await prisma.user.count();
  }

  /**
   * ロール別ユーザー数を取得
   */
  static async countByRole(role: Role) {
    return await prisma.user.count({
      where: { role },
    });
  }
}
