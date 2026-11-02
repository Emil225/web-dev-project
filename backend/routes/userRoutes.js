const express = require("express");
const userController = require("../controllers/userController");
const wishlistController = require("../controllers/wishlistController");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

// Public: no login needed
router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/logout", userController.logout);

// Private area for the logged-in athlete (Athlete Dashboard)
router.route("/me")
    .get(requireAuth, userController.getMe)
    .put(requireAuth, userController.updateMe)
    .delete(requireAuth, userController.deleteMe);

// "My Gear" wishlist
router.route("/me/wishlist")
    .get(requireAuth, wishlistController.getMine)
    .post(requireAuth, wishlistController.add);

router.delete("/me/wishlist/:productId", requireAuth, wishlistController.remove);

// Must come after the "/me" routes, otherwise "me" would be treated as an id
router.get("/:id", userController.getPublicProfile);

module.exports = router;
