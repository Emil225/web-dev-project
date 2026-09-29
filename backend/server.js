const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;
const API_MESSAGE = "IRON-PREP backend is working";

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: API_MESSAGE,
        timestamp: new Date().toISOString(),
    });
});

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        service: "iron-prep-backend",
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: "Endpoint not found",
    });
});

const startServer = () => {
    try {
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start the server:", error);
        process.exit(1);
    }
};

startServer();