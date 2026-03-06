const router = require("express").Router();

const User = require("../models/User");

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

const auth = require("../middleware/authMiddleware");


// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || "defaultsecretkey",
    { expiresIn: "7d" }
  );
};


// signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required"
      });
    }

    // Check if user exists
    const exist = await User.findOne({ email: email.toLowerCase() });
    if (exist) {
      return res.status(400).json({
        message: "User already exists with this email"
      });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Create user with role (default to "customer")
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hash,
      role: role || "customer"
    });

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (e) {
    console.error("Signup error:", e);
    res.status(500).json({
      message: e.message || "Server error during signup"
    });
  }
});


// login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password"
      });
    }

    // Compare password
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({
        message: "Invalid email or password"
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({
      message: e.message || "Server error during login"
    });
  }
});


// get user profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (e) {
    console.error("Profile error:", e);
    res.status(500).json({
      message: e.message
    });
  }
});


module.exports = router;
