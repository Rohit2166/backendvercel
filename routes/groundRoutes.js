const express = require("express");
const router = express.Router();

const Ground = require("../models/Ground");

const multer = require("multer");

const path = require("path");

const authMiddleware = require("../middleware/authMiddleware");

const storage = multer.diskStorage({

  destination: "uploads",

  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }

});

const upload = multer({ storage });

const uploadMultiple = multer({ storage }).array("images", 10);



router.post("/add", authMiddleware, uploadMultiple, async(req,res)=>{

  try {
    const { name, address, location, price, sport, description } = req.body;

    const images = req.files ? req.files.map(f => f.filename) : [];
    const primaryImage = images.length > 0 ? images[0] : null;

    const ground = new Ground({
      name,
      address,
      location,
      price,
      sport,
      description,
      image: primaryImage,
      images: images,
      ownerId: req.userId
    });

    await ground.save();

    res.status(201).json({
      message: "Ground added successfully",
      ground
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }

});




router.get("/", async(req,res)=>{

  try {
    const grounds = await Ground.find().populate("ownerId", "name email phone");
    res.json(grounds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }

});




router.get("/sport/:sport", async(req,res)=>{

  try {
    const grounds = await Ground.find({ sport: req.params.sport }).populate("ownerId", "name email phone");
    res.json(grounds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }

});




router.get("/:id", async (req, res) => {

  try {
    const ground = await Ground.findById(req.params.id).populate("ownerId", "name email phone");
    if (!ground) {
      return res.status(404).json({ message: "Ground not found" });
    }
    res.json(ground);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }

});




router.get("/owner/grounds", authMiddleware, async(req,res)=>{

  try {
    const grounds = await Ground.find({ ownerId: req.userId });
    res.json(grounds);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }

});


//  for update 

router.put("/:id", authMiddleware, uploadMultiple, async(req,res)=>{

  try {
    const { name, address, location, price, sport, description } = req.body;

    const ground = await Ground.findById(req.params.id);

    if (ground.ownerId.toString() !== req.userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (name) ground.name = name;
    if (address) ground.address = address;
    if (location) ground.location = location;
    if (price) ground.price = price;
    if (sport) ground.sport = sport;
    if (description) ground.description = description;
    
    // Handle multiple images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(f => f.filename);
      ground.images = newImages;
      ground.image = newImages[0];
    }

    await ground.save();

    res.json({
      message: "Ground updated successfully",
      ground
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }

});


// Delete ground

router.delete("/:id", authMiddleware, async(req,res)=>{

  try {
    const ground = await Ground.findById(req.params.id);

    if (ground.ownerId.toString() !== req.userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await Ground.findByIdAndDelete(req.params.id);

    res.json({ message: "Ground deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }

});

module.exports = router;