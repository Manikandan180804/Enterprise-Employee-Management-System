import request from 'supertest';
import app from '../src/app';

describe('Auth Endpoints', () => {
  it('should return 400 for missing credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.statusCode).toBe(400);
  });

  it('should return 400 for invalid email format', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'not-an-email',
      password: 'password123',
    });
    expect(res.statusCode).toBe(400);
  });

  it('should return 401 for wrong credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nonexistent@test.com',
      password: 'wrongpassword',
    });
    expect(res.statusCode).toBe(401);
  });

  it('should return 401 for protected routes without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

  it('health check should return 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
