import request from 'supertest';
import app from '../src/app.js';
import { prisma } from './setup.js';
import { hashPassword } from '../src/utils/auth.utils.js';

describe('File Upload Endpoints', () => {
  let authToken: string;
  let userId: number;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        email: 'upload@example.com',
        password: await hashPassword('password123'),
        name: 'Upload',
        surname: 'Test',
      },
    });

    userId = user.id;

    const login = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'upload@example.com',
        password: 'password123',
      });

    authToken = login.body.token;
  });

  afterEach(async () => {
    await prisma.todo.deleteMany();
    await prisma.user.deleteMany();
  });
  
  describe('POST /api/todos/upload', () => {
    const csvContent = `title,description,status
Todo 1,Description 1,PENDING
Todo 2,Description 2,IN_PROGRESS
Todo 3,Description 3,DONE`;

    const jsonContent = [
      { title: 'JSON Todo 1', description: 'JSON Desc 1', status: 'PENDING' },
      { title: 'JSON Todo 2', description: 'JSON Desc 2', status: 'DONE' },
    ];

    it('should upload CSV file', async () => {
      const response = await request(app)
        .post('/api/todos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(csvContent), {
          filename: 'todos.csv',
          contentType: 'text/csv',
        })
        .expect(201);

      expect(response.body).toEqual({
        message: 'Todos uploaded successfully',
        inserted: 3,
      });

      // Verify todos were created
      const todos = await prisma.todo.findMany({ where: { userId } });
      expect(todos).toHaveLength(3);
    });

    it('should upload JSON file', async () => {
      const response = await request(app)
        .post('/api/todos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(JSON.stringify(jsonContent)), {
          filename: 'todos.json',
          contentType: 'application/json',
        })
        .expect(201);

      expect(response.body.inserted).toBe(2);
    });

    it('should return 400 for missing file', async () => {
      await request(app)
        .post('/api/todos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should return 400 for unsupported file type', async () => {
      await request(app)
        .post('/api/todos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('test'), {
          filename: 'todos.txt',
          contentType: 'text/plain',
        })
        .expect(400);
    });

    it('should return 400 for todos without titles', async () => {
      const invalidJson = [{ description: 'No title' }];
      
      await request(app)
        .post('/api/todos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(JSON.stringify(invalidJson)), {
          filename: 'invalid.json',
          contentType: 'application/json',
        })
        .expect(400);
    });
  });
});