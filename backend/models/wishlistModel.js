const { pool } = require("../config/db");

// All products in the user's "My Gear" list, newest first
const getByUser = async (userId) => {
    const { rows } = await pool.query(
        `SELECT p.id, p.name, p.category, p.description, p.price, p.image_url AS "imageUrl", w.added_at AS "addedAt"
         FROM wishlist_items w
         JOIN products p ON p.id = w.product_id
         WHERE w.user_id = $1
         ORDER BY w.added_at DESC, p.id`,
        [userId],
    );

    return rows.map((row) => ({ ...row, price: Number(row.price) }));
};

// Returns true if it was added, false if it was already in the list.
// Throws a PostgreSQL error with code "23503" if the product doesn't exist.
const add = async (userId, productId) => {
    const { rowCount } = await pool.query(
        `INSERT INTO wishlist_items (user_id, product_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, product_id) DO NOTHING`,
        [userId, productId],
    );

    return rowCount > 0;
};

// Returns true if it was removed, false if it wasn't in the list
const remove = async (userId, productId) => {
    const { rowCount } = await pool.query(
        "DELETE FROM wishlist_items WHERE user_id = $1 AND product_id = $2",
        [userId, productId],
    );

    return rowCount > 0;
};

module.exports = {
    getByUser,
    add,
    remove,
};
