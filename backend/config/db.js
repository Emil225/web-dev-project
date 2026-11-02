const { Pool } = require("pg");

// Connection settings come from backend/.env (copy .env.example to .env and fill in your password)
const DB_CONFIG = {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "iron_prep",
};

const pool = new Pool(DB_CONFIG);

// If PostgreSQL drops an idle connection (e.g. it restarts), log it instead of crashing the server
pool.on("error", (error) => {
    console.error("PostgreSQL connection error:", error.message);
});

// Turns the most common "database not set up" errors into a hint that says how to fix it.
// Returns null for any other error.
const getDatabaseHint = (error) => {
    const code = error?.code;
    const message = error?.message || "";

    if (code === "ECONNREFUSED" || code === "ENOTFOUND") {
        return `Cannot reach PostgreSQL at ${DB_CONFIG.host}:${DB_CONFIG.port}. Make sure the PostgreSQL service is running.`;
    }

    if (code === "28P01" || message.includes("client password must be")) {
        return DB_CONFIG.password
            ? `PostgreSQL rejected the password for user "${DB_CONFIG.user}". Check DB_PASSWORD in backend/.env.`
            : "DB_PASSWORD is empty. Put your PostgreSQL password in backend/.env.";
    }

    if (code === "3D000") {
        return `The database "${DB_CONFIG.database}" does not exist yet. Run: npm run db:setup`;
    }

    if (code === "42P01") {
        return "The database tables are missing. Run: npm run db:setup";
    }

    return null;
};

module.exports = {
    pool,
    DB_CONFIG,
    getDatabaseHint,
};
