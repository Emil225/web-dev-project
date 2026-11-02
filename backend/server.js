const path = require("path");

// Load DB_PASSWORD, SESSION_SECRET etc. from backend/.env before anything reads them
require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });

const express = require("express");
const session = require("express-session");
const { pool, DB_CONFIG, getDatabaseHint } = require("./config/db");
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes");
const catalogRoutes = require("./routes/catalogRoutes");

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET) {
    console.warn("SESSION_SECRET is not set in backend/.env, so a development-only secret is used.");
}

app.use(express.json());

// Remembers who is logged in, using a cookie that holds only a random session id.
// Sessions are kept in memory, so everyone is logged out when the server restarts.
app.use(session({
    name: "ironprep.sid",
    secret: SESSION_SECRET || "iron-prep-development-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
    },
}));

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.get("/health", async (req, res) => {
    let database = "connected";

    try {
        await pool.query("SELECT 1");
    } catch {
        database = "unavailable";
    }

    res.status(200).json({
        status: "ok",
        service: "iron-prep-backend",
        database,
    });
});

app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/products", catalogRoutes);

app.post("/test", (req, res) => {
    res.json({
        receivedData: req.body,
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: "Endpoint not found",
    });
});

// Catches every error thrown in a route (Express 5 also catches errors from async functions)
app.use((error, req, res, next) => {
    if (error.type === "entity.parse.failed") {
        return res.status(400).json({
            success: false,
            error: "Request body must be valid JSON",
        });
    }

    const databaseHint = getDatabaseHint(error);

    if (databaseHint) {
        console.error(`Database problem: ${databaseHint}`);
        return res.status(503).json({
            success: false,
            error: "The database is not available right now",
        });
    }

    console.error("Unexpected server error:", error);
    res.status(500).json({
        success: false,
        error: "Something went wrong on the server",
    });
});

// Tells you at startup whether the database is ready. The website still runs if it isn't.
const checkDatabase = async () => {
    try {
        const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM products");
        console.log(`Connected to PostgreSQL database "${DB_CONFIG.database}" (${rows[0].count} products)`);
    } catch (error) {
        console.warn(`Database not ready: ${getDatabaseHint(error) || error.message}`);
        console.warn("The website still loads, but the /api routes that use the database will return errors.");
    }
};

const startServer = () => {
    app.listen(PORT, (error) => {
        if (error) {
            if (error.code === "EADDRINUSE") {
                console.error(`Port ${PORT} is already in use. Is the server already running in another window?`);
            } else {
                console.error("Failed to start the server:", error);
            }
            process.exit(1);
        }

        console.log(`Server is running on http://localhost:${PORT}`);
        checkDatabase();
    });
};

startServer();
