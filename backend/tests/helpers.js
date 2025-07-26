const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper function to create a test user
const createTestUser = async (userData = {}) => {
  const defaultUser = {
    name: 'Test User',
    email: 'test@plantation.com',
    passwordHash: 'password123',
    role: 'field'
  };

  const user = new User({ ...defaultUser, ...userData });
  await user.save();
  return user;
};

// Helper function to create multiple test users
const createTestUsers = async () => {
  const manager = await createTestUser({
    name: 'Test Manager',
    email: 'manager@test.com',
    role: 'manager'
  });

  const analyst = await createTestUser({
    name: 'Test Analyst',
    email: 'analyst@test.com',
    role: 'analyst'
  });

  const fieldWorker = await createTestUser({
    name: 'Test Field Worker',
    email: 'field@test.com',
    role: 'field'
  });

  return { manager, analyst, fieldWorker };
};

// Helper function to generate JWT token for testing
const generateTestToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

// Helper function to get authorization header
const getAuthHeader = (token) => {
  return { Authorization: `Bearer ${token}` };
};

module.exports = {
  createTestUser,
  createTestUsers,
  generateTestToken,
  getAuthHeader
};
