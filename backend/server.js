const express = require("express");
const path = require("path");
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        service: "iron-prep-backend",
    });
});

app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);

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
