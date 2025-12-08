import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { hashPassword } from '../src/utils/auth.utils.js';

// Mock HuggingFace API
jest.mock('../services/ai.service.js', () => ({
  aiService: {
    generateTodoFromPrompt: jest.fn().mockResolvedValue({
      title: 'AI Generated Todo',
      description: 'AI generated description',
      status: 'PENDING',
      priority: 'MEDIUM',
      estimatedTimeMinutes: 60,
      subtasks: [{ title: 'Subtask 1', estimatedTimeMinutes: 30 }],
      tips: ['Stay focused!'],
    }),
  },
}));

jest.mock('../services/coach.service.js', () => ({
  coachService: {
    getCoachingForUser: jest.fn().mockResolvedValue({
      summary: 'Test summary',
      priorityOrder: [{ title: 'Todo 1', reason: 'High priority' }],
      bottlenecks: [{ title: 'Blocking task', reason: 'Complex' }],
      metrics: {
        total: 5,
        pending: 2,
        inProgress: 1,
        done: 2,
        overdue: 0,
      },
      tips: ['Test tip 1', 'Test tip 2'],
    }),
  },
}));

describe('AI Endpoints', () => {
  let authToken: string;
  let userId: number;

  beforeEach(async () => {
    await prisma.todo.deleteMany();
    await prisma.user.deleteMany();

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

  describe('POST /api/todos/generate', () => {
    it('should generate todo from AI prompt', async () => {
      const response = await request(app)
        .post('/api/todos/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          prompt: 'Create a todo for completing my project',
        })
        .expect(201);

      expect(response.body).toEqual({
        message: 'Todo generated and created successfully',
        todo: expect.any(Object),
        ai: {
          suggestedStatus: 'PENDING',
        },
      });
    });

    it('should return 400 for empty prompt', async () => {
      await request(app)
        .post('/api/todos/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ prompt: '' })
        .expect(400);
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

    it('should get AI coaching advice', async () => {
      const response = await request(app)
        .get('/api/todos/coach')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual({
        message: 'Productivity coach analysis successful',
        advice: {
          summary: 'Test summary',
          priorityOrder: [{ title: 'Todo 1', reason: 'High priority' }],
          bottlenecks: [{ title: 'Blocking task', reason: 'Complex' }],
          metrics: expect.any(Object),
          tips: expect.any(Array),
        },
      });
    });
  });
});