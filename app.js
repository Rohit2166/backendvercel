const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// ✅ Import cached DB connection (for Vercel)
const connectDB = require("./config/db");

// Routes
const userRoutes = require("./routes/userRoutes");
const groundRoutes = require("./routes/groundRoutes");
const turfRoutes = require("./routes/turfRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const contactRoutes = require("./routes/contactRoutes");

dotenv.config();

const app = express();

// ✅ Connect MongoDB
connectDB();


// ✅ CORS (allow frontend)
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true
}));


// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ✅ Static folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// ✅ Routes
app.use("/api/users", userRoutes);

app.use("/api/grounds", groundRoutes);

app.use("/api/turfs", turfRoutes);

app.use("/api/bookings", bookingRoutes);

app.use("/api/contact", contactRoutes);


// ✅ Test routes
app.get("/", (req, res) => {

  res.send("CRICBOX Backend is Running 🚀");

});


app.get("/test", (req, res) => {

  res.send("Backend + DB working");

});


// ✅ Run locally only
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "production") {

  app.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);

  });

}


// ✅ Export for Vercel
module.exports = app;