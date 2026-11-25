const path = require("path");

const showCatalog = (req, res) => {
    res.sendFile(path.join(__dirname, "..", "views", "products.html"));
};

// Admin page where products are added, edited and deleted (see public/manage.js)
const showManagePage = (req, res) => {
    res.sendFile(path.join(__dirname, "..", "views", "manage.html"));
};

const showProductPage = (req, res) => {
    if (!/^\d+$/.test(req.params.id)) {
        return res.status(404).sendFile(path.join(__dirname, "..", "views", "products.html"));
    }
    res.sendFile(path.join(__dirname, "..", "views", "product.html"));
};

module.exports = {
    showCatalog,
    showManagePage,
    showProductPage,
};
