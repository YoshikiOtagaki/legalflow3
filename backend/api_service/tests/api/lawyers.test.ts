import { agent } from '../api-test-setup';
import { prisma } from '../setup';
import { cleanupDatabase } from '../lib/db-test-utils';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('Lawyers API Endpoints', () => {
  beforeEach(cleanupDatabase);
  afterEach(cleanupDatabase);

  describe('POST /api/lawyers', () => {
    it('should create a new lawyer', async () => {
      const lawyerData = {
        userId: 'some-user-id',
        barNumber: '12345',
        bio: 'An experienced lawyer.'
      };

      const response = await agent
        .post('/api/lawyers')
        .send(lawyerData)
        .expect(201);

      expect(response.body.data.barNumber).toBe('12345');
    });

    it('should return 400 for missing required fields', async () => {
      await agent
        .post('/api/lawyers')
        .send({ bio: 'A lawyer with no bar number' })
        .expect(400);
    });
  });

  describe('GET /api/lawyers', () => {
    it('should return a list of lawyers', async () => {
        await prisma.lawyer.create({
            data: {
                userId: 'user1',
                barNumber: '54321',
            }
        });

        const response = await agent
            .get('/api/lawyers')
            .expect(200);

        expect(response.body.data).toHaveLength(1);
        expect(response.body.pagination.total).toBe(1);
    });
  });

  describe('GET /api/lawyers/:id', () => {
    it('should return a single lawyer by id', async () => {
        const lawyer = await prisma.lawyer.create({
            data: {
                userId: 'user2',
                barNumber: '67890'
            }
        });

        const response = await agent
            .get(`/api/lawyers/${lawyer.id}`)
            .expect(200);

        expect(response.body.data.id).toBe(lawyer.id);
        expect(response.body.data.barNumber).toBe('67890');
    });

    it('should return 404 for a non-existent lawyer', async () => {
        await agent
            .get('/api/lawyers/non-existent-id')
            .expect(404);
    });
  });

  describe('PUT /api/lawyers/:id', () => {
    it('should update a lawyer', async () => {
        const lawyer = await prisma.lawyer.create({
            data: {
                userId: 'user3',
                barNumber: '11223'
            }
        });

        const updateData = {
            bio: 'An updated bio.'
        };

        const response = await agent
            .put(`/api/lawyers/${lawyer.id}`)
            .send(updateData)
            .expect(200);

        expect(response.body.data.bio).toBe('An updated bio.');
    });

    it('should return 404 for updating a non-existent lawyer', async () => {
        await agent
            .put('/api/lawyers/non-existent-id')
            .send({ bio: 'A ghost bio' })
            .expect(404);
    });
  });

  describe('DELETE /api/lawyers/:id', () => {
    it('should delete a lawyer', async () => {
        const lawyer = await prisma.lawyer.create({
            data: {
                userId: 'user4',
                barNumber: '44556'
            }
        });

        await agent
            .delete(`/api/lawyers/${lawyer.id}`)
            .expect(204);

        const deletedLawyer = await prisma.lawyer.findUnique({ where: { id: lawyer.id } });
        expect(deletedLawyer).toBeNull();
    });

    it('should return 404 for deleting a non-existent lawyer', async () => {
        await agent
            .delete('/api/lawyers/non-existent-id')
            .expect(404);
    });
  });

});
