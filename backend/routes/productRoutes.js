const express = require("express");
const productController = require("../controllers/productController");

const router = express.Router();

router.route("/")
    .get(productController.getAll)
    .post(productController.create);

// Must come before "/:id", otherwise "categories" would be treated as an id
router.get("/categories", productController.getCategories);

router.route("/:id")
    .get(productController.getById)
    .put(productController.update)
    .delete(productController.remove);

module.exports = router;
