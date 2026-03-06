const mongoose = require("mongoose");

// Global connection cache for serverless environments
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // If already connected, return the connection
  if (cached.conn) {
    console.log("✅ Using existing MongoDB connection");
    return cached.conn;
  }

  // If a connection promise exists, wait for it
  if (cached.promise) {
    console.log("⏳ Waiting for existing connection promise...");
    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (err) {
      console.error("❌ Error waiting for connection promise:", err);
      throw err;
    }
  }

  // Create new connection promise
  const MONGO_URI = process.env.MONGO_URI;
  
  if (!MONGO_URI) {
    console.error("❌ MONGO_URI environment variable is not defined");
    throw new Error("MONGO_URI environment variable is not defined");
  }

  console.log("🔄 Connecting to MongoDB...");
  console.log("📝 MongoDB URI:", MONGO_URI.substring(0, 30) + "...");

  // Connection options optimized for Vercel serverless
  const options = {
    bufferCommands: false, // Disable buffering for serverless
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 15000,
    retryWrites: true,
    retryReads: true,
  };

  try {
    cached.promise = mongoose.connect(MONGO_URI, options);
    cached.conn = await cached.promise;
    console.log("✅ MongoDB Connected Successfully");
    return cached.conn;
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    cached.promise = null;
    cached.conn = null;
    throw err;
  }
}

// Handle connection events
mongoose.connection.on('error', (err) => {
  console.error("❌ MongoDB connection error:", err);
});

mongoose.connection.on('disconnected', () => {
  console.log("⚠️ MongoDB disconnected");
  cached.conn = null;
  cached.promise = null;
});

mongoose.connection.on('connected', () => {
  console.log("✅ MongoDB connected");
});

module.exports = connectDB;
