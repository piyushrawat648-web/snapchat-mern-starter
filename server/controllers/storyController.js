const Story = require("../models/Story");
const cloudinary = require("../config/cloudinary");

exports.createStory = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Media file is required" });

    const isVideo = req.file.mimetype.startsWith("video/");
    const story = await Story.create({
      user: req.user._id,
      mediaUrl: req.file.path,
      publicId: req.file.filename,
      mediaType: isVideo ? "video" : "image",
      caption: (req.body.caption || "").slice(0, 500),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    res.status(201).json({ message: "Story uploaded", story });
  } catch (error) {
    // If DB write fails after Cloudinary upload, attempt to avoid an orphaned asset.
    if (req.file?.filename) {
      const resourceType = req.file.mimetype.startsWith("video/") ? "video" : "image";
      await cloudinary.uploader.destroy(req.file.filename, { resource_type: resourceType }).catch(() => {});
    }
    res.status(500).json({ message: error.message });
  }
};

exports.getStories = async (req, res) => {
  try {
    const friendIds = req.user.friends || [];
    const stories = await Story.find({
      user: { $in: [...friendIds, req.user._id] },
      expiresAt: { $gt: new Date() }
    })
      .populate("user", "username profileImage")
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ stories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.viewStory = async (req, res) => {
  try {
    const allowedUserIds = [...(req.user.friends || []), req.user._id];
    const story = await Story.findOne({
      _id: req.params.id,
      user: { $in: allowedUserIds },
      expiresAt: { $gt: new Date() }
    });

    if (!story) return res.status(404).json({ message: "Story not found" });

    await Story.updateOne(
      { _id: story._id, "views.user": { $ne: req.user._id } },
      { $push: { views: { user: req.user._id, viewedAt: new Date() } } }
    );

    res.json({ message: "View recorded" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getViewers = async (req, res) => {
  try {
    const story = await Story.findOne({
      _id: req.params.id,
      user: req.user._id,
      expiresAt: { $gt: new Date() }
    }).populate("views.user", "username profileImage");

    if (!story) return res.status(404).json({ message: "Story not found" });
    res.json({ viewers: story.views });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteStory = async (req, res) => {
  try {
    const story = await Story.findOne({ _id: req.params.id, user: req.user._id });
    if (!story) return res.status(404).json({ message: "Story not found" });

    const resourceType = story.mediaType === "video" ? "video" : "image";
    await cloudinary.uploader.destroy(story.publicId, { resource_type: resourceType });
    await story.deleteOne();

    res.json({ message: "Story deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
