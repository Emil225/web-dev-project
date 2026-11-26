const express = require("express");
const productController = require("../controllers/productController");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

router.route("/")
    .get(productController.getAll)
    .post(requireAdmin, productController.create);

// Must come before "/:id", otherwise "categories" would be treated as an id
router.get("/categories", productController.getCategories);

router.route("/:id")
    .get(productController.getById)
    .put(requireAdmin, productController.update)
    .delete(requireAdmin, productController.remove);

module.exports = router;
