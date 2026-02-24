const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");


dotenv.config();

const app = express();


app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
const _dirname = path.resolve();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log("MongoDB already connected");
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    isConnected = db.connections[0].readyState;
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};

connectDB();

module.exports = app;

 