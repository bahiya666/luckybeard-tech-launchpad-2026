import request from 'supertest';
import app from '../src/app.js';
import { prisma } from './setup.js';
import { hashPassword } from '../src/utils/auth.utils.js';

describe('Todo Endpoints', () => {
  let authToken: string;
  let userId: number;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'todotest@example.com',
        password: await hashPassword('password123'),
        name: 'Todo',
        surname: 'Test',
      },
    });

    userId = user.id;

    const login = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'todotest@example.com',
        password: 'password123',
      });

    authToken = login.body.token;
  });

  describe('POST /api/todos', () => {
    it('should create a new todo', async () => {
      const response = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Todo',
          description: 'Test description',
        })
        .expect(201);

      expect(response.body.todo).toEqual({
        id: expect.any(Number),
        title: 'Test Todo',
        description: 'Test description',
        status: 'PENDING',
        priority: null,
        estimatedTimeMinutes: null,
        subtasks: null,
        userId,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should require title', async () => {
      await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'No title' })
        .expect(400);
    });

    it('should return 401 without auth', async () => {
      await request(app)
        .post('/api/todos')
        .send({ title: 'Unauthorized' })
        .expect(401);
    });
  });

  describe('GET /api/todos', () => {
    it('should list all todos for user', async () => {
      // Create todos in the test itself
      await prisma.todo.createMany({
        data: [
          { title: 'Todo 1', userId },
          { title: 'Todo 2', userId, status: 'IN_PROGRESS' },
          { title: 'Todo 3', userId, status: 'DONE' },
        ],
      });

      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.todos).toHaveLength(3);
      expect(response.body.todos[0]).toHaveProperty('title', 'Todo 3');
    });

    it('should not show other users todos', async () => {
      // Create todos for current user
      await prisma.todo.createMany({
        data: [
          { title: 'Todo 1', userId },
          { title: 'Todo 2', userId, status: 'IN_PROGRESS' },
          { title: 'Todo 3', userId, status: 'DONE' },
        ],
      });

      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          password: await hashPassword('password123'),
          name: 'Other',
          surname: 'User',
        },
      });

      // Create todo for other user
      await prisma.todo.create({
        data: {
          title: 'Other User Todo',
          userId: otherUser.id,
        },
      });

      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.todos).toHaveLength(3);
      response.body.todos.forEach((todo: any) => {
        expect(todo.userId).toBe(userId);
      });
    });
  });

  describe('GET /api/todos/:id', () => {
    it('should get a specific todo', async () => {
      const todo = await prisma.todo.create({
        data: {
          title: 'Specific Todo',
          description: 'For get test',
          userId,
        },
      });

      const response = await request(app)
        .get(`/api/todos/${todo.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.todo).toEqual({
        id: todo.id,
        title: 'Specific Todo',
        description: 'For get test',
        status: 'PENDING',
        priority: null,
        estimatedTimeMinutes: null,
        subtasks: null,
        userId,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should return 404 for non-existent todo', async () => {
      await request(app)
        .get('/api/todos/9999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 404 for other users todo', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          password: await hashPassword('password123'),
          name: 'Other',
          surname: 'User',
        },
      });

      const otherTodo = await prisma.todo.create({
        data: {
          title: 'Other Todo',
          userId: otherUser.id,
        },
      });

      await request(app)
        .get(`/api/todos/${otherTodo.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/todos/:id', () => {
    it('should update todo', async () => {
      const todo = await prisma.todo.create({
        data: {
          title: 'Update Test',
          userId,
        },
      });

      const response = await request(app)
        .put(`/api/todos/${todo.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title',
          description: 'Updated description',
          status: 'IN_PROGRESS',
        })
        .expect(200);

      expect(response.body.todo.title).toBe('Updated Title');
      expect(response.body.todo.status).toBe('IN_PROGRESS');
    });

    it('should return 404 for non-existent todo', async () => {
      await request(app)
        .put('/api/todos/9999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated' })
        .expect(404);
    });
  });

  describe('DELETE /api/todos/:id', () => {
    it('should delete todo', async () => {
      const todo = await prisma.todo.create({
        data: {
          title: 'Delete Test',
          userId,
        },
      });

      await request(app)
        .delete(`/api/todos/${todo.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      const deleted = await prisma.todo.findUnique({
        where: { id: todo.id },
      });
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent todo', async () => {
      await request(app)
        .delete('/api/todos/9999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('GET /api/todos/analytics', () => {
    it('should return todo analytics', async () => {
      await prisma.todo.createMany({
        data: [
          { title: 'Pending 1', status: 'PENDING', userId },
          { title: 'Pending 2', status: 'PENDING', userId },
          { title: 'In Progress', status: 'IN_PROGRESS', userId },
          { title: 'Done 1', status: 'DONE', userId },
          { title: 'Done 2', status: 'DONE', userId },
          { title: 'Done 3', status: 'DONE', userId },
          { title: 'Deleted', status: 'DELETED', userId },
        ],
      });

      const response = await request(app)
        .get('/api/todos/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.analytics).toEqual({
        totals: {
          pending: 2,
          inProgress: 1,
          done: 3,
          deleted: 1,
        },
        timeline: expect.any(Array),
      });
    });
  });
});