import { agent } from '../api-test-setup';
import { prisma } from '../setup';
import { cleanupDatabase } from '../lib/db-test-utils';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('Parties API Endpoints', () => {
  beforeEach(cleanupDatabase);
  afterEach(cleanupDatabase);

  describe('POST /api/parties', () => {
    it('should create a new individual party', async () => {
      const partyData = {
        isCorporation: false,
        individual: {
          firstName: 'Taro',
          lastName: 'Yamada',
          email: 'taro.yamada@example.com',
        },
      };

      const response = await agent
        .post('/api/parties')
        .send(partyData)
        .expect(201);

      expect(response.body.data.isCorporation).toBe(false);
      expect(response.body.data.individual.firstName).toBe('Taro');
    });

    it('should create a new corporate party', async () => {
      const partyData = {
        isCorporation: true,
        corporate: {
          name: 'Example Corp',
          registrationNumber: '123456789',
        },
      };

      const response = await agent
        .post('/api/parties')
        .send(partyData)
        .expect(201);

      expect(response.body.data.isCorporation).toBe(true);
      expect(response.body.data.corporate.name).toBe('Example Corp');
    });

    it('should return 400 for missing required fields', async () => {
      await agent
        .post('/api/parties')
        .send({ isCorporation: false })
        .expect(400);
    });
  });

  describe('GET /api/parties', () => {
    it('should return a list of parties', async () => {
      await prisma.party.create({
        data: {
          isCorporation: false,
          individual: { create: { firstName: 'Taro', lastName: 'Yamada' } },
        },
      });
      await prisma.party.create({
        data: {
          isCorporation: true,
          corporate: { create: { name: 'Example Corp' } },
        },
      });

      const response = await agent
        .get('/api/parties')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });
  });

  describe('GET /api/parties/:id', () => {
    it('should return a single party by id', async () => {
      const party = await prisma.party.create({
        data: {
          isCorporation: false,
          individual: { create: { firstName: 'Jiro', lastName: 'Suzuki' } },
        },
      });

      const response = await agent
        .get(`/api/parties/${party.id}`)
        .expect(200);

      expect(response.body.data.id).toBe(party.id);
      expect(response.body.data.individual.firstName).toBe('Jiro');
    });

    it('should return 404 for a non-existent party', async () => {
      await agent
        .get('/api/parties/non-existent-id')
        .expect(404);
    });
  });

  describe('PUT /api/parties/:id', () => {
    it('should update an individual party', async () => {
      const party = await prisma.party.create({
        data: {
          isCorporation: false,
          individual: { create: { firstName: 'Saburo', lastName: 'Sato' } },
        },
      });

      const updateData = {
        individual: {
          firstName: 'SaburoUpdated',
        },
      };

      const response = await agent
        .put(`/api/parties/${party.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.individual.firstName).toBe('SaburoUpdated');
    });

    it('should update a corporate party', async () => {
        const party = await prisma.party.create({
            data: {
              isCorporation: true,
              corporate: { create: { name: 'Original Corp' } },
            },
          });

        const updateData = {
            corporate: {
                name: 'Updated Corp',
            },
        };

        const response = await agent
            .put(`/api/parties/${party.id}`)
            .send(updateData)
            .expect(200);

        expect(response.body.data.corporate.name).toBe('Updated Corp');
    });

    it('should return 404 for updating a non-existent party', async () => {
      await agent
        .put('/api/parties/non-existent-id')
        .send({ individual: { firstName: 'Ghost' } })
        .expect(404);
    });
  });

  describe('DELETE /api/parties/:id', () => {
    it('should delete a party', async () => {
      const party = await prisma.party.create({
        data: {
          isCorporation: false,
          individual: { create: { firstName: 'Shiro', lastName: 'Ito' } },
        },
      });

      await agent
        .delete(`/api/parties/${party.id}`)
        .expect(204);

      const deletedParty = await prisma.party.findUnique({ where: { id: party.id } });
      expect(deletedParty).toBeNull();
    });

    it('should return 404 for deleting a non-existent party', async () => {
      await agent
        .delete('/api/parties/non-existent-id')
        .expect(404);
    });
  });
});
