const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const app = express();

// ================================
// IMPORT ROUTES
// ================================
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

// ================================
// DATABASE CONNECTION
// ================================
let dbConnected = false;

const connectDB = async () => {
  if (dbConnected) return true;

  if (!process.env.MONGO_URI) {
    console.log("⚠️ MONGO_URI not set");
    return false;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    dbConnected = true;
    console.log("✅ MongoDB Connected");
    return true;
  } catch (err) {
    console.error("❌ MongoDB Error:", err.message);
    return false;
  }
};

// ================================
// CORS CONFIG
// ================================
app.use(cors({
  origin: "*",
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
// TEST ROUTES
// ================================
app.get("/", (req, res) => {
  res.send("CRICBOX Backend Running Successfully 🚀");
});

app.get("/api/health", async (req, res) => {
  const dbOk = await connectDB();

  res.json({
    status: "ok",
    backend: "running",
    mongoUri: !!process.env.MONGO_URI,
    dbConnected: dbOk,
    timestamp: new Date().toISOString()
  });
});

// ================================
// DATABASE MIDDLEWARE
// ================================
app.use(async (req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("Database error:", err.message);
    next();
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

