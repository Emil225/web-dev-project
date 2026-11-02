const { pool } = require("../config/db");

// Prices are added up in whole cents to avoid floating point errors (0.1 + 0.2 !== 0.3)
const toCents = (price) => Math.round(Number(price) * 100);

// All of a user's orders, newest first, each with its list of items
const getByUser = async (userId) => {
    const { rows } = await pool.query(
        `SELECT o.id, o.total, o.created_at AS "createdAt",
                json_agg(
                    json_build_object(
                        'productId', oi.product_id,
                        'name', oi.product_name,
                        'unitPrice', oi.unit_price,
                        'quantity', oi.quantity,
                        'imageUrl', p.image_url
                    ) ORDER BY oi.id
                ) AS items
         FROM orders o
         JOIN order_items oi ON oi.order_id = o.id
         LEFT JOIN products p ON p.id = oi.product_id
         WHERE o.user_id = $1
         GROUP BY o.id
         ORDER BY o.created_at DESC, o.id DESC`,
        [userId],
    );

    return rows.map((row) => ({ ...row, total: Number(row.total) }));
};

// Creates an order from [{ productId, quantity }].
// Prices come from the database, never from the browser, so nobody can change what they pay.
// Everything runs in one transaction: either the whole order is saved or nothing is.
// Returns { order } or { missingProductIds } if some products don't exist.
const create = async (userId, items) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const productIds = items.map((item) => item.productId);
        const { rows: products } = await client.query(
            "SELECT id, name, price FROM products WHERE id = ANY($1::int[])",
            [productIds],
        );
        const productsById = new Map(products.map((product) => [product.id, product]));
        const missingProductIds = productIds.filter((id) => !productsById.has(id));

        if (missingProductIds.length > 0) {
            await client.query("ROLLBACK");
            return { missingProductIds };
        }

        const totalCents = items.reduce(
            (sum, item) => sum + toCents(productsById.get(item.productId).price) * item.quantity,
            0,
        );

        const { rows: [order] } = await client.query(
            `INSERT INTO orders (user_id, total) VALUES ($1, $2)
             RETURNING id, total, created_at AS "createdAt"`,
            [userId, (totalCents / 100).toFixed(2)],
        );

        const orderItems = [];

        for (const item of items) {
            const product = productsById.get(item.productId);

            await client.query(
                `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity)
                 VALUES ($1, $2, $3, $4, $5)`,
                [order.id, product.id, product.name, product.price, item.quantity],
            );

            orderItems.push({
                productId: product.id,
                name: product.name,
                unitPrice: Number(product.price),
                quantity: item.quantity,
            });
        }

        await client.query("COMMIT");

        return {
            order: {
                ...order,
                total: Number(order.total),
                items: orderItems,
            },
        };
    } catch (error) {
        // Undo anything saved so far; ignore a failed rollback so the original error is the one reported
        await client.query("ROLLBACK").catch(() => {});
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    getByUser,
    create,
};
