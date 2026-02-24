const router = require("express").Router();

const User = require("../models/User");

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

const auth = require("../middleware/authMiddleware");


// signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const exist = await User.findOne({ email });
    if (exist) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Create user with role (default to "customer")
    const user = await User.create({
      name,
      email,
      password: hash,
      role: role || "customer"
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "defaultsecretkey"
    );

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
    res.status(500).json({
      message: e.message
    });
  }
});


// login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
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
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "defaultsecretkey"
    );

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
    res.status(500).json({
      message: e.message
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
    res.status(500).json({
      message: e.message
    });
  }
});


module.exports = router;
