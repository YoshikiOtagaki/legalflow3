import { PrismaClient } from '@prisma/client';

// テスト用のPrismaクライアントを作成
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./test.db',
    },
  },
});

// テスト用のデータベース接続を確立
beforeAll(async () => {
  await prisma.$connect();
});

// テスト用のデータベース接続を閉じる
afterAll(async () => {
  await prisma.$disconnect();
});

// グローバルクリーンアップは無効化（各テストファイルで個別に管理）
// beforeEach(async () => {
//   await prisma.caseParty.deleteMany();
//   await prisma.case.deleteMany();
//   await prisma.casePhase.deleteMany();
//   await prisma.caseCategory.deleteMany();
//   await prisma.individualProfile.deleteMany();
//   await prisma.corporateProfile.deleteMany();
//   await prisma.party.deleteMany();
//   await prisma.user.deleteMany();
// });

// afterEach(async () => {
//   await prisma.caseParty.deleteMany();
//   await prisma.case.deleteMany();
//   await prisma.casePhase.deleteMany();
//   await prisma.caseCategory.deleteMany();
//   await prisma.individualProfile.deleteMany();
//   await prisma.corporateProfile.deleteMany();
//   await prisma.party.deleteMany();
//   await prisma.user.deleteMany();
// });

export { prisma };
