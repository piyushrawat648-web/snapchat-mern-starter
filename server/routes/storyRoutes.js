const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  createStory, getStories, viewStory, getViewers, deleteStory
} = require("../controllers/storyController");

router.use(protect);
router.post("/", upload.single("media"), createStory);
router.get("/", getStories);
router.post("/:id/view", viewStory);
router.get("/:id/viewers", getViewers);
router.delete("/:id", deleteStory);

module.exports = router;
