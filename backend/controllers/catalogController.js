const path = require("path");

const showCatalog = (req, res) => {
    res.sendFile(path.join(__dirname, "..", "views", "products.html"));
};

module.exports = {
    showCatalog,
};
