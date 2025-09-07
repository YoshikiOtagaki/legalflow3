import { agent } from '../api-test-setup';
import { prisma } from '../setup';
import { cleanupDatabase } from '../lib/db-test-utils';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('Integration: Case Creation Flow', () => {

  let authToken: string;
  let user: any; // User type is not fully defined here, keeping as any for now

  beforeAll(async () => {
    await cleanupDatabase(); // Use the centralized cleanup

    user = await prisma.user.create({
      data: {
        email: 'case.creator@example.com',
        name: 'Case Creator',
      }
    });

    const loginResponse = await agent
      .post('/api/auth/login')
      .send({ email: user.email, password: 'password123' });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await cleanupDatabase(); // Use the centralized cleanup
  });

  it('should allow an authenticated user to create a new case with a selected category', async () => {
    const category = await prisma.caseCategory.create({
      data: {
        name: 'General Litigation',
        roleDefinitions: { plaintiff: 'Plaintiff', defendant: 'Defendant' },
      },
    });

    const caseData = {
      name: 'New Case by Authenticated User',
      categoryId: category.id,
      caseNumber: 'INT-TEST-001'
    };

    const response = await agent
      .post('/api/cases')
      .set('Authorization', `Bearer ${authToken}`)
      .send(caseData)
      .expect(201);

    expect(response.body.data.name).toBe(caseData.name);
    expect(response.body.data.categoryId).toBe(category.id);

    const dbCase = await prisma.case.findUnique({ where: { id: response.body.data.id } });
    expect(dbCase).not.toBeNull();
    expect(dbCase!.name).toBe(caseData.name);
  });

  it('should not allow an unauthenticated user to create a case', async () => {
    const category = await prisma.caseCategory.create({
        data: {
          name: 'Unauth Test Category',
          roleDefinitions: {},
        },
      });

      const caseData = {
        name: 'Attempted Unauthenticated Case',
        categoryId: category.id,
      };

      await agent
        .post('/api/cases')
        .send(caseData)
        .expect(401);
  });

});
