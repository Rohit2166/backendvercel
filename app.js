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
// TEST ROUTE
// ================================
app.get("/", (req, res) => {
  res.send("CRICBOX Backend Running Successfully 🚀");
});


// ================================
// DATABASE CONNECTION
// ================================

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {

    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(process.env.MONGO_URI, opts)
      .then((mongoose) => {
        console.log("MongoDB Connected");
        return mongoose;
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
