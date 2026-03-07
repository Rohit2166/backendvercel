const multer = require("multer");
const path = require("path");

// Create a simple upload middleware that works without cloudinary
// This avoids the "Cannot find module" error when importing

let upload;
let cloudinary = null;

// Check if cloudinary can be loaded
let cloudinaryConfigured = false;
try {
  cloudinaryConfigured = !!(
    process.env.CLOUDINARY_CLOUD_NAME && 
    process.env.CLOUDINARY_API_KEY && 
    process.env.CLOUDINARY_API_SECRET
  );
} catch (e) {
  console.log("Cloudinary check failed:", e.message);
}

// Set up disk storage as default
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  }
});

// Try to set up cloudinary if configured
if (cloudinaryConfigured) {
  try {
    const { CloudinaryStorage } = require("multer-storage-cloudinary");
    cloudinary = require("cloudinary").v2;
    
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const cloudStorage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: "cricbox",
        allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
      },
    });

    upload = multer({ 
      storage: cloudStorage,
      fileFilter: fileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024,
      }
    });
    
    console.log("✅ Cloudinary storage configured");
  } catch (err) {
    console.log("⚠️ Cloudinary setup failed, using disk storage:", err.message);
  }
} else {
  console.log("⚠️ Cloudinary not configured - using disk storage");
}

// Export for both default and named exports
module.exports = upload;
module.exports.upload = upload;
module.exports.cloudinary = cloudinary;

