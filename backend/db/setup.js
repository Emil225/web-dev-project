// Creates the PostgreSQL database (if it doesn't exist yet), then runs schema.sql and seed.sql.
// Usage (from the backend folder): npm run db:setup
// WARNING: this resets every table, so any accounts or orders you created are deleted.

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env"), quiet: true });

const fs = require("fs");
const { Client } = require("pg");
const { DB_CONFIG, getDatabaseHint } = require("../config/db");

const SCHEMA_FILE = path.join(__dirname, "schema.sql");
const SEED_FILE = path.join(__dirname, "seed.sql");

// Connects to the built-in "postgres" database and creates ours if it's missing
const createDatabaseIfMissing = async () => {
    const adminClient = new Client({ ...DB_CONFIG, database: "postgres" });
    await adminClient.connect();

    try {
        const { rowCount } = await adminClient.query("SELECT 1 FROM pg_database WHERE datname = $1", [DB_CONFIG.database]);

        if (rowCount === 0) {
            // Database names can't be passed as $1 parameters, so quote the name safely instead
            const quotedName = `"${DB_CONFIG.database.replace(/"/g, '""')}"`;
            await adminClient.query(`CREATE DATABASE ${quotedName}`);
            console.log(`Created database "${DB_CONFIG.database}"`);
        } else {
            console.log(`Database "${DB_CONFIG.database}" already exists`);
        }
    } finally {
        await adminClient.end();
    }
};

const runSqlFiles = async () => {
    const client = new Client(DB_CONFIG);
    await client.connect();

    try {
        await client.query(fs.readFileSync(SCHEMA_FILE, "utf8"));
        console.log("Created tables: products, users, wishlist_items, orders, order_items");

        await client.query(fs.readFileSync(SEED_FILE, "utf8"));
        const { rows } = await client.query("SELECT COUNT(*)::int AS count FROM products");
        console.log(`Loaded sample data (${rows[0].count} products and a demo account)`);
    } finally {
        await client.end();
    }
};

const setupDatabase = async () => {
    try {
        await createDatabaseIfMissing();
        await runSqlFiles();
        console.log("Database setup complete. Start the server with: npm start");
    } catch (error) {
        console.error("Database setup failed:", getDatabaseHint(error) || error.message);
        process.exitCode = 1;
    }
};

setupDatabase();
