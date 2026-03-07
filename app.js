// const express = require("express");
// const cors = require("cors");
// const dotenv = require("dotenv");

// dotenv.config();

// const connectDB = require("./config/db");

// const userRoutes = require("./routes/userRoutes");
// const groundRoutes = require("./routes/groundRoutes");
// const turfRoutes = require("./routes/turfRoutes");
// const bookingRoutes = require("./routes/bookingRoutes");
// const contactRoutes = require("./routes/contactRoutes");

// const app = express();


// // ✅ MIDDLEWARE

// // CORS - allow all origins for development
// app.use(cors({
//   origin: "*",
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"]
// }));

// // Note: OPTIONS preflight is handled by cors() middleware above

// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ extended: true, limit: "10mb" }));


// // ✅ SERVE STATIC FILES (UPLOADS)
// app.use("/uploads", express.static("uploads"));



// // ✅ TEST ROUTE (before auth middleware)
// app.get("/", (req, res) => {
//   res.send("CRICBOX Backend Running Successfully 🚀");
// });



// // ✅ CONNECT DATABASE MIDDLEWARE (ensures connection before each request in serverless)
// let dbConnected = false;

// app.use(async (req, res, next) => {
//   try {
//     if (!dbConnected) {
//       await connectDB();
//       dbConnected = true;
//       console.log("Database connected");
//     }
//     next();
//   } catch (err) {
//     console.error("Database connection error:", err.message);
//     // Don't block the request, continue anyway
//     next();
//   }
// });


// // ✅ ROUTES

// app.use("/api/users", userRoutes);

// app.use("/api/grounds", groundRoutes);

// app.use("/api/turfs", turfRoutes);

// app.use("/api/bookings", bookingRoutes);

// app.use("/api/contact", contactRoutes);


// // ✅ LOCAL RUN

// if (process.env.NODE_ENV !== "production") {
//   const PORT = process.env.PORT || 5000;
//   app.listen(PORT, async () => {
//     console.log("Server running on port", PORT);
//     try {
//       await connectDB();
//       console.log("Database connected successfully");
//       dbConnected = true;
//     } catch (err) {
//       console.error("Failed to connect to database:", err.message);
//     }
//   });
// }



// // ✅ EXPORT FOR VERCEL

// module.exports = app;


const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const userRoutes = require("./routes/userRoutes");
const groundRoutes = require("./routes/groundRoutes");
const turfRoutes = require("./routes/turfRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const contactRoutes = require("./routes/contactRoutes");

const app = express();


// ================================
// CORS CONFIG
// ================================
// Allow both local development and deployed frontend
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://vercelfrontend-flame.vercel.app"
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      // For production, also allow if origin contains vercel.app
      if (origin.includes('.vercel.app')) {
        return callback(null, true);
      }
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));


// ================================
// BODY PARSER
// ================================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));


// ================================
// STATIC FILES
// ================================
app.use("/uploads", express.static("uploads"));


// ================================
// TEST ROUTE & HEALTH CHECK
// ================================
app.get("/", (req, res) => {
  res.send("CRICBOX Backend Running Successfully 🚀");
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  const mongoUri = process.env.MONGO_URI;
  res.json({
    status: "ok",
    message: "Backend is running",
    mongoConfigured: !!mongoUri,
    timestamp: new Date().toISOString()
  });
});


// ================================
// DATABASE CONNECTION
// ================================

// Check if MONGO_URI is configured
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("⚠️ MONGO_URI is not defined in environment variables!");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  
  // Check if MONGO_URI is available
  if (!MONGO_URI) {
    throw new Error("MONGO_URI is not configured. Please set MONGO_URI environment variable in Vercel dashboard.");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {

    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGO_URI, opts)
      .then((mongoose) => {
        console.log("MongoDB Connected");
        return mongoose;
      })
      .catch((err) => {
        console.error("MongoDB Connection Error:", err.message);
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};


// ================================
// DATABASE MIDDLEWARE
// ================================

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ message: "Database connection failed" });
  }
});


// ================================
// API ROUTES
// ================================

app.use("/api/users", userRoutes);

app.use("/api/grounds", groundRoutes);

app.use("/api/turfs", turfRoutes);

app.use("/api/bookings", bookingRoutes);

app.use("/api/contact", contactRoutes);


// ================================
// LOCAL SERVER RUN
// ================================

if (process.env.NODE_ENV !== "production") {

  const PORT = process.env.PORT || 5000;

  app.listen(PORT, async () => {

    console.log("Server running on port", PORT);

    try {
      await connectDB();
      console.log("Database connected successfully");
    } catch (err) {
      console.error("Failed to connect to database:", err.message);
    }

  });

}


// ================================
// EXPORT FOR VERCEL
// ================================

module.exports = app;
