const router = require("express").Router();
const mongoose = require("mongoose");

const Turf = require("../models/Turf");
const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");


// create turf
router.post("/", auth, upload.array("images", 5), async (req, res) => {
  try {

    if (!mongoose.Types.ObjectId.isValid(req.userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const images = req.files ? req.files.map(file => file.filename) : [];

    const turf = new Turf({
      ...req.body,
      owner: req.userId,
      images
    });

    await turf.save();

    res.status(201).json(turf);

  } catch (error) {
    console.error("Create turf error:", error);
    res.status(500).json({ message: "Failed to create turf" });
  }
});



// Get all turfs

router.get("/", async (req, res) => {
  try {

    const turfs = await Turf.find().sort({ createdAt: -1 });

    res.json(turfs);

  } catch (error) {
    console.error("Fetch turfs error:", error);
    res.status(500).json({ message: "Failed to fetch turfs" });
  }
});



// Get owner turfs

router.get("/owner", auth, async (req, res) => {
  try {

    if (!mongoose.Types.ObjectId.isValid(req.userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const turfs = await Turf.find({ owner: req.userId });

    res.json(turfs);

  } catch (error) {
    console.error("Owner turfs error:", error);
    res.status(500).json({ message: "Failed to fetch owner turfs" });
  }
});



// Get turf by ID

router.get("/:id", async (req, res) => {
  try {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid turf ID" });
    }

    const turf = await Turf.findById(req.params.id);

    if (!turf) {
      return res.status(404).json({ message: "Turf not found" });
    }

    res.json(turf);

  } catch (error) {
    console.error("Get turf error:", error);
    res.status(500).json({ message: "Failed to fetch turf" });
  }
});



// Update turf
router.put("/:id", auth, async (req, res) => {
  try {

    const turf = await Turf.findById(req.params.id);

    if (!turf) {
      return res.status(404).json({ message: "Turf not found" });
    }

    if (turf.owner.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updatedTurf = await Turf.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedTurf);

  } catch (error) {
    console.error("Update turf error:", error);
    res.status(500).json({ message: "Failed to update turf" });
  }
});



// Delete turf

router.delete("/:id", auth, async (req, res) => {
  try {

    const turf = await Turf.findById(req.params.id);

    if (!turf) {
      return res.status(404).json({ message: "Turf not found" });
    }

    if (turf.owner.toString() !== req.userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Turf.findByIdAndDelete(req.params.id);

    res.json({ message: "Turf deleted successfully" });

  } catch (error) {
    console.error("Delete turf error:", error);
    res.status(500).json({ message: "Failed to delete turf" });
  }
});


module.exports = router;