import request from 'supertest';
import app from '../src/app.js';
import { prisma } from './setup.js'; 
import { hashPassword } from '../src/utils/auth.utils.js';

describe('Auth Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          name: 'New',
          surname: 'User',
        })
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toEqual({
        id: expect.any(Number),
        email: 'newuser@example.com',
        name: 'New',
        surname: 'User',
      });
    });

    it('should return 400 for missing fields', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' })
        .expect(400);
    });

    it('should return 400 for duplicate email', async () => {
      // Create user first
      await prisma.user.create({
        data: {
          email: 'duplicate@example.com',
          password: await hashPassword('password123'),
          name: 'Test',
          surname: 'User',
        },
      });

      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          name: 'Test',
          surname: 'User',
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await prisma.user.create({
        data: {
          email: 'login@example.com',
          password: await hashPassword('correctpassword'),
          name: 'Login',
          surname: 'Test',
        },
      });
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'correctpassword',
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('login@example.com');
    });

    it('should return 400 for invalid credentials', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword',
        })
        .expect(400);
    });

    it('should return 400 for non-existent user', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password',
        })
        .expect(400);
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken: string;

    beforeEach(async () => {
      // Create user and get token
      const user = await prisma.user.create({
        data: {
          email: 'me@example.com',
          password: await hashPassword('password123'),
          name: 'Me',
          surname: 'Test',
        },
      });

      // Login to get token
      const login = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'me@example.com',
          password: 'password123',
        });

      authToken = login.body.token;
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.user).toEqual({
        id: expect.any(Number),
        email: 'me@example.com',
        name: 'Me',
        surname: 'Test',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('should return 401 without token', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });

    it('should return 401 with invalid token', async () => {
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('DELETE /api/auth/me', () => {
    let authToken: string;
    let userId: number;

    beforeEach(async () => {
      const user = await prisma.user.create({
        data: {
          email: 'delete@example.com',
          password: await hashPassword('password123'),
          name: 'Delete',
          surname: 'Me',
        },
      });

      userId = user.id;

      const login = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'delete@example.com',
          password: 'password123',
        });

      authToken = login.body.token;
    });

    it('should soft delete user account', async () => {
      await request(app)
        .delete('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify soft delete
      const deletedUser = await prisma.user.findUnique({
        where: { id: userId },
      });
      expect(deletedUser?.deletedAt).not.toBeNull();
    });

    it('should prevent login after deletion', async () => {
      // Delete account
      await request(app)
        .delete('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Try to login
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'delete@example.com',
          password: 'password123',
        })
        .expect(400);
    });
  });
});