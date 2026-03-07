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

// Import routes (wrap in try-catch to prevent crashes)
let userRoutes, groundRoutes, turfRoutes, bookingRoutes, contactRoutes;

try {
  userRoutes = require("./routes/userRoutes");
  groundRoutes = require("./routes/groundRoutes");
  turfRoutes = require("./routes/turfRoutes");
  bookingRoutes = require("./routes/bookingRoutes");
  contactRoutes = require("./routes/contactRoutes");
} catch (err) {
  console.error("Error loading routes:", err.message);
}

const app = express();


// ================================
// DATABASE CONNECTION
// ================================
let dbConnected = false;

const connectDB = async () => {
  if (dbConnected) return true;
  
  if (!process.env.MONGO_URI) {
    console.log("⚠️ MONGO_URI not set in environment variables");
    return false;
  }
  
  try {
    await mongoose.connect(process.env.MONGO_URI);
    dbConnected = true;
    console.log("✅ MongoDB Connected");
    return true;
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    return false;
  }
};


// ================================
// CORS CONFIG
// ================================
// Allow all origins for Vercel deployment - simpler configuration
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));


// ================================
// BODY PARSER
// ================================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));


// ================================
// STATIC FILES
// ================================
try {
  app.use("/uploads", express.static("uploads"));
} catch (e) {}


// ================================
// TEST ROUTES
// ================================
app.get("/", (req, res) => {
  res.send("CRICBOX Backend Running Successfully 🚀");
});

app.get("/api/health", async (req, res) => {
  const dbOk = await connectDB();
  res.json({
    status: "ok",
    message: "Backend is running",
    mongoUri: !!process.env.MONGO_URI,
    dbConnected: dbOk,
    timestamp: new Date().toISOString()
  });
});


// ================================
// DATABASE MIDDLEWARE
// ================================
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database error:", error.message);
    res.status(500).json({ message: "Database connection failed" });
  }
});


// ================================
// API ROUTES
// ================================
if (userRoutes) app.use("/api/users", userRoutes);
if (groundRoutes) app.use("/api/grounds", groundRoutes);
if (turfRoutes) app.use("/api/turfs", turfRoutes);
if (bookingRoutes) app.use("/api/bookings", bookingRoutes);
if (contactRoutes) app.use("/api/contact", contactRoutes);


// ================================
// LOCAL SERVER RUN
// ================================
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, async () => {
    console.log("Server running on port", PORT);
    await connectDB();
  });
}


// ================================
// EXPORT FOR VERCEL
// ================================
module.exports = app;
