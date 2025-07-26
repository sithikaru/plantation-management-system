const User = require('../models/User');
const mongoose = require('mongoose');

describe('User Model', () => {
  describe('User Creation', () => {
    it('should create a valid user', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@plantation.com',
        passwordHash: 'password123',
        role: 'field'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.name).toBe(userData.name);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.role).toBe(userData.role);
      expect(savedUser.isActive).toBe(true);
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
      
      // Password should be hashed
      expect(savedUser.passwordHash).not.toBe(userData.passwordHash);
      expect(savedUser.passwordHash).toBeDefined();
    });

    it('should set default role to field', async () => {
      const userData = {
        name: 'Jane Doe',
        email: 'jane@plantation.com',
        passwordHash: 'password123'
        // No role specified
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.role).toBe('field');
    });

    it('should convert email to lowercase', async () => {
      const userData = {
        name: 'John Doe',
        email: 'JOHN@PLANTATION.COM',
        passwordHash: 'password123',
        role: 'field'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.email).toBe('john@plantation.com');
    });

    it('should trim whitespace from name and email', async () => {
      const userData = {
        name: '  John Doe  ',
        email: '  john@plantation.com  ',
        passwordHash: 'password123',
        role: 'field'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.name).toBe('John Doe');
      expect(savedUser.email).toBe('john@plantation.com');
    });

    it('should update updatedAt field on save', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@plantation.com',
        passwordHash: 'password123',
        role: 'field'
      });

      const savedUser = await user.save();
      const originalUpdatedAt = savedUser.updatedAt;

      // Wait a bit and update
      await new Promise(resolve => setTimeout(resolve, 10));
      savedUser.name = 'Updated Name';
      const updatedUser = await savedUser.save();

      expect(updatedUser.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('User Validation', () => {
    it('should fail validation without required fields', async () => {
      const user = new User({});

      await expect(user.save()).rejects.toThrow();
    });

    it('should fail validation with invalid email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        passwordHash: 'password123',
        role: 'field'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    it('should fail validation with invalid role', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@plantation.com',
        passwordHash: 'password123',
        role: 'invalid-role'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    it('should fail validation with short password', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@plantation.com',
        passwordHash: '123',
        role: 'field'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    it('should fail validation with long name', async () => {
      const userData = {
        name: 'A'.repeat(101), // 101 characters
        email: 'john@plantation.com',
        passwordHash: 'password123',
        role: 'field'
      };

      const user = new User(userData);
      await expect(user.save()).rejects.toThrow();
    });

    it('should fail validation with duplicate email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@plantation.com',
        passwordHash: 'password123',
        role: 'field'
      };

      // Create first user
      const user1 = new User(userData);
      await user1.save();

      // Try to create second user with same email
      const user2 = new User(userData);
      await expect(user2.save()).rejects.toThrow();
    });
  });

  describe('Password Hashing', () => {
    it('should hash password on save', async () => {
      const originalPassword = 'password123';
      const user = new User({
        name: 'John Doe',
        email: 'john@plantation.com',
        passwordHash: originalPassword,
        role: 'field'
      });

      const savedUser = await user.save();
      expect(savedUser.passwordHash).not.toBe(originalPassword);
      expect(savedUser.passwordHash.length).toBeGreaterThan(originalPassword.length);
    });

    it('should not rehash password if not modified', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@plantation.com',
        passwordHash: 'password123',
        role: 'field'
      });

      const savedUser = await user.save();
      const originalHash = savedUser.passwordHash;

      // Update name but not password
      savedUser.name = 'Updated Name';
      const updatedUser = await savedUser.save();

      expect(updatedUser.passwordHash).toBe(originalHash);
    });
  });

  describe('Instance Methods', () => {
    let user;

    beforeEach(async () => {
      user = new User({
        name: 'John Doe',
        email: 'john@plantation.com',
        passwordHash: 'password123',
        role: 'field'
      });
      await user.save();
    });

    describe('comparePassword', () => {
      it('should return true for correct password', async () => {
        const isMatch = await user.comparePassword('password123');
        expect(isMatch).toBe(true);
      });

      it('should return false for incorrect password', async () => {
        const isMatch = await user.comparePassword('wrongpassword');
        expect(isMatch).toBe(false);
      });
    });

    describe('toJSON', () => {
      it('should exclude passwordHash from JSON output', () => {
        const json = user.toJSON();
        expect(json.passwordHash).toBeUndefined();
        expect(json.name).toBeDefined();
        expect(json.email).toBeDefined();
        expect(json.role).toBeDefined();
      });
    });
  });

  describe('Static Methods', () => {
    beforeEach(async () => {
      // Create test users
      await User.create([
        {
          name: 'Manager User',
          email: 'manager@plantation.com',
          passwordHash: 'password123',
          role: 'manager'
        },
        {
          name: 'Analyst User',
          email: 'analyst@plantation.com',
          passwordHash: 'password123',
          role: 'analyst'
        },
        {
          name: 'Field User',
          email: 'field@plantation.com',
          passwordHash: 'password123',
          role: 'field'
        },
        {
          name: 'Inactive User',
          email: 'inactive@plantation.com',
          passwordHash: 'password123',
          role: 'field',
          isActive: false
        }
      ]);
    });

    describe('findByEmail', () => {
      it('should find user by email', async () => {
        const user = await User.findByEmail('manager@plantation.com');
        expect(user).toBeTruthy();
        expect(user.email).toBe('manager@plantation.com');
      });

      it('should be case insensitive', async () => {
        const user = await User.findByEmail('MANAGER@PLANTATION.COM');
        expect(user).toBeTruthy();
        expect(user.email).toBe('manager@plantation.com');
      });

      it('should return null for non-existent email', async () => {
        const user = await User.findByEmail('nonexistent@plantation.com');
        expect(user).toBeNull();
      });
    });

    describe('findByRole', () => {
      it('should find users by role', async () => {
        const managers = await User.findByRole('manager');
        expect(managers).toHaveLength(1);
        expect(managers[0].role).toBe('manager');
      });

      it('should only return active users', async () => {
        const fieldUsers = await User.findByRole('field');
        expect(fieldUsers).toHaveLength(1); // Should not include inactive user
        expect(fieldUsers[0].isActive).toBe(true);
      });

      it('should return empty array for non-existent role', async () => {
        const users = await User.findByRole('nonexistent');
        expect(users).toHaveLength(0);
      });
    });
  });
});
