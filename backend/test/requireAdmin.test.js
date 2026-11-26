const assert = require("node:assert/strict");
const { test } = require("node:test");
const requireAdmin = require("../middleware/requireAdmin");
const userModel = require("../models/userModel");

const createResponse = () => ({
    statusCode: 200,
    body: null,
    status(statusCode) {
        this.statusCode = statusCode;
        return this;
    },
    json(body) {
        this.body = body;
        return this;
    },
});

const checkAsUser = async (user) => {
    const originalGetById = userModel.getById;
    userModel.getById = async () => user;
    const response = createResponse();
    let nextCalled = false;

    try {
        await requireAdmin(
            { session: { userId: 1 } },
            response,
            () => { nextCalled = true; },
        );
    } finally {
        userModel.getById = originalGetById;
    }

    return { response, nextCalled };
};

test("rejects requests without a logged-in session", async () => {
    const response = createResponse();
    let nextCalled = false;

    await requireAdmin({}, response, () => { nextCalled = true; });

    assert.equal(response.statusCode, 401);
    assert.equal(nextCalled, false);
});

test("rejects a session whose account no longer exists", async () => {
    const { response, nextCalled } = await checkAsUser(null);

    assert.equal(response.statusCode, 401);
    assert.equal(nextCalled, false);
});

test("rejects logged-in non-admin users", async () => {
    const { response, nextCalled } = await checkAsUser({ id: 1, isAdmin: false });

    assert.equal(response.statusCode, 403);
    assert.equal(nextCalled, false);
});

test("allows logged-in administrators", async () => {
    const { response, nextCalled } = await checkAsUser({ id: 1, isAdmin: true });

    assert.equal(response.statusCode, 200);
    assert.equal(nextCalled, true);
});
