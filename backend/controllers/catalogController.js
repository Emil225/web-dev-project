const path = require("path");

const showCatalog = (req, res) => {
    res.sendFile(path.join(__dirname, "..", "views", "products.html"));
};

// Admin page where products are added, edited and deleted (see public/manage.js)
const showManagePage = (req, res) => {
    res.sendFile(path.join(__dirname, "..", "views", "manage.html"));
};

module.exports = {
    showCatalog,
    showManagePage,
};
