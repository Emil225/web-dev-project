const productModel = require("../models/productModel");
const { parseId, isNonEmptyString, isValidPrice, sendError } = require("../utils/validation");

const NAME_MAX_LENGTH = 120;
const CATEGORY_MAX_LENGTH = 40;
const DESCRIPTION_MAX_LENGTH = 1000;
const IMAGE_URL_MAX_LENGTH = 500;
const SEARCH_MAX_LENGTH = 100;

// Checks the product fields in a request body.
// With isPartial = true (used by PUT) every field is optional, otherwise name and price are required.
// Returns { error } or { values } with the cleaned-up fields.
const validateProductFields = (body = {}, isPartial) => {
    const { name, category, description, price, imageUrl } = body;
    const values = {};

    if (name !== undefined || !isPartial) {
        if (!isNonEmptyString(name, NAME_MAX_LENGTH)) {
            return { error: `Product name is required (max ${NAME_MAX_LENGTH} characters)` };
        }
        values.name = name.trim();
    }

    if (price !== undefined || !isPartial) {
        if (!isValidPrice(price)) {
            return { error: "A valid positive price is required" };
        }
        values.price = Math.round(price * 100) / 100;
    }

    if (category !== undefined) {
        if (!isNonEmptyString(category, CATEGORY_MAX_LENGTH)) {
            return { error: `Category must be text (max ${CATEGORY_MAX_LENGTH} characters)` };
        }
        values.category = category.trim();
    }

    if (description !== undefined) {
        if (typeof description !== "string" || description.length > DESCRIPTION_MAX_LENGTH) {
            return { error: `Description must be text (max ${DESCRIPTION_MAX_LENGTH} characters)` };
        }
        values.description = description.trim();
    }

    if (imageUrl !== undefined) {
        const isValidUrl = imageUrl === null || (
            typeof imageUrl === "string"
            && imageUrl.length <= IMAGE_URL_MAX_LENGTH
            && (imageUrl.startsWith("https://") || imageUrl.startsWith("/"))
        );

        if (!isValidUrl) {
            return { error: "Image URL must start with https:// or /" };
        }
        values.imageUrl = imageUrl;
    }

    return { values };
};

// Reads ?minPrice= / ?maxPrice=. Returns undefined if not given, NaN if invalid.
const parsePriceFilter = (value) => {
    if (value === undefined || value === "") {
        return undefined;
    }

    const price = Number(value);
    return Number.isFinite(price) && price >= 0 ? price : NaN;
};

// GET /api/products?search=gel&category=Nutrition&minPrice=10&maxPrice=50&sort=price_asc
const getAll = async (req, res) => {
    const { search, category, sort } = req.query;
    const minPrice = parsePriceFilter(req.query.minPrice);
    const maxPrice = parsePriceFilter(req.query.maxPrice);

    if (search !== undefined && (typeof search !== "string" || search.length > SEARCH_MAX_LENGTH)) {
        return sendError(res, 400, `Search text must be at most ${SEARCH_MAX_LENGTH} characters`);
    }

    if (category !== undefined && typeof category !== "string") {
        return sendError(res, 400, "Category must be a single value");
    }

    if (Number.isNaN(minPrice) || Number.isNaN(maxPrice)) {
        return sendError(res, 400, "minPrice and maxPrice must be numbers of 0 or more");
    }

    if (sort !== undefined && !productModel.SORT_KEYS.includes(sort)) {
        return sendError(res, 400, `Sort must be one of: ${productModel.SORT_KEYS.join(", ")}`);
    }

    const products = await productModel.getAll({
        search: search?.trim() || undefined,
        category: category?.trim() || undefined,
        minPrice,
        maxPrice,
        sort,
    });

    res.json({
        success: true,
        count: products.length,
        products,
    });
};

// GET /api/products/categories
const getCategories = async (req, res) => {
    res.json({
        success: true,
        categories: await productModel.getCategories(),
    });
};

// GET /api/products/:id
const getById = async (req, res) => {
    const id = parseId(req.params.id);

    if (!id) {
        return sendError(res, 400, "A valid product ID is required");
    }

    const product = await productModel.getById(id);

    if (!product) {
        return sendError(res, 404, "Product not found");
    }

    res.json({
        success: true,
        product,
    });
};

// POST /api/products
const create = async (req, res) => {
    const { error, values } = validateProductFields(req.body, false);

    if (error) {
        return sendError(res, 400, error);
    }

    const product = await productModel.create(values);

    res.status(201).json({
        success: true,
        product,
    });
};

// PUT /api/products/:id (send only the fields you want to change)
const update = async (req, res) => {
    const id = parseId(req.params.id);

    if (!id) {
        return sendError(res, 400, "A valid product ID is required");
    }

    const { error, values } = validateProductFields(req.body, true);

    if (error) {
        return sendError(res, 400, error);
    }

    if (Object.keys(values).length === 0) {
        return sendError(res, 400, "Send at least one field to update: name, category, description, price or imageUrl");
    }

    const product = await productModel.update(id, values);

    if (!product) {
        return sendError(res, 404, "Product not found");
    }

    res.json({
        success: true,
        product,
    });
};

// DELETE /api/products/:id
const remove = async (req, res) => {
    const id = parseId(req.params.id);

    if (!id) {
        return sendError(res, 400, "A valid product ID is required");
    }

    const product = await productModel.remove(id);

    if (!product) {
        return sendError(res, 404, "Product not found");
    }

    res.json({
        success: true,
        message: "Product deleted successfully",
        product,
    });
};

module.exports = {
    getAll,
    getCategories,
    getById,
    create,
    update,
    remove,
};
