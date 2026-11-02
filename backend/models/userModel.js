const { pool } = require("../config/db");

// Never include password_hash here: these columns are sent to the browser
const USER_COLUMNS = `id, name, email, target_race AS "targetRace", created_at AS "createdAt"`;

// Fields other people may see (no email address)
const PUBLIC_USER_COLUMNS = `id, name, target_race AS "targetRace", created_at AS "createdAt"`;

// Request field name -> database column, for the fields a user can change
const UPDATABLE_COLUMNS = {
    name: "name",
    email: "email",
    targetRace: "target_race",
    passwordHash: "password_hash",
};

const getById = async (id) => {
    const { rows } = await pool.query(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [id]);
    return rows[0] || null;
};

const getPublicById = async (id) => {
    const { rows } = await pool.query(`SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE id = $1`, [id]);
    return rows[0] || null;
};

// Only for checking a password at login: includes the hash, so never send this object to the browser
const getByEmailWithPasswordHash = async (email) => {
    const { rows } = await pool.query(
        `SELECT ${USER_COLUMNS}, password_hash AS "passwordHash" FROM users WHERE email = $1`,
        [email],
    );
    return rows[0] || null;
};

const getPasswordHash = async (id) => {
    const { rows } = await pool.query("SELECT password_hash FROM users WHERE id = $1", [id]);
    return rows[0]?.password_hash || null;
};

// Throws a PostgreSQL error with code "23505" if the email is already registered
const create = async ({ name, email, passwordHash, targetRace = null }) => {
    const { rows } = await pool.query(
        `INSERT INTO users (name, email, password_hash, target_race)
         VALUES ($1, $2, $3, $4)
         RETURNING ${USER_COLUMNS}`,
        [name, email, passwordHash, targetRace],
    );

    return rows[0];
};

// Updates only the fields that were sent. Returns null if the user doesn't exist.
const update = async (id, changes) => {
    const fields = Object.keys(changes).filter((field) => UPDATABLE_COLUMNS[field]);

    if (fields.length === 0) {
        return getById(id);
    }

    const setClause = fields.map((field, index) => `${UPDATABLE_COLUMNS[field]} = $${index + 2}`).join(", ");

    const { rows } = await pool.query(
        `UPDATE users SET ${setClause} WHERE id = $1 RETURNING ${USER_COLUMNS}`,
        [id, ...fields.map((field) => changes[field])],
    );

    return rows[0] || null;
};

// Deleting a user also deletes their wishlist and orders (ON DELETE CASCADE in schema.sql)
const remove = async (id) => {
    const { rowCount } = await pool.query("DELETE FROM users WHERE id = $1", [id]);
    return rowCount > 0;
};

module.exports = {
    getById,
    getPublicById,
    getByEmailWithPasswordHash,
    getPasswordHash,
    create,
    update,
    remove,
};
