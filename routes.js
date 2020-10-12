const express = require("express");
const router = express.Router();
const { verifyAccessToken } = require("./src/middleware/auth");

const User = require("./src/controllers/mainUser");

router.route("/").get(verifyAccessToken, (req, res) => {
  res.send("hello");
});
router.route("/user").get(verifyAccessToken, User.CurrentUser);
router.route("/user/login").post(User.Login);
router.route("/user/signup").post(User.SignUp);

router.route("/user/add_avatar").post(User.AddAvatar);
router.route("/user/delete_avatar").delete(User.DeleteAvatar);

router.route("/user/logout").delete(User.Logout);
router.route("/user/delete_user").delete(User.DeleteUser);

router.route("/refresh_token").post(User.RefreshToken);

module.exports = router;
