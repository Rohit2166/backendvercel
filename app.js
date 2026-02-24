const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./middleware/db");




dotenv.config();

const app = express();

connectDB();


app.use(cors());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
const _dirname = path.resolve();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/turfs", require("./routes/turfRoutes"));
app.get("/", (req, res) => {
  res.send("CRICBOX Backend is Running 🚀");
});

app.get("/test", (req, res) => {
  res.send("Backend + DB working");
});


const userRoutes = require("./routes/userRoutes");
const groundRoutes = require("./routes/groundRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const contactRoutes = require("./routes/contactRoutes");

app.use("/api/users", userRoutes);
app.use("/api/grounds", groundRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/contact", contactRoutes);

// app.use(express.static(path.join(_dirname,"/frontend/CRIC-BOX/dist")));
// app.get('/*',(req,res)=>{
//   res.sendFile(path.resolve(_dirname,"CRIC-BOX","dist","index.html"));
// });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.log("MongoDB connection error:", error);
  }
};

connectDB();

const PORT = process.env.PORT || 5000;

// Only run server locally, not on Vercel
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;

 