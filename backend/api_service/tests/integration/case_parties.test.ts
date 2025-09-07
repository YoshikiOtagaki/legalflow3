import { agent } from '../api-test-setup';
import { prisma } from '../setup';
import { cleanupDatabase } from '../lib/db-test-utils';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('Integration: Adding Parties to Case', () => {

  let authToken: string;
  let user: any; // User type is not fully defined here, keeping as any for now
  let caseId: string;

  beforeAll(async () => {
    await cleanupDatabase(); // Use the centralized cleanup

    user = await prisma.user.create({
      data: {
        email: 'party.adder@example.com',
        name: 'Party Adder',
      }
    });

    const loginResponse = await agent
      .post('/api/auth/login')
      .send({ email: user.email, password: 'password123' });
    authToken = loginResponse.body.token;

    const category = await prisma.caseCategory.create({
        data: {
          name: 'Integration Test Category',
          roleDefinitions: { plaintiff: 'Plaintiff', defendant: 'Defendant' },
        },
      });

    const caseResponse = await agent
        .post('/api/cases')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Case for Parties', categoryId: category.id });
    caseId = caseResponse.body.data.id;
  });

  afterAll(async () => {
    await cleanupDatabase(); // Use the centralized cleanup
  });

  it('should allow an authenticated user to add a party to a case', async () => {
    const partyResponse = await agent
        .post('/api/parties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
            isCorporation: false,
            individual: { create: { firstName: 'John', lastName: 'Doe' } },
        });
    const partyId = partyResponse.body.data.id;

    const role = 'plaintiff';
    const addPartyResponse = await agent
      .post(`/api/cases/${caseId}/parties`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ partyId, role })
      .expect(201);

    expect(addPartyResponse.body.data.caseId).toBe(caseId);
    expect(addPartyResponse.body.data.partyId).toBe(partyId);
    expect(addPartyResponse.body.data.role).toBe(role);

    const casePartiesResponse = await agent
        .get(`/api/cases/${caseId}/parties`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

    expect(casePartiesResponse.body.data).toHaveLength(1);
    expect(casePartiesResponse.body.data[0].party.individual.firstName).toBe('John');
  });

  it('should prevent adding the same party with the same role twice', async () => {
    const partyResponse = await agent
        .post('/api/parties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
            isCorporation: false,
            individual: { create: { firstName: 'Jane', lastName: 'Doe' } }
        });
    const partyId = partyResponse.body.data.id;

    await agent
      .post(`/api/cases/${caseId}/parties`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ partyId, role: 'defendant' })
      .expect(201);

    await agent
      .post(`/api/cases/${caseId}/parties`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ partyId, role: 'defendant' })
      .expect(409);
  });

});
