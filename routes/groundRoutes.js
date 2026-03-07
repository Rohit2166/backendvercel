const router = require("express").Router();

const Ground = require("../models/Ground");
const User = require("../models/User");
const mongoose = require("mongoose");

const auth = require("../middleware/authMiddleware");

const { upload, cloudinary } = require("../middleware/upload");

// Helper function to get image URL from Cloudinary file
const getImageUrl = (file) => {
  if (!file) return null;
  
  // Check for Cloudinary secure_url (this is the full HTTPS URL)
  if (file.secure_url) return file.secure_url;
  
  // If it's already a full URL (Cloudinary HTTP), use it
  if (file.url) return file.url;
  
  // For disk storage, it returns just the filename - need to construct URL
  if (file.filename) {
    // Check if it's a full path or just a filename
    if (file.path && file.path.startsWith('http')) {
      return file.path;
    }
    // For disk storage on Vercel, this won't work - return null
    // Only Cloudinary URLs will work on Vercel
    return null;
  }
  
  return null;
};

// Add ground with image upload (owner only)
router.post("/add", auth, upload.array("images", 5), async (req, res) => {
  try {
    // Validate userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    // Get image URLs if files were uploaded (Cloudinary returns path as URL)
    const images = req.files ? req.files.map(file => getImageUrl(file)) : [];
    
    console.log("Creating ground with ownerId:", req.userId);
    console.log("Images uploaded:", images);
    
    // Ensure ownerId is a proper ObjectId
    const ownerIdObject = new mongoose.Types.ObjectId(req.userId);
    
    const ground = await Ground.create({
      ...req.body,
      ownerId: ownerIdObject,
      images: images
    });
    
    console.log("Ground created:", ground._id, "ownerId:", ground.ownerId);
    
    res.json(ground);
  } catch (error) {
    console.error("Error creating ground:", error);
    res.status(500).json({ message: error.message });
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


// Update ground with image upload
router.put("/:id", auth, upload.array("images", 5), async (req, res) => {
  try {
    const ground = await Ground.findById(req.params.id);
    if (!ground) {
      return res.status(404).json({ message: "Ground not found" });
    }
    
    // Check ownership - handle both ObjectId and string
    let ownerId = null;
    if (ground.ownerId) {
      ownerId = ground.ownerId.toString();
    }
    
    const userIdStr = req.userId ? req.userId.toString() : null;
    
    if (ownerId && userIdStr && ownerId !== userIdStr && ownerId !== "owner") {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    // Get new image URLs if files were uploaded
    const newImages = req.files ? req.files.map(file => getImageUrl(file)) : [];
    
    // Merge with existing images if any
    let updateData = { ...req.body };
    if (newImages.length > 0) {
      updateData.images = [...(ground.images || []), ...newImages];
    }
    
    const updatedGround = await Ground.findByIdAndUpdate(
      req.params.id,
      updateData,
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
    
    // Check ownership - handle both ObjectId and string
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


// Migration endpoint to fix existing grounds with string ownerId
router.post("/migrate", auth, async (req, res) => {
  try {
    // Only allow owner users
    const user = await User.findById(req.userId);
    if (!user || (user.role !== "owner" && user.role !== "admin")) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    // Find all grounds with string ownerId
    const invalidGrounds = await Ground.find({ 
      ownerId: { $type: "string" }
    });
    
    console.log(`Found ${invalidGrounds.length} grounds with string ownerId`);
    
    // Update each ground to set ownerId to null
    let updatedCount = 0;
    for (const ground of invalidGrounds) {
      if (ground.ownerId === "owner" || ground.ownerId === "") {
        ground.ownerId = null;
        await ground.save();
        updatedCount++;
      }
    }
    
    res.json({ 
      message: "Migration completed", 
      updatedCount 
    });
  } catch (error) {
    console.error("Migration error:", error);
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
