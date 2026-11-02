const orderModel = require("../models/orderModel");
const { parseId, sendError } = require("../utils/validation");

const MAX_DIFFERENT_PRODUCTS = 50;
const MAX_QUANTITY = 99;

// GET /api/orders  (the logged-in user's saved orders)
const getMine = async (req, res) => {
    const orders = await orderModel.getByUser(req.session.userId);

    res.json({
        success: true,
        count: orders.length,
        orders,
    });
};

// POST /api/orders  { items: [{ productId: 1, quantity: 2 }, ...] }
const create = async (req, res) => {
    const items = req.body?.items;

    if (!Array.isArray(items) || items.length === 0) {
        return sendError(res, 400, "items must be a non-empty list like [{ \"productId\": 1, \"quantity\": 2 }]");
    }

    // Check every item and add up quantities if the same product appears twice
    const quantitiesByProduct = new Map();

    for (const item of items) {
        const productId = parseId(item?.productId);
        const quantity = item?.quantity === undefined ? 1 : Number(item.quantity);

        if (!productId) {
            return sendError(res, 400, "Every item needs a valid productId");
        }

        if (!Number.isInteger(quantity) || quantity < 1) {
            return sendError(res, 400, "Quantity must be a whole number of 1 or more");
        }

        quantitiesByProduct.set(productId, (quantitiesByProduct.get(productId) || 0) + quantity);
    }

    if (quantitiesByProduct.size > MAX_DIFFERENT_PRODUCTS) {
        return sendError(res, 400, `An order can contain at most ${MAX_DIFFERENT_PRODUCTS} different products`);
    }

    if ([...quantitiesByProduct.values()].some((quantity) => quantity > MAX_QUANTITY)) {
        return sendError(res, 400, `You can order at most ${MAX_QUANTITY} of each product`);
    }

    const cleanItems = [...quantitiesByProduct].map(([productId, quantity]) => ({ productId, quantity }));
    const { order, missingProductIds } = await orderModel.create(req.session.userId, cleanItems);

    if (missingProductIds) {
        return sendError(res, 404, `These products don't exist: ${missingProductIds.join(", ")}`);
    }

    res.status(201).json({
        success: true,
        order,
    });
};

module.exports = {
    getMine,
    create,
};
