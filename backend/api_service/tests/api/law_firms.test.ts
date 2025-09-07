import { agent } from '../api-test-setup';
import { prisma } from '../setup';
import { cleanupDatabase } from '../lib/db-test-utils';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('Law Firms API Endpoints', () => {
  beforeEach(cleanupDatabase);
  afterEach(cleanupDatabase);

  describe('POST /api/law-firms', () => {
    it('should create a new law firm', async () => {
      const lawFirmData = {
        name: 'Global Legal Associates',
        website: 'https://globallegal.com'
      };

      const response = await agent
        .post('/api/law-firms')
        .send(lawFirmData)
        .expect(201);

      expect(response.body.data.name).toBe('Global Legal Associates');
    });

    it('should return 400 for missing required fields', async () => {
      await agent
        .post('/api/law-firms')
        .send({ website: 'https://incomplete.com' })
        .expect(400);
    });
  });

  describe('GET /api/law-firms', () => {
    it('should return a list of law firms', async () => {
        await prisma.lawFirm.create({
            data: {
                name: 'Local Law Group'
            }
        });

        const response = await agent
            .get('/api/law-firms')
            .expect(200);

        expect(response.body.data).toHaveLength(1);
        expect(response.body.pagination.total).toBe(1);
    });
  });

  describe('GET /api/law-firms/:id', () => {
    it('should return a single law firm by id', async () => {
        const lawFirm = await prisma.lawFirm.create({
            data: {
                name: 'Specific Counselors'
            }
        });

        const response = await agent
            .get(`/api/law-firms/${lawFirm.id}`)
            .expect(200);

        expect(response.body.data.id).toBe(lawFirm.id);
        expect(response.body.data.name).toBe('Specific Counselors');
    });

    it('should return 404 for a non-existent law firm', async () => {
        await agent
            .get('/api/law-firms/non-existent-id')
            .expect(404);
    });
  });

  describe('PUT /api/law-firms/:id', () => {
    it('should update a law firm', async () => {
        const lawFirm = await prisma.lawFirm.create({
            data: {
                name: 'Old Firm Name'
            }
        });

        const updateData = {
            name: 'New Firm Name'
        };

        const response = await agent
            .put(`/api/law-firms/${lawFirm.id}`)
            .send(updateData)
            .expect(200);

        expect(response.body.data.name).toBe('New Firm Name');
    });

    it('should return 404 for updating a non-existent law firm', async () => {
        await agent
            .put('/api/law-firms/non-existent-id')
            .send({ name: 'Ghost Firm' })
            .expect(404);
    });
  });

  describe('DELETE /api/law-firms/:id', () => {
    it('should delete a law firm', async () => {
        const lawFirm = await prisma.lawFirm.create({
            data: {
                name: 'Soon to be Deleted Firm'
            }
        });

        await agent
            .delete(`/api/law-firms/${lawFirm.id}`)
            .expect(204);

        const deletedLawFirm = await prisma.lawFirm.findUnique({ where: { id: lawFirm.id } });
        expect(deletedLawFirm).toBeNull();
    });

    it('should return 404 for deleting a non-existent law firm', async () => {
        await agent
            .delete('/api/law-firms/non-existent-id')
            .expect(404);
    });
  });

});
