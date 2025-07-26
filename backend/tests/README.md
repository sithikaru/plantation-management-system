# Authentication Tests

This directory contains comprehensive tests for the authentication system of the Plantation Management System backend.

## Test Structure

### Test Files

1. **`auth.test.js`** - Tests for authentication routes and controllers
2. **`middleware.test.js`** - Tests for authentication middleware and authorization
3. **`user.test.js`** - Tests for the User model and its methods
4. **`setup.js`** - Test environment setup and teardown
5. **`helpers.js`** - Test utility functions and helpers

### Test Environment

- **Database**: MongoDB Memory Server (in-memory database for testing)
- **Framework**: Jest with Supertest for HTTP testing
- **Environment**: Isolated test environment with `.env.test` configuration

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage

Current test coverage:
- **Statements**: 89.33%
- **Branches**: 90.47%
- **Functions**: 100%
- **Lines**: 89.11%

## Test Categories

### Authentication Routes (`auth.test.js`)

#### User Registration (`POST /api/auth/register`)
- ✅ Successful user registration
- ✅ Default role assignment
- ✅ Missing required fields validation
- ✅ Invalid email validation
- ✅ Short password validation
- ✅ Duplicate email prevention
- ✅ Invalid role validation

#### User Login (`POST /api/auth/login`)
- ✅ Successful login with valid credentials
- ✅ Missing credentials validation
- ✅ Invalid email handling
- ✅ Invalid password handling
- ✅ Inactive user prevention
- ✅ Last login timestamp update

#### Profile Management (`GET/PUT /api/auth/profile`)
- ✅ Get user profile with valid token
- ✅ Update user profile
- ✅ Token validation
- ✅ Inactive user handling

#### Password Management (`PUT /api/auth/change-password`)
- ✅ Successful password change
- ✅ Current password verification
- ✅ New password validation
- ✅ Required fields validation

### Authentication Middleware (`middleware.test.js`)

#### Protection Middleware (`protect`)
- ✅ Valid token access
- ✅ Missing token denial
- ✅ Invalid token denial
- ✅ Malformed header handling
- ✅ Inactive user handling

#### Authorization Middleware (`authorize`)
- ✅ Role-based access control
- ✅ Manager-only access (`isManager`)
- ✅ Manager/Analyst access (`isManagerOrAnalyst`)
- ✅ All roles access (`isFieldWorkerOrHigher`)

### User Model (`user.test.js`)

#### User Creation
- ✅ Valid user creation
- ✅ Default role assignment
- ✅ Email lowercase conversion
- ✅ Field trimming
- ✅ Timestamp updates

#### Validation
- ✅ Required fields validation
- ✅ Email format validation
- ✅ Role enum validation
- ✅ Password length validation
- ✅ Name length validation
- ✅ Email uniqueness validation

#### Password Hashing
- ✅ Automatic password hashing
- ✅ Hash preservation on non-password updates

#### Instance Methods
- ✅ Password comparison (`comparePassword`)
- ✅ JSON serialization without password (`toJSON`)

#### Static Methods
- ✅ Email-based user lookup (`findByEmail`)
- ✅ Role-based user filtering (`findByRole`)
- ✅ Case-insensitive email search

## Test Helpers

### Database Helpers
- `createTestUser()` - Creates a single test user
- `createTestUsers()` - Creates users for all roles (manager, analyst, field)

### Authentication Helpers
- `generateTestToken()` - Creates JWT tokens for testing
- `getAuthHeader()` - Formats Authorization headers

## Environment Configuration

### Test Environment Variables (`.env.test`)
```env
NODE_ENV=test
PORT=5001
MONGO_URI=mongodb://localhost:27017/plantation-management-test
JWT_SECRET=test-super-secret-jwt-key-for-testing-only
JWT_EXPIRES_IN=1h
```

## Test Database

- Uses **MongoDB Memory Server** for isolated testing
- Database is created fresh for each test suite
- All collections are cleared after each test
- No external database dependencies

## Best Practices

1. **Isolation**: Each test is independent and doesn't affect others
2. **Cleanup**: Database is cleaned after each test
3. **Realistic Data**: Tests use realistic user data and scenarios
4. **Error Testing**: Both success and failure scenarios are tested
5. **Security Testing**: Authentication and authorization are thoroughly tested

## Common Test Patterns

### Testing Protected Routes
```javascript
const response = await request(app)
  .get('/protected-route')
  .set(getAuthHeader(token))
  .expect(200);
```

### Testing Authentication
```javascript
const user = await createTestUser();
const token = generateTestToken(user._id, user.role);
```

### Testing Validation Errors
```javascript
const response = await request(app)
  .post('/api/auth/register')
  .send({ /* invalid data */ })
  .expect(400);

expect(response.body.success).toBe(false);
```

## Debugging Tests

### View Test Output
```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test auth.test.js

# Run tests matching a pattern
npm test -- --testNamePattern="login"
```

### Common Issues
1. **Port conflicts**: Tests use port 5001 by default
2. **Database cleanup**: Ensure all async operations complete
3. **Token expiration**: Test tokens expire in 1 hour

This comprehensive test suite ensures the authentication system is robust, secure, and reliable.
