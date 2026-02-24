const router = require("express").Router();

const Ground = require("../models/Ground");

const auth = require("../middleware/authMiddleware");


// Add ground (owner only)
router.post("/add", auth, async (req, res) => {
  try {
    const ground = await Ground.create({
      ...req.body,
      ownerId: req.userId
    });
    res.json(ground);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Get all grounds (public)
router.get("/", async (req, res) => {
  try {
    const data = await Ground.find();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Get ground by ID
router.get("/:id", async (req, res) => {
  try {
    const ground = await Ground.findById(req.params.id);
    if (!ground) {
      return res.status(404).json({ message: "Ground not found" });
    }
    res.json(ground);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Get grounds by sport type
router.get("/sport/:sport", async (req, res) => {
  try {
    const { sport } = req.params;
    const grounds = await Ground.find({ 
      sport: sport.toLowerCase() 
    });
    res.json(grounds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Update ground
router.put("/:id", auth, async (req, res) => {
  try {
    const ground = await Ground.findById(req.params.id);
    if (!ground) {
      return res.status(404).json({ message: "Ground not found" });
    }
    
    // Check ownership
    if (ground.ownerId && ground.ownerId.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    const updatedGround = await Ground.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedGround);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Delete ground
router.delete("/:id", auth, async (req, res) => {
  try {
    const ground = await Ground.findById(req.params.id);
    if (!ground) {
      return res.status(404).json({ message: "Ground not found" });
    }
    
    // Check ownership
    if (ground.ownerId && ground.ownerId.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    await Ground.findByIdAndDelete(req.params.id);
    res.json({ message: "Ground deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
