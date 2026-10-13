const mysql = require("mysql2");

const connection = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "YOUR_MYSQL_PASSWORD",
    database: process.env.DB_NAME || "YOUR_DATABASE_NAME",
});

connection.connect((error) => {
    if (error) {
        console.error("MySQL connection failed:", error.message);
        return;
    }

    console.log("Connected to MySQL.");
});

module.exports = connection;
