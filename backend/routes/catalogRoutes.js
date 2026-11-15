const express = require("express");
const catalogController = require("../controllers/catalogController");

const router = express.Router();

router.get("/", catalogController.showCatalog);
router.get("/manage", catalogController.showManagePage);

module.exports = router;
