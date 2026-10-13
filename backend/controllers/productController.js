const productModel = require("../models/productModel");

const getAll = (req, res) => {
    res.json({
        success: true,
        products: productModel.getAll(),
    });
};

const getById = (req, res) => {
    const product = productModel.getById(Number(req.params.id));

    if (!product) {
        return res.status(404).json({
            success: false,
            error: "Product not found",
        });
    }

    res.json({
        success: true,
        product,
    });
};

const create = (req, res) => {
    const { name, price } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
            success: false,
            error: "Product name is required",
        });
    }

    if (price === undefined || typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
        return res.status(400).json({
            success: false,
            error: "A valid positive price is required",
        });
    }

    const product = productModel.create({
        name: name.trim(),
        price,
    });

    res.status(201).json({
        success: true,
        product,
    });
};

const update = (req, res) => {
    const id = Number(req.params.id);

    if (!productModel.getById(id)) {
        return res.status(404).json({
            success: false,
            error: "Product not found",
        });
    }

    const { name, price } = req.body;
    const changes = {};

    if (name !== undefined) {
        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                success: false,
                error: "Product name cannot be empty",
            });
        }

        changes.name = name.trim();
    }

    if (price !== undefined) {
        if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
            return res.status(400).json({
                success: false,
                error: "A valid positive price is required",
            });
        }

        changes.price = price;
    }

    res.json({
        success: true,
        product: productModel.update(id, changes),
    });
};

const remove = (req, res) => {
    const product = productModel.remove(Number(req.params.id));

    if (!product) {
        return res.status(404).json({
            success: false,
            error: "Product not found",
        });
    }

    res.json({
        success: true,
        message: "Product deleted successfully",
        product,
    });
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
};
