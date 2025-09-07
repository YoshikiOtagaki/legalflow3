import { agent } from '../api-test-setup';
import { prisma } from '../setup';
import { cleanupDatabase } from '../lib/db-test-utils';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { User } from '@prisma/client'; // Import User type from Prisma Client

describe('Integration: User Authentication', () => {

  let user: User; // Explicitly type user

  beforeEach(async () => {
    await cleanupDatabase(); // Use the centralized cleanup
  });

  it('should register a new user and then log them in', async () => {
    const newUser = {
      email: 'test.user@example.com',
      name: 'Test User'
    };

    const registerResponse = await agent
      .post('/api/auth/register')
      .send({ ...newUser, password: 'password123' })
      .expect(201);

    expect(registerResponse.body.data.email).toBe(newUser.email);
    expect(registerResponse.body.data).not.toHaveProperty('password');

    const loginResponse = await agent
      .post('/api/auth/login')
      .send({ email: newUser.email, password: 'password123' })
      .expect(200);

    expect(loginResponse.body.token).toBeDefined();

    const protectedResponse = await agent
      .get('/api/users/me')
      .set('Authorization', `Bearer ${loginResponse.body.token}`)
      .expect(200);

    expect(protectedResponse.body.data.email).toBe(newUser.email);
  });

  it('should fail to register with an existing email', async () => {
    user = await prisma.user.create({
        data: {
            email: 'duplicate@example.com',
            name: 'Duplicate User',
        }
    });

    await agent
      .post('/api/auth/register')
      .send({ email: 'duplicate@example.com', password: 'newpassword', name: 'Another User' })
      .expect(409);
  });

  it('should fail to log in with incorrect password', async () => {
    user = await prisma.user.create({
        data: {
            email: 'login.fail@example.com',
            name: 'Login Fail',
        }
    });

    await agent
      .post('/api/auth/login')
      .send({ email: 'login.fail@example.com', password: 'wrongpassword' })
      .expect(401);
  });

});
