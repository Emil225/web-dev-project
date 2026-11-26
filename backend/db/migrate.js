const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env"), quiet: true });

const { Client } = require("pg");
const { DB_CONFIG, getDatabaseHint } = require("../config/db");

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

const runMigrations = async () => {
    const client = new Client(DB_CONFIG);
    await client.connect();

    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                name TEXT PRIMARY KEY,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

        const files = fs.readdirSync(MIGRATIONS_DIR)
            .filter((name) => name.endsWith(".sql"))
            .sort();

        for (const name of files) {
            const { rowCount } = await client.query(
                "SELECT 1 FROM schema_migrations WHERE name = $1",
                [name],
            );

            if (rowCount > 0) {
                continue;
            }

            await client.query("BEGIN");
            try {
                const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, name), "utf8");
                await client.query(sql);
                await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [name]);
                await client.query("COMMIT");
                console.log(`Applied database migration: ${name}`);
            } catch (error) {
                await client.query("ROLLBACK");
                throw error;
            }
        }

        console.log("Database migrations are up to date.");
    } finally {
        await client.end();
    }
};

if (require.main === module) {
    runMigrations().catch((error) => {
        console.error("Database migration failed:", getDatabaseHint(error) || error.message);
        process.exitCode = 1;
    });
}

module.exports = { runMigrations };
