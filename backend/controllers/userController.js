const userModel = require("../models/userModel");

const getById = async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({
            success: false,
            error: "A valid user ID is required",
        });
    }

    try {
        const user = await userModel.getById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found",
            });
        }

        res.json({
            success: true,
            user,
        });
    } catch (error) {
        console.error("Failed to retrieve user:", error.message);
        res.status(500).json({
            success: false,
            error: "Unable to retrieve user",
        });
    }
};

module.exports = {
    getById,
};
