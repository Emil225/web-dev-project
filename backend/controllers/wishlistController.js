const wishlistModel = require("../models/wishlistModel");
const { parseId, sendError } = require("../utils/validation");

const FOREIGN_KEY_VIOLATION = "23503"; // PostgreSQL error code: the referenced product doesn't exist

// GET /api/users/me/wishlist
const getMine = async (req, res) => {
    const items = await wishlistModel.getByUser(req.session.userId);

    res.json({
        success: true,
        count: items.length,
        items,
    });
};

// POST /api/users/me/wishlist  { productId }
const add = async (req, res) => {
    const productId = parseId(req.body?.productId);

    if (!productId) {
        return sendError(res, 400, "A valid productId is required");
    }

    try {
        const wasAdded = await wishlistModel.add(req.session.userId, productId);

        res.status(wasAdded ? 201 : 200).json({
            success: true,
            message: wasAdded ? "Added to My Gear" : "Already in My Gear",
        });
    } catch (error) {
        if (error.code === FOREIGN_KEY_VIOLATION) {
            return sendError(res, 404, "Product not found");
        }
        throw error;
    }
};

// DELETE /api/users/me/wishlist/:productId
const remove = async (req, res) => {
    const productId = parseId(req.params.productId);

    if (!productId) {
        return sendError(res, 400, "A valid product ID is required");
    }

    const wasRemoved = await wishlistModel.remove(req.session.userId, productId);

    if (!wasRemoved) {
        return sendError(res, 404, "This product is not in My Gear");
    }

    res.json({
        success: true,
        message: "Removed from My Gear",
    });
};

module.exports = {
    getMine,
    add,
    remove,
};
