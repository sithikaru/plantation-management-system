const request = require('supertest');
const express = require('express');
const { protect, authorize, isManager, isManagerOrAnalyst, isFieldWorkerOrHigher } = require('../middleware/auth');
const { createTestUsers, generateTestToken, getAuthHeader } = require('./helpers');

// Create a test app to test middleware
const createTestApp = (middleware) => {
  const app = express();
  app.use(express.json());
  
  // Apply the middleware being tested
  app.get('/test', middleware, (req, res) => {
    res.json({
      success: true,
      user: req.user
    });
  });

  return app;
};

describe('Auth Middleware', () => {
  let users, tokens;

  beforeEach(async () => {
    users = await createTestUsers();
    tokens = {
      manager: generateTestToken(users.manager._id, users.manager.role),
      analyst: generateTestToken(users.analyst._id, users.analyst.role),
      fieldWorker: generateTestToken(users.fieldWorker._id, users.fieldWorker.role)
    };
  });

  describe('protect middleware', () => {
    const app = createTestApp(protect);

    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/test')
        .set(getAuthHeader(tokens.manager))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.userId).toBe(users.manager._id.toString());
      expect(response.body.user.role).toBe('manager');
    });

    it('should deny access without token', async () => {
      const response = await request(app)
        .get('/test')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No token provided.');
    });

    it('should deny access with invalid token', async () => {
      const response = await request(app)
        .get('/test')
        .set(getAuthHeader('invalid-token'))
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token.');
    });

    it('should deny access with malformed Authorization header', async () => {
      const response = await request(app)
        .get('/test')
        .set({ Authorization: 'InvalidFormat token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No token provided.');
    });

    it('should deny access for inactive user', async () => {
      // Deactivate user
      users.manager.isActive = false;
      await users.manager.save();

      const response = await request(app)
        .get('/test')
        .set(getAuthHeader(tokens.manager))
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token. User not found or inactive.');
    });
  });

  describe('authorize middleware', () => {
    it('should allow access for authorized role', async () => {
      const app = createTestApp([protect, authorize('manager', 'analyst')]);

      const response = await request(app)
        .get('/test')
        .set(getAuthHeader(tokens.manager))
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should deny access for unauthorized role', async () => {
      const app = createTestApp([protect, authorize('manager')]);

      const response = await request(app)
        .get('/test')
        .set(getAuthHeader(tokens.fieldWorker))
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Access denied. Role 'field' is not authorized to access this resource.");
    });

    it('should deny access without authentication', async () => {
      const app = createTestApp(authorize('manager'));

      const response = await request(app)
        .get('/test')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. Authentication required.');
    });
  });

  describe('isManager middleware', () => {
    const app = createTestApp([protect, isManager]);

    it('should allow access for manager', async () => {
      const response = await request(app)
        .get('/test')
        .set(getAuthHeader(tokens.manager))
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should deny access for analyst', async () => {
      const response = await request(app)
        .get('/test')
        .set(getAuthHeader(tokens.analyst))
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should deny access for field worker', async () => {
      const response = await request(app)
        .get('/test')
        .set(getAuthHeader(tokens.fieldWorker))
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('isManagerOrAnalyst middleware', () => {
    const app = createTestApp([protect, isManagerOrAnalyst]);

    it('should allow access for manager', async () => {
      const response = await request(app)
        .get('/test')
        .set(getAuthHeader(tokens.manager))
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should allow access for analyst', async () => {
      const response = await request(app)
        .get('/test')
        .set(getAuthHeader(tokens.analyst))
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should deny access for field worker', async () => {
      const response = await request(app)
        .get('/test')
        .set(getAuthHeader(tokens.fieldWorker))
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('isFieldWorkerOrHigher middleware', () => {
    const app = createTestApp([protect, isFieldWorkerOrHigher]);

    it('should allow access for manager', async () => {
      const response = await request(app)
        .get('/test')
        .set(getAuthHeader(tokens.manager))
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should allow access for analyst', async () => {
      const response = await request(app)
        .get('/test')
        .set(getAuthHeader(tokens.analyst))
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should allow access for field worker', async () => {
      const response = await request(app)
        .get('/test')
        .set(getAuthHeader(tokens.fieldWorker))
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
