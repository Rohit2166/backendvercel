const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function testLogin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get User model
    const User = require('./models/User');
    
    // Find all users
    const users = await User.find({});
    console.log('📋 Users in database:', users.length);
    
    if (users.length > 0) {
      console.log('First user email:', users[0].email);
      console.log('First user password hash:', users[0].password);
      
      // Test password
      const testPassword = 'test123'; // Use the password you're testing with
      const valid = await bcrypt.compare(testPassword, users[0].password);
      console.log('✅ Password "test123" valid:', valid);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

testLogin();

