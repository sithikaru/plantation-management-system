const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for seeding...');

    // Check if manager already exists
    const existingManager = await User.findByEmail('manager@plantation.com');
    if (existingManager) {
      console.log('Manager user already exists!');
      process.exit(0);
    }

    // Create initial manager user
    const manager = new User({
      name: 'System Manager',
      email: 'manager@plantation.com',
      passwordHash: 'password123', // Will be hashed
      role: 'manager'
    });

    await manager.save();
    console.log('Manager user created successfully!');
    console.log('Email: manager@plantation.com');
    console.log('Password: password123');

    // Create sample field worker
    const fieldWorker = new User({
      name: 'Field Worker',
      email: 'field@plantation.com',
      passwordHash: 'password123',
      role: 'field'
    });

    await fieldWorker.save();
    console.log('Field worker created successfully!');

    // Create sample analyst
    const analyst = new User({
      name: 'Data Analyst',
      email: 'analyst@plantation.com',
      passwordHash: 'password123',
      role: 'analyst'
    });

    await analyst.save();
    console.log('Analyst user created successfully!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

// Run the seeder
seedUsers();
