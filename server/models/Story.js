const mongoose = require("mongoose");

const storySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  mediaUrl: { type: String, required: true },
  publicId: { type: String, required: true },
  mediaType: { type: String, enum: ["image", "video"], required: true },
  caption: { type: String, maxlength: 500, default: "" },
  expiresAt: { type: Date, required: true },
  views: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    viewedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
storySchema.index({ user: 1, expiresAt: 1 });

module.exports = mongoose.model("Story", storySchema);
