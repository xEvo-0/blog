# Inkwell

Inkwell is a full-stack blog application for publishing and browsing stories. Readers can explore posts, filter by category, and search the collection. A configured administrator can sign in to create, edit, and delete posts.

## Features

- Browse, search, and filter posts by category
- Paginated post listings and individual post pages
- Admin sign-in using a short-lived JWT
- Admin-only post creation, editing, and deletion
- Optional cover images (JPG, PNG, WEBP, or GIF; up to 5 MB)
- MongoDB-backed storage and an Express REST API
- Responsive React interface

## Tech stack

- **Client:** React, Vite, React Router
- **Server:** Node.js, Express
- **Database:** MongoDB with Mongoose
- **Authentication:** JSON Web Tokens (JWT)

## Requirements

- Node.js 20 or newer
- npm
- A MongoDB instance, local or hosted

## Local development

1. Install dependencies from the repository root:

   ```sh
   npm install
   ```

2. Create `server/.env` and configure the server:

   ```dotenv
   MONGODB_URI=mongodb://127.0.0.1:27017/inkwell
   PORT=5000
   CLIENT_ORIGIN=http://localhost:5173
   ADMIN_USERNAME=choose-an-admin-username
   ADMIN_PASSWORD=choose-a-strong-password
   JWT_SECRET=replace-with-a-random-secret-at-least-32-characters-long
   ```

   Use a unique, randomly generated `JWT_SECRET` of at least 32 characters. For example, generate one with:

   ```sh
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

   Keep `server/.env` private and never commit real credentials or secrets.

3. Start the API and client together:

   ```sh
   npm run dev
   ```

4. Open the Vite URL printed in the terminal (normally `http://localhost:5173`). The API listens on port `5000` by default. During development, Vite proxies `/api` and `/uploads` to the API.

There is no public registration endpoint. The administrator account is configured using `ADMIN_USERNAME` and `ADMIN_PASSWORD`.

## Commands

Run these commands from the repository root:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the client and API in development mode |
| `npm run build` | Create the production client build |
| `npm start` | Start the API |

## API

All routes are prefixed with `/api`. Unless noted, endpoints that read posts are public.

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Report API and database connection status | Public |
| `POST` | `/api/auth/login` | Exchange admin credentials for a JWT | Public |
| `GET` | `/api/posts` | List posts with pagination and optional search/category filters | Public |
| `GET` | `/api/posts/categories` | List categories used by posts | Public |
| `GET` | `/api/posts/:slug` | Get a post by its slug | Public |
| `POST` | `/api/posts` | Create a post | Admin |
| `PUT` | `/api/posts/:slug` | Update a post | Admin |
| `DELETE` | `/api/posts/:slug` | Delete a post | Admin |

### Sign in

Send the configured administrator credentials as JSON:

```sh
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"your-admin-username","password":"your-admin-password"}'
```

The response contains a JWT that expires after one hour. Include it as a bearer token when calling protected endpoints:

```text
Authorization: Bearer <token>
```

The client provides an **Admin sign in** page and attaches the token to post-management requests. Signing out removes the locally stored token.

### Posts

`GET /api/posts` accepts these query parameters:

| Parameter | Description |
| --- | --- |
| `page` | Page number; defaults to `1` |
| `limit` | Results per page; defaults to `9` and is capped at `24` |
| `q` | Search posts by text |
| `category` | Filter by category; omit it or use `All` for every category |

Create and update requests use `multipart/form-data` and accept:

- `title` (required)
- `content` (required)
- `excerpt` (optional)
- `category` (optional)
- `tags` (optional; comma-separated)
- `coverImage` (optional; one supported image up to 5 MB)

## Configuration

| Variable | Purpose | Default |
| --- | --- | --- |
| `MONGODB_URI` | MongoDB connection string | Required |
| `ADMIN_USERNAME` | Configured administrator username | Required for sign-in |
| `ADMIN_PASSWORD` | Configured administrator password | Required for sign-in |
| `JWT_SECRET` | Secret used to sign and verify JWTs (minimum 32 characters) | Required for sign-in |
| `PORT` | API listening port | `5000` |
| `CLIENT_ORIGIN` | Comma-separated allowed browser origins | `http://localhost:5173` |
| `VITE_API_URL` | API base URL used by the built client | Empty (same origin) |

For a separately hosted client, set `CLIENT_ORIGIN` on the API to the client’s origin. Set `VITE_API_URL` when building the client if the API is not served from the same origin.

## Project structure

```text
client/
  src/
    api/                 API and authentication clients
    components/          Shared interface components
    App.jsx              Pages and routes
server/
  src/
    config/              Database and JWT configuration
    controllers/         Authentication and post handlers
    middleware/          Authentication, uploads, and errors
    models/              MongoDB schemas
    routes/              API routes
    utils/               Slug and upload helpers
  uploads/               Locally stored cover images
```

## Deployment notes

- Use HTTPS and strong, unique admin credentials and JWT secrets in production.
- Supply secrets through the hosting platform’s environment configuration, not source control.
- Local image uploads are stored on disk under `server/uploads`. Use durable object storage if the deployment uses ephemeral filesystems, and ensure the API can serve the resulting image URLs.
- Build the client with `npm run build` and deploy the generated `client/dist` directory to a static host, or configure your hosting platform to serve it.
