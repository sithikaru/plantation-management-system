const request = require('supertest');
const app = require('../src/app');
const User = require('../models/User');
const { createTestUser, createTestUsers, generateTestToken, getAuthHeader } = require('./helpers');

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@plantation.com',
        password: 'password123',
        role: 'field'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.role).toBe(userData.role);
      expect(response.body.data.user.passwordHash).toBeUndefined();
      expect(response.body.data.token).toBeDefined();

      // Verify user was created in database
      const user = await User.findByEmail(userData.email);
      expect(user).toBeTruthy();
      expect(user.name).toBe(userData.name);
    });

    it('should register a user with default role when role is not provided', async () => {
      const userData = {
        name: 'Jane Doe',
        email: 'jane@plantation.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.data.user.role).toBe('field');
    });

    it('should fail to register user with missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe'
          // Missing email and password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Please provide name, email, and password');
    });

    it('should fail to register user with invalid email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });

    it('should fail to register user with short password', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@plantation.com',
        password: '123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Password must be at least 6 characters long');
    });

    it('should fail to register user with duplicate email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@plantation.com',
        password: 'password123'
      };

      // Create first user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to create second user with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User with this email already exists');
    });

    it('should fail to register user with invalid role', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@plantation.com',
        password: 'password123',
        role: 'invalid-role'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user before each login test
      await createTestUser({
        email: 'test@plantation.com',
        passwordHash: 'password123'
      });
    });

    it('should login user with valid credentials', async () => {
      const loginData = {
        email: 'test@plantation.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.user.email).toBe(loginData.email);
      expect(response.body.data.user.passwordHash).toBeUndefined();
      expect(response.body.data.token).toBeDefined();

      // Verify lastLogin was updated
      const user = await User.findByEmail(loginData.email);
      expect(user.lastLogin).toBeTruthy();
    });

    it('should fail to login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Please provide email and password');
    });

    it('should fail to login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@plantation.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should fail to login with invalid password', async () => {
      const loginData = {
        email: 'test@plantation.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should fail to login with inactive user', async () => {
      // Create inactive user
      const user = await createTestUser({
        email: 'inactive@plantation.com',
        passwordHash: 'password123',
        isActive: false
      });

      const loginData = {
        email: 'inactive@plantation.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('GET /api/auth/profile', () => {
    let user, token;

    beforeEach(async () => {
      user = await createTestUser();
      token = generateTestToken(user._id, user.role);
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set(getAuthHeader(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user._id).toBe(user._id.toString());
      expect(response.body.data.user.email).toBe(user.email);
      expect(response.body.data.user.passwordHash).toBeUndefined();
    });

    it('should fail to get profile without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No token provided.');
    });

    it('should fail to get profile with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set(getAuthHeader('invalid-token'))
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token.');
    });

    it('should fail to get profile for inactive user', async () => {
      // Deactivate user
      user.isActive = false;
      await user.save();

      const response = await request(app)
        .get('/api/auth/profile')
        .set(getAuthHeader(token))
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid token. User not found or inactive.');
    });
  });

  describe('PUT /api/auth/profile', () => {
    let user, token;

    beforeEach(async () => {
      user = await createTestUser();
      token = generateTestToken(user._id, user.role);
    });

    it('should update user profile successfully', async () => {
      const updateData = {
        name: 'Updated Name'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set(getAuthHeader(token))
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.data.user.name).toBe(updateData.name);

      // Verify update in database
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.name).toBe(updateData.name);
    });

    it('should fail to update profile without token', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send({ name: 'Updated Name' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/change-password', () => {
    let user, token;

    beforeEach(async () => {
      user = await createTestUser();
      token = generateTestToken(user._id, user.role);
    });

    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'password123',
        newPassword: 'newpassword123'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set(getAuthHeader(token))
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password changed successfully');

      // Verify password was changed by trying to login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: passwordData.newPassword
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    it('should fail to change password with wrong current password', async () => {
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set(getAuthHeader(token))
        .send(passwordData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Current password is incorrect');
    });

    it('should fail to change password with short new password', async () => {
      const passwordData = {
        currentPassword: 'password123',
        newPassword: '123'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set(getAuthHeader(token))
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('New password must be at least 6 characters long');
    });

    it('should fail to change password without current password', async () => {
      const passwordData = {
        newPassword: 'newpassword123'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set(getAuthHeader(token))
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Please provide current password and new password');
    });

    it('should fail to change password without token', async () => {
      const passwordData = {
        currentPassword: 'password123',
        newPassword: 'newpassword123'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .send(passwordData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
