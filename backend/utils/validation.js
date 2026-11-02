// Small helpers for checking request data before it reaches the database

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 72; // bcrypt only uses the first 72 bytes of a password

// Returns the value as a positive whole number, or null if it isn't one (e.g. "abc", "-1", "2.5")
const parseId = (value) => {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 && id <= 2147483647 ? id : null;
};

const isNonEmptyString = (value, maxLength) => (
    typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength
);

const isValidEmail = (value) => (
    typeof value === "string" && value.trim().length <= 255 && EMAIL_PATTERN.test(value.trim())
);

const isValidPassword = (value) => (
    typeof value === "string" && value.length >= PASSWORD_MIN_LENGTH && value.length <= PASSWORD_MAX_LENGTH
);

const isValidPrice = (value) => (
    typeof value === "number" && Number.isFinite(value) && value > 0 && value < 100000000
);

// Sends an error response in the same { success, error } shape every route uses
const sendError = (res, status, message) => res.status(status).json({
    success: false,
    error: message,
});

module.exports = {
    PASSWORD_MIN_LENGTH,
    PASSWORD_MAX_LENGTH,
    parseId,
    isNonEmptyString,
    isValidEmail,
    isValidPassword,
    isValidPrice,
    sendError,
};
