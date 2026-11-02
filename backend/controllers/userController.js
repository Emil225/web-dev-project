const bcrypt = require("bcryptjs");
const userModel = require("../models/userModel");
const {
    PASSWORD_MIN_LENGTH,
    PASSWORD_MAX_LENGTH,
    parseId,
    isNonEmptyString,
    isValidEmail,
    isValidPassword,
    sendError,
} = require("../utils/validation");

const BCRYPT_ROUNDS = 10;
const NAME_MAX_LENGTH = 100;
const TARGET_RACE_MAX_LENGTH = 120;
const REMEMBER_ME_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const UNIQUE_VIOLATION = "23505"; // PostgreSQL error code for a duplicate value in a UNIQUE column
const PASSWORD_RULE = `Password must be ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters long`;

const normaliseEmail = (email) => email.trim().toLowerCase();

// targetRace is optional: empty text or null clears it
const cleanTargetRace = (targetRace) => {
    if (targetRace === undefined) {
        return { value: undefined };
    }

    if (targetRace === null || targetRace === "") {
        return { value: null };
    }

    if (!isNonEmptyString(targetRace, TARGET_RACE_MAX_LENGTH)) {
        return { error: `Target race must be text (max ${TARGET_RACE_MAX_LENGTH} characters)` };
    }

    return { value: targetRace.trim() };
};

// Logs the user in by storing their id in the session.
// regenerate() gives them a fresh session id, which stops session fixation attacks.
const startSession = (req, userId, rememberMe) => new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
        if (error) {
            return reject(error);
        }

        req.session.userId = userId;

        // "Remember me" keeps the login for 30 days, otherwise it ends when the browser closes
        if (rememberMe) {
            req.session.cookie.maxAge = REMEMBER_ME_MAX_AGE_MS;
        }

        req.session.save((saveError) => (saveError ? reject(saveError) : resolve()));
    });
});

const endSession = (req, res) => new Promise((resolve) => {
    req.session.destroy(() => {
        res.clearCookie("ironprep.sid");
        resolve();
    });
});

// POST /api/users/register  { name, email, password, targetRace? }
const register = async (req, res) => {
    const { name, email, password } = req.body || {};
    const targetRace = cleanTargetRace(req.body?.targetRace);

    if (!isNonEmptyString(name, NAME_MAX_LENGTH)) {
        return sendError(res, 400, `Name is required (max ${NAME_MAX_LENGTH} characters)`);
    }

    if (!isValidEmail(email)) {
        return sendError(res, 400, "A valid email address is required");
    }

    if (!isValidPassword(password)) {
        return sendError(res, 400, PASSWORD_RULE);
    }

    if (targetRace.error) {
        return sendError(res, 400, targetRace.error);
    }

    try {
        const user = await userModel.create({
            name: name.trim(),
            email: normaliseEmail(email),
            passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
            targetRace: targetRace.value ?? null,
        });

        await startSession(req, user.id, false);

        res.status(201).json({
            success: true,
            user,
        });
    } catch (error) {
        if (error.code === UNIQUE_VIOLATION) {
            return sendError(res, 409, "An account with this email already exists");
        }
        throw error;
    }
};

// POST /api/users/login  { email, password, rememberMe? }
const login = async (req, res) => {
    const { email, password, rememberMe } = req.body || {};

    if (!isValidEmail(email) || typeof password !== "string" || password.length === 0) {
        return sendError(res, 400, "Email and password are required");
    }

    const user = await userModel.getByEmailWithPasswordHash(normaliseEmail(email));
    const isPasswordCorrect = user ? await bcrypt.compare(password, user.passwordHash) : false;

    // Same message for "no such email" and "wrong password", so nobody can find out which emails are registered
    if (!isPasswordCorrect) {
        return sendError(res, 401, "Incorrect email or password");
    }

    await startSession(req, user.id, rememberMe === true);

    const { passwordHash, ...safeUser } = user;

    res.json({
        success: true,
        user: safeUser,
    });
};

// POST /api/users/logout
const logout = async (req, res) => {
    await endSession(req, res);

    res.json({
        success: true,
        message: "Logged out",
    });
};

// GET /api/users/me
const getMe = async (req, res) => {
    const user = await userModel.getById(req.session.userId);

    // The account was deleted while this session was still open
    if (!user) {
        await endSession(req, res);
        return sendError(res, 401, "Please log in first");
    }

    res.json({
        success: true,
        user,
    });
};

// PUT /api/users/me  { name?, email?, targetRace?, newPassword?, currentPassword? }
// Changing the password requires the current password.
const updateMe = async (req, res) => {
    const { name, email, newPassword, currentPassword } = req.body || {};
    const targetRace = cleanTargetRace(req.body?.targetRace);
    const changes = {};

    if (name !== undefined) {
        if (!isNonEmptyString(name, NAME_MAX_LENGTH)) {
            return sendError(res, 400, `Name cannot be empty (max ${NAME_MAX_LENGTH} characters)`);
        }
        changes.name = name.trim();
    }

    if (email !== undefined) {
        if (!isValidEmail(email)) {
            return sendError(res, 400, "A valid email address is required");
        }
        changes.email = normaliseEmail(email);
    }

    if (targetRace.error) {
        return sendError(res, 400, targetRace.error);
    }

    if (targetRace.value !== undefined) {
        changes.targetRace = targetRace.value;
    }

    if (newPassword !== undefined) {
        if (!isValidPassword(newPassword)) {
            return sendError(res, 400, PASSWORD_RULE);
        }

        const currentHash = await userModel.getPasswordHash(req.session.userId);
        const isCurrentPasswordCorrect = typeof currentPassword === "string"
            && currentHash !== null
            && await bcrypt.compare(currentPassword, currentHash);

        if (!isCurrentPasswordCorrect) {
            return sendError(res, 403, "Your current password is incorrect");
        }

        changes.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    }

    if (Object.keys(changes).length === 0) {
        return sendError(res, 400, "Send at least one field to update: name, email, targetRace or newPassword");
    }

    try {
        const user = await userModel.update(req.session.userId, changes);

        if (!user) {
            await endSession(req, res);
            return sendError(res, 401, "Please log in first");
        }

        res.json({
            success: true,
            user,
        });
    } catch (error) {
        if (error.code === UNIQUE_VIOLATION) {
            return sendError(res, 409, "An account with this email already exists");
        }
        throw error;
    }
};

// DELETE /api/users/me  (also deletes the user's wishlist and orders)
const deleteMe = async (req, res) => {
    await userModel.remove(req.session.userId);
    await endSession(req, res);

    res.json({
        success: true,
        message: "Account deleted",
    });
};

// GET /api/users/:id  (public profile: no email address)
const getPublicProfile = async (req, res) => {
    const id = parseId(req.params.id);

    if (!id) {
        return sendError(res, 400, "A valid user ID is required");
    }

    const user = await userModel.getPublicById(id);

    if (!user) {
        return sendError(res, 404, "User not found");
    }

    res.json({
        success: true,
        user,
    });
};

module.exports = {
    register,
    login,
    logout,
    getMe,
    updateMe,
    deleteMe,
    getPublicProfile,
};
