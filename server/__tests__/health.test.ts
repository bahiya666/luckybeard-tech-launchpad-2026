import request from 'supertest';
import app from '../src/app.js';

describe('Health Endpoint', () => {
  it('should return health status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);
    
    expect(response.body).toEqual({
      ok: true,
      message: 'API is healthy 🚀',
      timestamp: expect.any(String),
    });
  });
});