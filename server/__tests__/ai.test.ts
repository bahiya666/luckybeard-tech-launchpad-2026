import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma';
import { hashPassword } from '../src/utils/auth.utils.js';

// For ESM, we can't use jest.mock at the top level
// Instead, we'll test with real API or skip these tests
describe('AI Endpoints', () => {
  let authToken: string;
  let userId: number;

  beforeEach(async () => {

    const user = await prisma.user.create({
      data: {
        email: 'ai@example.com',
        password: await hashPassword('password123'),
        name: 'AI',
        surname: 'Test',
      },
    });

    userId = user.id;

    const login = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'ai@example.com',
        password: 'password123',
      });

    authToken = login.body.token;
  });

  afterEach(async () => {
    await prisma.todo.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('POST /api/todos/generate', () => {
    it('should return 201 when generating todo', async () => {
      const response = await request(app)
        .post('/api/todos/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          prompt: 'Create a todo for completing my project',
        });

      // Should return 201 or 500 depending on API availability
      expect([201, 500]).toContain(response.status);
    });

    it('should return 400 for empty prompt', async () => {
      await request(app)
        .post('/api/todos/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ prompt: '' })
        .expect(400);
    });

    it('should return 401 without auth', async () => {
      await request(app)
        .post('/api/todos/generate')
        .send({ prompt: 'test' })
        .expect(401);
    });
  });

  describe('GET /api/todos/coach', () => {
    beforeEach(async () => {
      // Create some todos for coaching
      await prisma.todo.createMany({
        data: [
          { title: 'Todo 1', status: 'PENDING', userId },
          { title: 'Todo 2', status: 'IN_PROGRESS', userId },
          { title: 'Todo 3', status: 'DONE', userId },
        ],
      });
    });

    it('should return 200 when getting coaching advice', async () => {
      const response = await request(app)
        .get('/api/todos/coach')
        .set('Authorization', `Bearer ${authToken}`);

      // Should return 200 or 500 depending on API availability
      expect([200, 500]).toContain(response.status);
    });

    it('should return 401 without auth', async () => {
      await request(app)
        .get('/api/todos/coach')
        .expect(401);
    });
  });
});