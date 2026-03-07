const multer = require("multer");
const path = require("path");

// Create upload middleware with Cloudinary support
let upload;
let cloudinary = null;

// Check if cloudinary credentials are configured
const cloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET
);

console.log("Cloudinary check - Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME ? "Set" : "Not Set");
console.log("Cloudinary check - API Key:", process.env.CLOUDINARY_API_KEY ? "Set" : "Not Set");
console.log("Cloudinary check - API Secret:", process.env.CLOUDINARY_API_SECRET ? "Set" : "Not Set");

// Set up disk storage as fallback
const diskStorage = multer.diskStorage({
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

// Default to disk storage first
upload = multer({ 
  storage: diskStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  }
});

// Try to set up cloudinary
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
        transformation: [{ width: 1200, height: 800, crop: "limit" }]
      },
    });

    upload = multer({ 
      storage: cloudStorage,
      fileFilter: fileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024,
      }
    });
    
    console.log("✅ Cloudinary storage configured successfully");
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

