# IRON-PREP

A triathlon gear shop built with **Node.js + Express**, a **PostgreSQL** database and a Bootstrap frontend.

- `backend/views/` – HTML pages (`index.html`, `products.html`, `manage.html`)
- `backend/public/` – CSS and browser JavaScript
- `backend/server.js` – the Express server
- `backend/routes/` → `controllers/` → `models/` – the REST API (MVC)
- `backend/db/` – database schema, sample data and setup script

## Getting started

### 1. Install PostgreSQL (once)

Download it from https://www.postgresql.org/download/ and remember the password you choose for the `postgres` user during installation. Leave the port as **5432**.

### 2. Install the Node packages

```bash
cd backend
npm install
```

### 3. Create your `.env` file

Copy `backend/.env.example` to `backend/.env` and set `DB_PASSWORD` to your PostgreSQL password. `.env` is ignored by git, so every teammate has their own.

### 4. Create the database

```bash
npm run db:setup
```

This creates the `iron_prep` database and its tables, and loads the 6 shop products plus a demo account.
**It resets all tables**, so run it again any time you want a clean database (accounts and orders you created are deleted).

### 5. Start the server

```bash
npm start        # or: npm run dev   (restarts automatically when you change a file)
```

Open http://localhost:3000. The terminal tells you whether the database connected. If it didn't, it says how to fix it.

**Development demo administrator:** `demo@iron-prep.test` / `IronPrep2026!`. This seeded account is for local demos only; never use it in a deployed environment.

**Manage products:** http://localhost:3000/products/manage lets administrators add, edit and delete products. New registrations are regular athlete accounts. Every change goes through the REST API to PostgreSQL (`public/manage.js`).

## Database

| Table | What it stores |
|---|---|
| `products` | Shop products: name, category, description, price, image |
| `users` | Athlete accounts: name, email, bcrypt password hash, target race, admin flag |
| `wishlist_items` | "My Gear": which products each athlete saved |
| `orders` | Saved orders: who ordered and the total |
| `order_items` | The products in each order, with the name and price at the time of the order |

Deleting a user also deletes their wishlist and orders. See `backend/db/schema.sql` for the full definitions. `npm run db:migrate` applies pending, tracked migrations without resetting existing data; `npm run db:setup` is destructive and rebuilds all tables.

## REST API

Every response is JSON: `{ "success": true, ... }` or `{ "success": false, "error": "message" }`.

### Products

| Method | URL | Body / query | Notes |
|---|---|---|---|
| GET | `/api/products` | `?search=gel&category=Nutrition&minPrice=10&maxPrice=50&sort=price_asc` | All filters optional. `sort`: `newest`, `price_asc`, `price_desc`, `name` |
| GET | `/api/products/categories` | | List of category names |
| GET | `/api/products/:id` | | One product |
| POST | `/api/products` 🔒 Admin | `{ name, price, category?, description?, imageUrl? }` | Creates a product (201) |
| PUT | `/api/products/:id` 🔒 Admin | any of the fields above | Changes only the fields you send |
| DELETE | `/api/products/:id` 🔒 Admin | | Deletes a product |

### Accounts (login is remembered with a session cookie)

| Method | URL | Body | Notes |
|---|---|---|---|
| POST | `/api/users/register` | `{ name, email, password, targetRace? }` | Password 8–72 characters. Logs the new user in |
| POST | `/api/users/login` | `{ email, password, rememberMe? }` | `rememberMe: true` keeps the login for 30 days |
| POST | `/api/users/logout` | | |
| GET | `/api/users/me` 🔒 | | The logged-in athlete's profile |
| PUT | `/api/users/me` 🔒 | `{ name?, email?, targetRace?, newPassword?, currentPassword? }` | Changing the password needs `currentPassword` |
| DELETE | `/api/users/me` 🔒 | | Deletes the account, its wishlist and orders |
| GET | `/api/users/me/wishlist` 🔒 | | "My Gear" products |
| POST | `/api/users/me/wishlist` 🔒 | `{ productId }` | |
| DELETE | `/api/users/me/wishlist/:productId` 🔒 | | |
| GET | `/api/users/:id` | | Public profile (no email) |

### Orders

| Method | URL | Body | Notes |
|---|---|---|---|
| GET | `/api/orders` 🔒 | | The logged-in athlete's orders with their items |
| POST | `/api/orders` 🔒 | `{ items: [{ productId, quantity }] }` | Prices come from the database, not the browser |

🔒 = needs login, otherwise the API answers `401 Please log in first`. Admin-only routes answer `403 Administrator access required` to regular accounts. Product search and reads remain public.

### Public and private access

- Public: product search, categories and product details; account registration and login; public athlete profiles (without email).
- Private to the signed-in account: profile, wishlist and order endpoints. These routes always use the user ID from the server session, not an ID supplied by the browser.
- Admin-only: the `/products/manage` page and product create, update and delete API routes. The server checks the account's database role on every request; hiding the navigation link is only a UI convenience, not the security boundary.
- Use **Log out** on the profile dashboard to end the session and switch accounts during a demo.

For the live demo, first request `/api/users/me/wishlist` or `/api/orders` without logging in and show the `401` response. Then log in as the seeded development administrator to manage the catalog. Use an ordinary registered account to show that catalog write requests return `403`.

### Using the API from the frontend

The pages are served by the same Express server, so `fetch` sends the login cookie automatically:

```js
const response = await fetch("/api/users/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, rememberMe }),
});
const data = await response.json();

if (!data.success) {
    showError(data.error); // e.g. "Incorrect email or password"
}
```

Note: logins are kept in the server's memory, so everyone is logged out whenever the server restarts.

## Troubleshooting

| Message in the terminal | Fix |
|---|---|
| `Cannot reach PostgreSQL at localhost:5432` | Start the PostgreSQL service (Windows: Services → postgresql → Start) |
| `PostgreSQL rejected the password` / `DB_PASSWORD is empty` | Fix `DB_PASSWORD` in `backend/.env` |
| `The database "iron_prep" does not exist yet` / `tables are missing` | Run `npm run db:setup` |
| `Port 3000 is already in use` | The server is already running in another window. Close it or press Ctrl + C there |
| `Cannot find module '...'` | Run `npm install` in the `backend` folder |
