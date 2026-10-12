const express = require("express");

const app = express();
app.use(express.json());
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

const products = [
    {
        id: 1,
        name: "Triathlon wetsuit",
        price: 299,
    },
    {
        id: 2,
        name: "Swimming goggles",
        price: 35,
    },
    {
        id: 3,
        name: "Road cycling helmet",
        price: 120,
    },
];

app.get("/api/products", (req, res) => {
    res.json({
        success: true,
        products: products,
    });
});

app.get("/api/products/:id", (req, res) => {
    const productId = Number(req.params.id);

    const product = products.find(p => p.id === productId);

    if (!product) {
        return res.status(404).json({
            success: false,
            error: "Product not found",
        });
    }

    res.json({
        success: true,
        product: product,
    });
});

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