import { agent } from '../api-test-setup';
import { prisma } from '../setup';
import { cleanupDatabase } from '../lib/db-test-utils';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('Courthouses API Endpoints', () => {
  beforeEach(cleanupDatabase);
  afterEach(cleanupDatabase);

  describe('POST /api/courthouses', () => {
    it('should create a new courthouse', async () => {
      const courthouseData = {
        name: 'Tokyo District Court',
        location: 'Tokyo'
      };

      const response = await agent
        .post('/api/courthouses')
        .send(courthouseData)
        .expect(201);

      expect(response.body.data.name).toBe('Tokyo District Court');
    });

    it('should return 400 for missing required fields', async () => {
      await agent
        .post('/api/courthouses')
        .send({ location: 'Osaka' })
        .expect(400);
    });
  });

  describe('GET /api/courthouses', () => {
    it('should return a list of courthouses', async () => {
        await prisma.courthouse.create({
            data: {
                name: 'Osaka High Court',
                location: 'Osaka'
            }
        });

        const response = await agent
            .get('/api/courthouses')
            .expect(200);

        expect(response.body.data).toHaveLength(1);
        expect(response.body.pagination.total).toBe(1);
    });
  });

  describe('GET /api/courthouses/:id', () => {
    it('should return a single courthouse by id', async () => {
        const courthouse = await prisma.courthouse.create({
            data: {
                name: 'Nagoya Family Court',
                location: 'Nagoya'
            }
        });

        const response = await agent
            .get(`/api/courthouses/${courthouse.id}`)
            .expect(200);

        expect(response.body.data.id).toBe(courthouse.id);
        expect(response.body.data.name).toBe('Nagoya Family Court');
    });

    it('should return 404 for a non-existent courthouse', async () => {
        await agent
            .get('/api/courthouses/non-existent-id')
            .expect(404);
    });
  });

  describe('PUT /api/courthouses/:id', () => {
    it('should update a courthouse', async () => {
        const courthouse = await prisma.courthouse.create({
            data: {
                name: 'Fukuoka District Court',
                location: 'Fukuoka'
            }
        });

        const updateData = {
            name: 'Fukuoka High Court'
        };

        const response = await agent
            .put(`/api/courthouses/${courthouse.id}`)
            .send(updateData)
            .expect(200);

        expect(response.body.data.name).toBe('Fukuoka High Court');
    });

    it('should return 404 for updating a non-existent courthouse', async () => {
        await agent
            .put('/api/courthouses/non-existent-id')
            .send({ name: 'Ghost Courthouse' })
            .expect(404);
    });
  });

  describe('DELETE /api/courthouses/:id', () => {
    it('should delete a courthouse', async () => {
        const courthouse = await prisma.courthouse.create({
            data: {
                name: 'Sapporo Summary Court',
                location: 'Sapporo'
            }
        });

        await agent
            .delete(`/api/courthouses/${courthouse.id}`)
            .expect(204);

        const deletedCourthouse = await prisma.courthouse.findUnique({ where: { id: courthouse.id } });
        expect(deletedCourthouse).toBeNull();
    });

    it('should return 404 for deleting a non-existent courthouse', async () => {
        await agent
            .delete('/api/courthouses/non-existent-id')
            .expect(404);
    });
  });

});
