const express = require("express");
const catalogController = require("../controllers/catalogController");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

router.get("/", catalogController.showCatalog);
router.get("/manage", requireAdmin, catalogController.showManagePage);
router.get("/:id", catalogController.showProductPage);

module.exports = router;
