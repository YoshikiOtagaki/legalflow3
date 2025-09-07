import { agent } from '../api-test-setup';
import { prisma } from '../setup';
import { cleanupDatabase } from '../lib/db-test-utils';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('Integration: Time Logging Flow', () => {

  let authToken: string;
  let caseId: string;
  let taskId: string;

  beforeAll(async () => {
    await cleanupDatabase(); // Use the centralized cleanup

    const user = await prisma.user.create({
      data: {
        email: 'time.logger@example.com',
        name: 'Time Logger',
      }
    });

    const loginResponse = await agent
      .post('/api/auth/login')
      .send({ email: user.email, password: 'password123' });
    authToken = loginResponse.body.token;

    const category = await prisma.caseCategory.create({
        data: { name: 'Time Logging Category', roleDefinitions: {} },
    });

    const caseResponse = await agent
        .post('/api/cases')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Case for Time Logging', categoryId: category.id });
    caseId = caseResponse.body.data.id;

    const taskResponse = await agent
        .post(`/api/cases/${caseId}/tasks`) // Assuming this endpoint exists
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'Draft a motion' });
    taskId = taskResponse.body.data.id;
  });

  afterAll(async () => {
    await cleanupDatabase(); // Use the centralized cleanup
  });

  it('should allow a user to create a timesheet entry for a task', async () => {
    const entryData = {
      taskId: taskId,
      startTime: new Date(),
      endTime: new Date(Date.now() + 1000 * 60 * 30), // 30 minutes later
      description: 'Researching precedents',
    };

    const response = await agent
      .post('/api/timesheet-entries')
      .set('Authorization', `Bearer ${authToken}`)
      .send(entryData)
      .expect(201);

    expect(response.body.data.taskId).toBe(taskId);
    expect(response.body.data.description).toBe(entryData.description);

    const dbEntry = await prisma.timesheetEntry.findUnique({ where: { id: response.body.data.id } });
    expect(dbEntry).not.toBeNull();
    expect(dbEntry!.description).toBe(entryData.description);
  });

  it('should simulate starting and stopping a timer to create an entry', async () => {
    const startResponse = await agent
      .post(`/api/tasks/${taskId}/timer/start`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const timerId = startResponse.body.data.id;
    expect(timerId).toBeDefined();

    await new Promise(resolve => setTimeout(resolve, 1000));

    const stopResponse = await agent
      .post(`/api/timers/${timerId}/stop`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ description: 'Client meeting' })
      .expect(201);

    expect(stopResponse.body.data.taskId).toBe(taskId);
    expect(stopResponse.body.data.description).toBe('Client meeting');
    expect(stopResponse.body.data.duration).toBeGreaterThanOrEqual(1000);
  });

});
