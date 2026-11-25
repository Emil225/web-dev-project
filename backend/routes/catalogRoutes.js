const express = require("express");
const catalogController = require("../controllers/catalogController");

const router = express.Router();

router.get("/", catalogController.showCatalog);
router.get("/manage", catalogController.showManagePage);
router.get("/:id", catalogController.showProductPage);

module.exports = router;
