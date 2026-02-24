const mongoose = require("mongoose");

let cached = global.mongoose;

if (!cached) {

 cached = global.mongoose = { conn: null, promise: null };

}


async function connectDB() {

 // If already connected, return the connection
 if (cached.conn) {
   console.log("Using existing MongoDB connection");
   return cached.conn;
 }

 // If a connection promise exists, wait for it
 if (cached.promise) {
   console.log("Waiting for existing connection promise...");
   try {
     cached.conn = await cached.promise;
     return cached.conn;
   } catch (err) {
     console.error("Error waiting for connection promise:", err);
     throw err;
   }
 }

 // Create new connection promise
 const MONGO_URI = process.env.MONGO_URI;
 
 if (!MONGO_URI) {
   throw new Error("MONGO_URI environment variable is not defined");
 }

 console.log("Connecting to MongoDB...");

 // Connection options optimized for serverless/Vercel
 const options = {
   bufferCommands: false,
   maxPoolSize: 10,
   serverSelectionTimeoutMS: 5000,
   socketTimeoutMS: 45000,
 };

 cached.promise = mongoose.connect(MONGO_URI, options)
   .then((mongoose) => {
     console.log("MongoDB Connected Successfully");
     return mongoose;
   })
   .catch((err) => {
     console.error("MongoDB Connection Error:", err.message);
     cached.promise = null;
     throw err;
   });

 try {
   cached.conn = await cached.promise;
 } catch (err) {
   cached.promise = null;
   throw err;
 }

 return cached.conn;

}


module.exports = connectDB;
