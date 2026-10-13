# web-dev-project

Here’s what changed, so your teammate can follow the setup:

- **Server entry point:** `backend/server.js` now serves the HTML page at `/` and static assets from `backend/public`. The existing `/health` and JSON 404 responses are unchanged.
- **Frontend files:** The root `index.html`, `style.css`, and `script.js` were **copied**, not moved. The copies are in `backend/views/` and `backend/public/`, so the original standalone frontend remains in place.
- **MVC folders:** Created `backend/controllers`, `backend/models`, and `backend/routes`, along with `backend/config`. The MVC folders are currently just scaffolding; no controllers, routes, or database-backed models have been added yet.
- **MySQL setup:** `backend/config/db.js` creates and exports a `mysql2` connection using `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` environment variables, with local defaults for host, port, and user.
- **Dependency:** Added `mysql2` to `backend/package.json` and updated the lockfile.

To run the server, set `DB_PASSWORD` and `DB_NAME` in your environment, then run `npm run dev` from the `backend` folder. One important detail: the server does **not** import `config/db.js` yet, so it currently serves the site without opening a database connection. A model can use the connection later with `require("../config/db")`.