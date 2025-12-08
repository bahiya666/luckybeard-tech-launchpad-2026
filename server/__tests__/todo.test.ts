import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { hashPassword } from '../src/utils/auth.utils.js';

describe('Todo Endpoints', () => {
  let authToken: string;
  let userId: number;

  beforeEach(async () => {
    await prisma.todo.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'todotest@example.com',
        password: await hashPassword('password123'),
        name: 'Todo',
        surname: 'Test',
      },
    });

    userId = user.id;

    // Login to get token
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
    beforeEach(async () => {
      // Create some todos for the user
      await prisma.todo.createMany({
        data: [
          { title: 'Todo 1', userId },
          { title: 'Todo 2', userId, status: 'IN_PROGRESS' },
          { title: 'Todo 3', userId, status: 'DONE' },
        ],
      });
    });

    it('should list all todos for user', async () => {
      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.todos).toHaveLength(3);
      expect(response.body.todos[0]).toHaveProperty('title', 'Todo 3'); // Sorted by createdAt desc
    });

    it('should not show other users todos', async () => {
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

      // Should only see own todos
      expect(response.body.todos).toHaveLength(3);
      response.body.todos.forEach((todo: any) => {
        expect(todo.userId).toBe(userId);
      });
    });
  });

  describe('GET /api/todos/:id', () => {
    let todoId: number;

    beforeEach(async () => {
      const todo = await prisma.todo.create({
        data: {
          title: 'Specific Todo',
          description: 'For get test',
          userId,
        },
      });
      todoId = todo.id;
    });

    it('should get a specific todo', async () => {
      const response = await request(app)
        .get(`/api/todos/${todoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.todo).toEqual({
        id: todoId,
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
    let todoId: number;

    beforeEach(async () => {
      const todo = await prisma.todo.create({
        data: {
          title: 'Update Test',
          userId,
        },
      });
      todoId = todo.id;
    });

    it('should update todo', async () => {
      const response = await request(app)
        .put(`/api/todos/${todoId}`)
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
    let todoId: number;

    beforeEach(async () => {
      const todo = await prisma.todo.create({
        data: {
          title: 'Delete Test',
          userId,
        },
      });
      todoId = todo.id;
    });

    it('should delete todo', async () => {
      await request(app)
        .delete(`/api/todos/${todoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify deletion
      const deleted = await prisma.todo.findUnique({
        where: { id: todoId },
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
    beforeEach(async () => {
      // Create todos with different statuses
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
    });

    it('should return todo analytics', async () => {
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