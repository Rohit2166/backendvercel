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
// CORS CONFIG
// ================================
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      if (origin.includes('.vercel.app')) {
        return callback(null, true);
      }
      const msg = 'CORS not allowed';
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
try {
  app.use("/uploads", express.static("uploads"));
} catch (e) {}


// ================================
// TEST ROUTES (NO DB REQUIRED)
// ================================
app.get("/", (req, res) => {
  res.send("CRICBOX Backend Running Successfully 🚀");
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend is running",
    mongoUri: !!process.env.MONGO_URI,
    timestamp: new Date().toISOString()
  });
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
  app.listen(PORT, () => {
    console.log("Server running on port", PORT);
  });
}


// ================================
// EXPORT FOR VERCEL
// ================================
module.exports = app;
