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

app.post("/api/products", (req, res) => {
    const { name, price } = req.body;

    // Check if the product name is missing
    if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
            success: false,
            error: "Product name is required",
        });
    }

    // Check if the price is valid
    if (price === undefined || typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
        return res.status(400).json({
            success: false,
            error: "A valid positive price is required",
        });
    }

    const newProduct = {
        id: products.length + 1,
        name: name.trim(),
        price: price,
    };

    products.push(newProduct);

    res.status(201).json({
        success: true,
        product: newProduct,
    });
});

app.put("/api/products/:id", (req, res) => {
    const productId = Number(req.params.id);

    const product = products.find(p => p.id === productId);

    if (!product) {
        return res.status(404).json({
            success: false,
            error: "Product not found",
        });
    }

    const { name, price } = req.body;

    if (name !== undefined) {
        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                success: false,
                error: "Product name cannot be empty",
            });
        }

        product.name = name.trim();
    }

    if (price !== undefined) {
        if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
            return res.status(400).json({
                success: false,
                error: "A valid positive price is required",
            });
        }

        product.price = price;
    }

    res.json({
        success: true,
        product: product,
    });
});

app.delete("/api/products/:id", (req, res) => {
    const productId = Number(req.params.id);

    const productIndex = products.findIndex(p => p.id === productId);

    if (productIndex === -1) {
        return res.status(404).json({
            success: false,
            error: "Product not found",
        });
    }

    const deletedProduct = products.splice(productIndex, 1);

    res.json({
        success: true,
        message: "Product deleted successfully",
        product: deletedProduct[0],
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