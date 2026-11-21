const User = require("../models/User");

// Demo-only shortcut: adds each account to the other's friend list.
// Replace with request/accept workflow before production.
exports.addFriend = async (req, res) => {
  try {
    const friend = await User.findById(req.params.id);
    if (!friend) return res.status(404).json({ message: "User not found" });
    if (friend._id.equals(req.user._id)) {
      return res.status(400).json({ message: "You cannot add yourself" });
    }

    await User.updateOne({ _id: req.user._id }, { $addToSet: { friends: friend._id } });
    await User.updateOne({ _id: friend._id }, { $addToSet: { friends: req.user._id } });

    res.json({ message: "Demo friendship created" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFriends = async (req, res) => {
  const user = await User.findById(req.user._id).populate("friends", "username profileImage");
  res.json({ friends: user.friends });
};
