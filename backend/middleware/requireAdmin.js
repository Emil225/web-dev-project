const userModel = require("../models/userModel");
const { sendError } = require("../utils/validation");

const requireAdmin = async (req, res, next) => {
    if (!req.session?.userId) {
        return sendError(res, 401, "Please log in first");
    }

    const user = await userModel.getById(req.session.userId);

    if (!user) {
        return sendError(res, 401, "Please log in first");
    }

    if (!user.isAdmin) {
        return sendError(res, 403, "Administrator access required");
    }

    next();
};

module.exports = requireAdmin;
