import { agent } from '../api-test-setup';
import { prisma } from '../setup';
import { cleanupDatabase } from '../lib/db-test-utils';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import nock from 'nock';

describe('Integration: Document Generation Flow', () => {

  let authToken: string;
  let caseId: string;
  let templateId: string;

  beforeAll(async () => {
    await cleanupDatabase(); // Use the centralized cleanup

    const user = await prisma.user.create({
      data: {
        email: 'doc.generator@example.com',
        name: 'Doc Generator',
      }
    });

    const loginResponse = await agent
      .post('/api/auth/login')
      .send({ email: user.email, password: 'password123' }); // Assuming password is handled by auth service
    authToken = loginResponse.body.token;

    const category = await prisma.caseCategory.create({
        data: { name: 'DocGen Category', roleDefinitions: {} },
    });

    const caseResponse = await agent
        .post('/api/cases')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Case for DocGen', categoryId: category.id, caseNumber: 'DOC-001' });
    caseId = caseResponse.body.data.id;

    const template = await prisma.documentTemplate.create({
        data: {
            name: 'Sample Complaint Template',
            filePath: '/templates/complaint.docx',
            placeholders: {},
        }
    });
    templateId = template.id;
  });

  afterAll(async () => {
    nock.cleanAll();
    await cleanupDatabase(); // Use the centralized cleanup
  });

  it('should request document generation and return the generated document', async () => {
    const docgenServiceUrl = 'http://localhost:8001';
    const generatedDocBuffer = Buffer.from('This is a fake generated document.');

    nock(docgenServiceUrl)
      .post('/generate-document')
      .reply(200, generatedDocBuffer, { 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

    const response = await agent
      .post(`/api/cases/${caseId}/generate-document`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ templateId: templateId })
      .expect(200);

    expect(response.headers['content-type']).toEqual('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(response.body).toEqual(generatedDocBuffer);
  });

  it('should return an error if the docgen_service fails', async () => {
    const docgenServiceUrl = 'http://localhost:8001';

    nock(docgenServiceUrl)
      .post('/generate-document')
      .reply(500, { error: 'Failed to generate document' });

    await agent
      .post(`/api/cases/${caseId}/generate-document`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ templateId: templateId })
      .expect(502);
  });

});
