const router = require("express").Router();

const Turf = require("../models/Turf");

const auth = require("../middleware/authMiddleware");

const upload = require("../middleware/upload");


// Create new turf with image upload
router.post("/", auth, upload.array("images", 5), async (req, res) => {
  try {
    // Validate userId is a valid ObjectId
    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(req.userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    // Get image filenames if files were uploaded
    const images = req.files ? req.files.map(file => file.filename) : [];
    
    const turf = await Turf.create({
      ...req.body,
      owner: req.userId,
      images: images
    });
    res.json(turf);
  } catch (error) {
    console.error("Error creating turf:", error);
    res.status(500).json({ message: error.message });
  }
});


// Get all turfs (public)
router.get("/", async (req, res) => {
  try {
    const turfs = await Turf.find();
    res.json(turfs);
  } catch (error) {
    console.error("Error fetching turfs:", error);
    res.status(500).json({ message: error.message });
  }
});


// Get owner's turfs - THIS MUST BE BEFORE /:id ROUTE
router.get("/owner", auth, async (req, res) => {
  try {
    const mongoose = require("mongoose");
    
    // If userId is valid ObjectId, use it
    let turfs = [];
    if (mongoose.Types.ObjectId.isValid(req.userId)) {
      turfs = await Turf.find({ owner: req.userId });
    }
    
    // If no turfs found with ObjectId, also check for string "owner"
    if (turfs.length === 0) {
      turfs = await Turf.find({ owner: "owner" });
    }
    
    res.json(turfs);
  } catch (error) {
    console.error("Error fetching owner turfs:", error);
    res.status(500).json({ message: error.message });
  }
});


// Get turf by ID - THIS MUST BE AFTER /owner ROUTE
router.get("/:id", async (req, res) => {
  try {
    const turf = await Turf.findById(req.params.id);
    if (!turf) {
      return res.status(404).json({ message: "Turf not found" });
    }
    res.json(turf);
  } catch (error) {
    console.error("Error fetching turf:", error);
    res.status(500).json({ message: error.message });
  }
});


// Update turf
router.put("/:id", auth, async (req, res) => {
  try {
    const turf = await Turf.findById(req.params.id);
    if (!turf) {
      return res.status(404).json({ message: "Turf not found" });
    }
    
    // Check ownership - handle both ObjectId and string
    let ownerId = null;
    if (turf.owner) {
      ownerId = turf.owner.toString();
    }
    
    if (ownerId && ownerId !== req.userId && ownerId !== "owner") {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    const updatedTurf = await Turf.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedTurf);
  } catch (error) {
    console.error("Error updating turf:", error);
    res.status(500).json({ message: error.message });
  }
});


// Delete turf
router.delete("/:id", auth, async (req, res) => {
  try {
    const turf = await Turf.findById(req.params.id);
    if (!turf) {
      return res.status(404).json({ message: "Turf not found" });
    }
    
    // Check ownership - handle both ObjectId and string
    let ownerId = null;
    if (turf.owner) {
      ownerId = turf.owner.toString();
    }
    
    if (ownerId && ownerId !== req.userId && ownerId !== "owner") {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    await Turf.findByIdAndDelete(req.params.id);
    res.json({ message: "Turf deleted successfully" });
  } catch (error) {
    console.error("Error deleting turf:", error);
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
