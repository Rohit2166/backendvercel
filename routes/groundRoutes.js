const router = require("express").Router();

const Ground = require("../models/Ground");
const User = require("../models/User");
const mongoose = require("mongoose");

const auth = require("../middleware/authMiddleware");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "demo",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Add ground with image upload (owner only)
router.post("/add", async (req, res) => {
  try {
    // Get auth token from header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }
    
    const token = authHeader.split(" ")[1];
    const jwt = require("jsonwebtoken");
    const secret = process.env.JWT_SECRET || "defaultsecretkey";
    
    let userId;
    try {
      const decoded = jwt.verify(token, secret);
      userId = decoded.id;
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
    
    // Validate userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    // Get base64 images from body and upload to Cloudinary
    let images = [];
    if (req.body.images && Array.isArray(req.body.images)) {
      for (const base64Image of req.body.images) {
        try {
          if (base64Image && base64Image.startsWith('data:')) {
            // Upload to Cloudinary
            const uploadResponse = await cloudinary.uploader.upload(base64Image, {
              folder: "cricbox",
              resource_type: "image",
              timeout: 120000
            });
            images.push(uploadResponse.secure_url);
          }
        } catch (uploadErr) {
          console.error("Image upload error:", uploadErr.message);
        }
      }
    }
    
    console.log("Creating ground with ownerId:", userId);
    console.log("Images uploaded to Cloudinary:", images.length);
    
    const ownerIdObject = new mongoose.Types.ObjectId(userId);
    
    const ground = await Ground.create({
      name: req.body.name,
      location: req.body.location,
      address: req.body.address,
      sport: req.body.sport,
      price: req.body.price,
      description: req.body.description,
      ownerId: ownerIdObject,
      images: images
    });
    
    console.log("Ground created:", ground._id);
    
    res.json(ground);
  } catch (error) {
    console.error("Error creating ground:", error);
    res.status(500).json({ message: error.message || "Failed to create ground" });
  }
});


// Get all grounds (public)
router.get("/", async (req, res) => {
  try {
    const data = await Ground.find();
    res.json(data);
  } catch (error) {
    console.error("Error fetching grounds:", error);
    res.status(500).json({ message: error.message });
  }
});


// Get owner's turfs
router.get("/owner", auth, async (req, res) => {
  try {
    console.log("Fetching grounds for userId:", req.userId);
    
    let grounds = [];
    
    // First, get ALL grounds and filter in memory to avoid ObjectId casting issues
    const allGrounds = await Ground.find({});
    
    // Filter grounds that belong to this user
    // Handle both ObjectId and string ownerId
    const userIdStr = req.userId.toString();
    
    grounds = allGrounds.filter(ground => {
      if (!ground.ownerId) return false;
      
      const ownerIdStr = ground.ownerId.toString();
      
      // Match by ObjectId string or string comparison
      return ownerIdStr === userIdStr || 
             ownerIdStr === "owner" || 
             ownerIdStr === req.userId;
    });
    
    console.log("Found grounds:", grounds.length);
    
    res.json(grounds);
  } catch (error) {
    console.error("Error fetching owner grounds:", error);
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
    console.error("Error fetching grounds by sport:", error);
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
    console.error("Error fetching ground:", error);
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
    let ownerId = null;
    if (ground.ownerId) {
      ownerId = ground.ownerId.toString();
    }
    
    const userIdStr = req.userId ? req.userId.toString() : null;
    
    if (ownerId && userIdStr && ownerId !== userIdStr && ownerId !== "owner") {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    // Process images - handle both existing URLs and new base64 images
    let finalImages = [];
    
    if (req.body.images && Array.isArray(req.body.images)) {
      for (const img of req.body.images) {
        if (!img) continue;
        
        // If it's already a Cloudinary URL or http URL, keep it as is
        if (img.startsWith('http://') || img.startsWith('https://')) {
          finalImages.push(img);
        }
        // If it's a new base64 image, upload to Cloudinary
        else if (img.startsWith('data:')) {
          try {
            const uploadResponse = await cloudinary.uploader.upload(img, {
              folder: "cricbox",
              resource_type: "image",
              timeout: 120000
            });
            finalImages.push(uploadResponse.secure_url);
          } catch (uploadErr) {
            console.error("Image upload error:", uploadErr.message);
          }
        }
      }
    }
    
    console.log("Updating ground with images:", finalImages.length);
    
    const updatedGround = await Ground.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        location: req.body.location,
        address: req.body.address,
        sport: req.body.sport,
        price: req.body.price,
        description: req.body.description,
        images: finalImages.slice(0, 5)
      },
      { new: true }
    );
    res.json(updatedGround);
  } catch (error) {
    console.error("Error updating ground:", error);
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
    let ownerId = null;
    if (ground.ownerId) {
      ownerId = ground.ownerId.toString();
    }
    
    const userIdStr = req.userId ? req.userId.toString() : null;
    
    if (ownerId && userIdStr && ownerId !== userIdStr && ownerId !== "owner") {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    // Delete images from Cloudinary if they exist
    if (ground.images && ground.images.length > 0) {
      for (const imageUrl of ground.images) {
        try {
          // Extract public ID from Cloudinary URL
          const publicId = imageUrl.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`cricbox/${publicId}`);
        } catch (err) {
          console.error("Error deleting image from Cloudinary:", err);
        }
      }
    }
    
    await Ground.findByIdAndDelete(req.params.id);
    res.json({ message: "Ground deleted successfully" });
  } catch (error) {
    console.error("Error deleting ground:", error);
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;

