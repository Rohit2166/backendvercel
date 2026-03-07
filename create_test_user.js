const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get User model
    const User = require('./models/User');
    
    // Check if test user exists
    const existingUser = await User.findOne({ email: 'test@cricbox.com' });
    
    if (existingUser) {
      console.log('📋 Test user already exists');
      
      // Test password
      const testPassword = 'test123456';
      const valid = await bcrypt.compare(testPassword, existingUser.password);
      console.log('✅ Password "test123456" valid:', valid);
      
      if (!valid) {
        // Update password
        const hash = await bcrypt.hash(testPassword, 10);
        existingUser.password = hash;
        await existingUser.save();
        console.log('✅ Password updated to "test123456"');
      }
    } else {
      // Create new test user
      const hash = await bcrypt.hash('test123456', 10);
      const newUser = new User({
        name: 'Test User',
        email: 'test@cricbox.com',
        password: hash,
        role: 'customer'
      });
      
      await newUser.save();
      console.log('✅ Test user created: test@cricbox.com / test123456');
    }
    
    // List all users
    const users = await User.find({}).select('name email');
    console.log('📋 All users:', users);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createTestUser();

