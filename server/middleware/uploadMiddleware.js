const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const allowedMimeTypes = new Set([
  "image/jpeg", "image/png", "image/webp",
  "video/mp4", "video/webm", "video/quicktime"
]);

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, file) => ({
    folder: "snapchat-mern/stories",
    resource_type: file.mimetype.startsWith("video/") ? "video" : "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "mp4", "webm", "mov"],
    public_id: `${Date.now()}-${Math.random().toString(36).slice(2)}`
  })
});

const fileFilter = (_req, file, cb) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    return cb(new Error("Unsupported media type"));
  }
  cb(null, true);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024, files: 1 }
});
