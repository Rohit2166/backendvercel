const multer = require("multer");
const path = require("path");

// Create upload middleware
let upload;
let cloudinary = null;

// Cloudinary configuration - check for environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// Set up Cloudinary storage if credentials are available
if (cloudName && apiKey && apiSecret) {
  try {
    const { CloudinaryStorage } = require("multer-storage-cloudinary");
    cloudinary = require("cloudinary").v2;
    
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    const cloudStorage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: "cricbox",
        allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
        transformation: [{ width: 1200, height: 1200, crop: "limit" }]
      },
    });

    upload = multer({ 
      storage: cloudStorage,
      fileFilter: fileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      }
    });
    
    console.log("✅ Cloudinary storage configured");
  } catch (err) {
    console.log("⚠️ Cloudinary setup failed:", err.message);
    // Fall back to disk storage
    const diskStorage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, 'uploads/');
      },
      filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
      }
    });
    upload = multer({ 
      storage: diskStorage,
      fileFilter: fileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024,
      }
    });
  }
} else {
  console.log("⚠️ Cloudinary credentials not found - using disk storage (may not work on Vercel)");
  // Still set up disk storage as fallback for local development
  const diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  });
  upload = multer({ 
    storage: diskStorage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024,
    }
  });
}

// Export
module.exports = upload;
module.exports.upload = upload;
module.exports.cloudinary = cloudinary;

