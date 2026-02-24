const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");

const userRoutes = require("./routes/userRoutes");
const groundRoutes = require("./routes/groundRoutes");
const turfRoutes = require("./routes/turfRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const contactRoutes = require("./routes/contactRoutes");

const app = express();


// ✅ MIDDLEWARE

app.use(cors({
  origin: "*",
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ✅ SERVE STATIC FILES (UPLOADS)
app.use("/uploads", express.static("uploads"));



// ✅ ROUTES

app.use("/api/users", userRoutes);

app.use("/api/grounds", groundRoutes);

app.use("/api/turfs", turfRoutes);

app.use("/api/bookings", bookingRoutes);

app.use("/api/contact", contactRoutes);



// ✅ TEST ROUTE

app.get("/", (req, res) => {
  res.send("CRICBOX Backend Running Successfully 🚀");
});


// ✅ CONNECT DATABASE MIDDLEWARE (ensures connection before each request in serverless)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("Database connection error:", err.message);
    res.status(503).json({ message: "Database service unavailable" });
  }
});


// ✅ LOCAL RUN

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



// ✅ EXPORT FOR VERCEL

module.exports = app;
