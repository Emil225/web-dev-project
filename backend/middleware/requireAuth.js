const { sendError } = require("../utils/validation");

// Put this in front of any route that needs a logged-in athlete.
// After login the session holds the user's id (see userController.login).
const requireAuth = (req, res, next) => {
    if (!req.session?.userId) {
        return sendError(res, 401, "Please log in first");
    }

    next();
};

module.exports = requireAuth;
