-- IRON-PREP database schema (PostgreSQL)
-- WARNING: running this file deletes all tables and their data, then creates them again.
-- Run it with: npm run db:setup   (that also loads the sample data from seed.sql)

DROP TABLE IF EXISTS order_items, orders, wishlist_items, users, products CASCADE;

-- Products sold in the shop
CREATE TABLE products (
    id          SERIAL        PRIMARY KEY,
    name        VARCHAR(120)  NOT NULL,
    category    VARCHAR(40)   NOT NULL DEFAULT 'General',
    description TEXT          NOT NULL DEFAULT '',
    price       NUMERIC(10,2) NOT NULL CHECK (price > 0),
    image_url   TEXT,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products (category);

-- Athlete accounts (passwords are stored as bcrypt hashes, never as plain text)
CREATE TABLE users (
    id            SERIAL       PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT         NOT NULL,
    target_race   VARCHAR(120),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- "My Gear" wishlist: products an athlete has saved (each product at most once per athlete)
CREATE TABLE wishlist_items (
    user_id    INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    product_id INTEGER     NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, product_id)
);

-- Saved orders
CREATE TABLE orders (
    id         SERIAL        PRIMARY KEY,
    user_id    INTEGER       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    total      NUMERIC(10,2) NOT NULL CHECK (total >= 0),
    created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON orders (user_id);

-- The products inside each order. Name and price are copied at checkout,
-- so old orders stay correct even if a product is later renamed, repriced or deleted.
CREATE TABLE order_items (
    id           SERIAL        PRIMARY KEY,
    order_id     INTEGER       NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    product_id   INTEGER       REFERENCES products (id) ON DELETE SET NULL,
    product_name VARCHAR(120)  NOT NULL,
    unit_price   NUMERIC(10,2) NOT NULL CHECK (unit_price > 0),
    quantity     INTEGER       NOT NULL CHECK (quantity BETWEEN 1 AND 99)
);

CREATE INDEX idx_order_items_order_id ON order_items (order_id);
