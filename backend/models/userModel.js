const pool = require("../config/db");

const getById = async (id) => {
    const { rows } = await pool.query(
        "SELECT * FROM users WHERE id = $1",
        [id],
    );

    return rows[0] || null;
};

module.exports = {
    getById,
};
