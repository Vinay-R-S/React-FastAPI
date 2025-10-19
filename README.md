# ProUX — Full-stack Product Reviews App

> **ProUX** is a small full-stack application (frontend + backend) that lets users sign up / log in, browse products, add reviews, and — for admins — manage products and delete any review.

This README covers everything from **initial setup** to **running the app**, the **API** (endpoints + examples), and the **overall architecture**. It also includes troubleshooting tips and recommended next steps.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Tech Stack](#tech-stack)
3. [Environment & Configuration](#environment--configuration)
4. [Initial Setup (Backend)](#initial-setup-backend)
5. [Initial Setup (Frontend)](#initial-setup-frontend)
6. [Run Locally](#run-locally)
7. [API Reference](#api-reference)
8. [Authentication & Authorization](#authentication--authorization)
9. [Database schema expectations (Supabase)](#database-schema-expectations-supabase)
10. [Architecture (diagram + explanation)](#architecture-diagram--explanation)
11. [Troubleshooting & Tips](#troubleshooting--tips)
12. [Next steps & Improvements](#next-steps--improvements)

---

## Project Structure

```
project/
├─ backend/
│  ├─ main.py                 # FastAPI backend (endpoints, auth, supabase access)
│  ├─ .env                    # SUPABASE_URL + SUPABASE_KEY
│  ├─ requirements.txt        # Python dependencies
│  └─ utils/
│     └─ supabase_client.py   # create_client wrapper

├─ frontend/
│  ├─ package.json
│  ├─ src/
│  │  ├─ App.tsx
│  │  ├─ main.tsx
│  │  └─ components/          # React components (AuthForm, AdminHome, UserHome, ProductDetails, AdminReviews)
│  └─ public/

```

I used the names from the project you provided. The frontend is a Vite + React(Typescript) app with Tailwind/ui components. The backend is a FastAPI app talking to Supabase via its Python client.

---

## Tech Stack

* **Backend:** FastAPI (Python), Supabase (Postgres-like DB + REST), jose (JWT), bcrypt (password hashing)
* **Frontend:** React + TypeScript, Vite, Tailwind-like components, react-router, Sonner (toasts)
* **Auth:** JWT bearer tokens (signed with `SECRET_KEY` in `main.py`)

---

## Environment & Configuration

**Backend (.env)** — required variables (already present in `backend/.env`):

```
SUPABASE_URL=<your-supabase-url>
SUPABASE_KEY=<your-service-role-or-api-key>
```

**Important**

* `SECRET_KEY` is currently hard-coded in `main.py` as `"dummy_key"`. **Change this** for production — store it in env vars and read from `os.environ`.
* `SUPABASE_KEY` in `.env` should be kept secret. For server-side usage you can use service role key but be aware of the permissions.

**Frontend**

* The front expects the backend running at `http://127.0.0.1:8000` (hard-coded in fetch calls). If you run backend elsewhere, update the fetch base URLs in `src/components/*` (or better: centralize into an `API_BASE` env variable).
* CORS in the backend is configured to allow `http://localhost:5173` (Vite dev URL). If you run frontend on another port, update `allow_origins` in `main.py`.

---

## Initial setup — Backend

1. Create a Python virtual environment and activate it:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # on macOS / Linux
.venv\Scripts\activate     # on Windows
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Configure `.env` (if not already):

```text
SUPABASE_URL=https://<your-supabase-project>.supabase.co
SUPABASE_KEY=<your-supabase-key>
```

4. (Optional) Set a secure JWT secret in `main.py` or export it as an environment variable and update `main.py` to read it.

5. If using Supabase local tables were not created, create the three tables described below in the Supabase SQL editor.

---

## Initial setup — Frontend

1. Install dependencies and start dev server:

```bash
cd frontend
npm install
npm run dev
# default: http://localhost:5173
```

2. If you want production build:

```bash
npm run build
npm run preview
```

---

## Run locally

Start backend (FastAPI / Uvicorn):

```bash
# from backend/
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Start frontend (from frontend/):

```bash
npm run dev
# open http://localhost:5173
```

Visit the app, sign up and log in. Admin users should be created with `is_admin=true` at signup to access admin endpoints.

---

## API Reference

> Base URL (development): `http://127.0.0.1:8000`

### Auth

#### `POST /signup`

Create a user.

Request body (JSON):

```json
{
  "email": "alice@example.com",
  "password": "supersecret",
  "name": "Alice",
  "is_admin": false
}
```

Response (200):

```json
{
  "message": "Signup successful!",
  "access_token": "<jwt>",
  "token_type": "bearer",
  "user": { "id": 1, "name": "Alice", "email": "alice@example.com", "is_admin": false }
}
```

#### `POST /login`

Login and receive a JWT.

Request body:

```json
{ "email": "alice@example.com", "password": "supersecret" }
```

Response includes `access_token` and `user` object.

---

### Products

#### `GET /products`

List products. Query params supported: `search`, `sort_by` (default `created_at`), `order` (asc|desc).

Response:

```json
{ "data": [ { "id": 1, "name": "Product A", "description": "...", "price": "400" } ] }
```

#### `POST /products`  (Admin only)

Create product.

Header: `Authorization: Bearer <token>`

Body:

```json
{ "name": "New product", "description": "...", "price": "123" }
```

#### `PUT /products/{product_id}`  (Admin only)

Update product fields (partial allowed).

#### `DELETE /products/{product_id}`  (Admin only)

Delete a product.

---

### Reviews

#### `GET /products/{product_id}/reviews`

List reviews for a product. Supports `min_rating`, `max_rating`, `sort_by`, `order`.

Response:

```json
{ "data": [ { "id": 1, "product_id": 2, "user_id": 3, "name": "Bob", "rating": 5, "review": "Great!" } ] }
```

#### `POST /products/{product_id}/reviews`  (Authenticated)

Add a review for a product.

Header: `Authorization: Bearer <token>`

Body:

```json
{ "name": "Bob", "email": "bob@example.com", "phone_number": "1234567890", "rating": 5, "review": "Loved it" }
```

Response: created review object.

#### `PUT /reviews/{review_id}` (Authenticated — owner only)

Update your review.

#### `DELETE /reviews/{review_id}` (Authenticated — owner only)

Delete your review.

#### `DELETE /admin/reviews/{review_id}` (Admin only)

Admin may delete any review.

---

## Authentication & Authorization

* Backend uses JWTs signed with `SECRET_KEY` (HS256). The token's `sub` claim stores the user email.
* Frontend stores `access_token` in `localStorage` under `token` and the `user` object under `user`.
* For protected calls, the frontend sends header `Authorization: Bearer <token>`.
* `require_admin` dependency checks `user['is_admin']` and is applied to admin routes.

---

## Database schema expectations (Supabase)

Create these tables in Supabase (SQL editor or GUI):

### `users`

* `id` (int, pk)
* `name` (text)
* `email` (text, unique)
* `password` (text) — hashed string
* `is_admin` (boolean, default false)
* `created_at` (timestamp)

### `products`

* `id` (int, pk)
* `name` (text)
* `description` (text)
* `price` (text)
* `created_at`, `updated_at` (timestamps)

### `reviews`

* `id` (int, pk)
* `product_id` (int) — foreign key to products.id
* `user_id` (int) — foreign key to users.id
* `name`, `email`, `phone_number` (text)
* `rating` (int)
* `review` (text)
* `created_at`, `updated_at` (timestamps)

> Note: the backend uses Supabase python client `supabase.table("...")...execute()` calls. Adjust column names/types if you already have a different schema.

---

## Architecture — diagram & explanation

```
[Browser / React UI] <--> [FastAPI Backend] <--> [Supabase DB]
         |                 ^                     |
         |                 |                     |
         +-- localStorage --+                     +-- Supabase SQL Tables (users, products, reviews)
```

**Flow examples**

* Sign up: UI -> `POST /signup` -> backend hashes password -> inserts into `users` -> returns JWT.
* Add review: UI (with token) -> `POST /products/{id}/reviews` -> backend validates token -> inserts review with `user_id`.
* Admin create product: UI (admin) -> `POST /products` (with admin token) -> backend verifies `is_admin` -> inserts product.

---

## Troubleshooting & Tips

* **Cannot connect to Supabase**: confirm `SUPABASE_URL` and `SUPABASE_KEY` in `backend/.env`. Check network, keys, and project region.
* **CORS errors**: update `allow_origins` in `main.py` to match the frontend origin.
* **JWT token errors**: if you change `SECRET_KEY`, previously issued tokens will be invalidated.
* **Passwords failing login**: ensure password was hashed (bcrypt) during signup and you are checking with `bcrypt.checkpw` during login.
* **Frontend fetch uses `127.0.0.1:8000`**: if running backend in docker or remote, update fetch URLs or add a `VITE_API_BASE` variable and centralize calls.

---

## Next steps & improvements

* Move `SECRET_KEY` to env var and load via `os.environ`.
* Centralize API base URL in the frontend (e.g., `import.meta.env.VITE_API_BASE`).
* Add pagination for `GET /products` and `GET /products/{id}/reviews`.
* Add rate-limiting and input validation improvements.
* Add improved role management & user verification email flow.
* Add unit/integration tests, CI pipeline (GitHub Actions).

---

## Useful commands / quick checklist

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

---

If you want, I can:

* generate a `docker-compose.yml` to run both services together, or
* create a `.env.example` and script to centralize API host for the frontend, or
* produce a Postman collection / cURL examples for each endpoint.

Tell me which of the above you want next and I will add it directly in the canvas file.
