const { pool } = require("../config/db");

// Columns sent to the frontend, renamed to camelCase for JavaScript
const PRODUCT_COLUMNS = `id, name, category, description, price, image_url AS "imageUrl", created_at AS "createdAt"`;

// Allowed ?sort= values. Only these fixed strings ever go into ORDER BY, never user input.
const SORT_OPTIONS = {
    newest: "created_at DESC, id DESC",
    price_asc: "price ASC, id ASC",
    price_desc: "price DESC, id ASC",
    name: "name ASC, id ASC",
};
const DEFAULT_SORT = "id ASC";

// Request field name -> database column, for the fields that can be changed with PUT
const UPDATABLE_COLUMNS = {
    name: "name",
    category: "category",
    description: "description",
    price: "price",
    imageUrl: "image_url",
};

// PostgreSQL returns NUMERIC columns as strings, so turn the price back into a number
const toProduct = (row) => (row ? { ...row, price: Number(row.price) } : null);

// % and _ are wildcards in ILIKE, so escape them to search for them literally
const escapeLikePattern = (text) => text.replace(/[\\%_]/g, "\\$&");

const getAll = async ({ search, category, minPrice, maxPrice, sort } = {}) => {
    const conditions = [];
    const values = [];

    // Each filter adds a numbered placeholder ($1, $2, ...) so values are never pasted into the SQL
    if (search) {
        values.push(`%${escapeLikePattern(search)}%`);
        conditions.push(`(name ILIKE $${values.length} OR description ILIKE $${values.length})`);
    }

    if (category) {
        values.push(category);
        conditions.push(`LOWER(category) = LOWER($${values.length})`);
    }

    if (minPrice !== undefined) {
        values.push(minPrice);
        conditions.push(`price >= $${values.length}`);
    }

    if (maxPrice !== undefined) {
        values.push(maxPrice);
        conditions.push(`price <= $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const orderBy = SORT_OPTIONS[sort] || DEFAULT_SORT;

    const { rows } = await pool.query(
        `SELECT ${PRODUCT_COLUMNS} FROM products ${whereClause} ORDER BY ${orderBy}`,
        values,
    );

    return rows.map(toProduct);
};

const getCategories = async () => {
    const { rows } = await pool.query("SELECT DISTINCT category FROM products ORDER BY category");
    return rows.map((row) => row.category);
};

const getById = async (id) => {
    const { rows } = await pool.query(`SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = $1`, [id]);
    return toProduct(rows[0]);
};

const create = async ({ name, category = "General", description = "", price, imageUrl = null }) => {
    const { rows } = await pool.query(
        `INSERT INTO products (name, category, description, price, image_url)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING ${PRODUCT_COLUMNS}`,
        [name, category, description, price, imageUrl],
    );

    return toProduct(rows[0]);
};

// Updates only the fields that were sent. Returns null if the product doesn't exist.
const update = async (id, changes) => {
    const fields = Object.keys(changes).filter((field) => UPDATABLE_COLUMNS[field]);

    if (fields.length === 0) {
        return getById(id);
    }

    // e.g. "name = $2, price = $3" ($1 is the id)
    const setClause = fields.map((field, index) => `${UPDATABLE_COLUMNS[field]} = $${index + 2}`).join(", ");

    const { rows } = await pool.query(
        `UPDATE products SET ${setClause} WHERE id = $1 RETURNING ${PRODUCT_COLUMNS}`,
        [id, ...fields.map((field) => changes[field])],
    );

    return toProduct(rows[0]);
};

// Returns the deleted product, or null if it didn't exist
const remove = async (id) => {
    const { rows } = await pool.query(`DELETE FROM products WHERE id = $1 RETURNING ${PRODUCT_COLUMNS}`, [id]);
    return toProduct(rows[0]);
};

module.exports = {
    SORT_KEYS: Object.keys(SORT_OPTIONS),
    getAll,
    getCategories,
    getById,
    create,
    update,
    remove,
};
