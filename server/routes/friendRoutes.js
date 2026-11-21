const router = require("express").Router();
const protect = require("../middleware/authMiddleware");
const { addFriend, getFriends } = require("../controllers/friendController");

router.use(protect);
router.post("/:id", addFriend);
router.get("/", getFriends);

module.exports = router;
