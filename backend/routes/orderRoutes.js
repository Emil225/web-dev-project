const express = require("express");
const orderController = require("../controllers/orderController");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

// Every order route needs a logged-in user
router.use(requireAuth);

router.route("/")
    .get(orderController.getMine)
    .post(orderController.create);

module.exports = router;
