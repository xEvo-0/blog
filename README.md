# Inkwell

Inkwell is a full-stack blog application for publishing and browsing stories. Readers can explore posts, filter by category, and search the collection. Anyone can register as an author; authors manage their own posts, while the configured administrator can manage every post.

## Features

- Browse, search, and filter posts by category
- Paginated post listings and individual post pages
- Public author registration and sign-in using short-lived JWTs
- Authors can create posts and manage only their own posts
- Admins can manage every post
- Passwords are hashed before storage and auth endpoints are rate-limited
- Optional cover images (JPG, PNG, WEBP, or GIF; up to 5 MB)
- MongoDB-backed storage and an Express REST API
- Responsive React interface

## Tech stack

- **React** — builds the interactive, component-based user interface.
- **Vite** — runs the client development server and creates the production client bundle.
- **React Router** — handles client-side navigation between stories, account pages, and the editor.
- **Node.js** — JavaScript runtime used by the API server.
- **Express** — provides the REST API, middleware pipeline, and static image routes.
- **MongoDB** — stores user accounts and blog posts.
- **Mongoose** — defines MongoDB models, validates data, and manages database queries.
- **JSON Web Tokens (JWT)** — authenticates API requests with short-lived signed tokens.
- **bcryptjs** — hashes author passwords before they are stored.
- **Multer** — validates and saves uploaded cover-image files.
- **Lucide React** — supplies interface icons.

## How the application works

1. The React client requests public post data from the Express API.
2. Express reads and writes posts and accounts in MongoDB through Mongoose.
3. Authors register and sign in to receive a one-hour JWT. The browser sends the token with post-management requests.
4. The API checks the token and role. Authors can manage their own posts; the optional configured admin can manage all posts.
5. Cover images are uploaded to the API and their URLs are stored on the related post.

The client and server are separate npm workspaces in a single repository. During development, Vite proxies `/api` and `/uploads` requests to the local API.

## Image storage

Cover images are currently stored on the API server's local filesystem in `server/uploads/`. The API serves them from `/uploads/`. JPEG, PNG, WEBP, and GIF files are accepted, with a 5 MB limit and one cover image per request.

**Cloudinary is not currently integrated.** For deployments where local files may be removed during a redeploy or instance restart, configure durable image storage (such as Cloudinary or object storage) before production use.

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
   # Optional environment-based administrator account; set both or neither
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

Public registration creates author accounts. Configure `ADMIN_USERNAME` and `ADMIN_PASSWORD` if you also want the environment-based administrator account; admin credentials are separate from registered users.

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
| `POST` | `/api/auth/register` | Create an author account and receive a JWT | Public |
| `POST` | `/api/auth/login` | Sign in as a registered author or configured admin | Public |
| `GET` | `/api/posts` | List posts with pagination and optional search/category filters | Public |
| `GET` | `/api/posts/categories` | List categories used by posts | Public |
| `GET` | `/api/posts/:slug` | Get a post by its slug | Public |
| `POST` | `/api/posts` | Create a post | Author or admin |
| `PUT` | `/api/posts/:slug` | Update a post | Owner or admin |
| `DELETE` | `/api/posts/:slug` | Delete a post | Owner or admin |

### Register

Create a public author account with a username, email address, and password:

```sh
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"your-username","email":"you@example.com","password":"a-strong-password"}'
```

Usernames are 3–30 characters and may contain letters, numbers, dots, underscores, and hyphens. Passwords must be at least 8 characters and no more than 72 bytes. Registration signs the new author in immediately and returns a JWT that expires after one hour.

Sign-in is limited to 10 attempts per IP every 15 minutes; registration is limited to 5 accounts per IP per hour.

### Sign in

Registered authors can sign in with their username or email address. The configured admin signs in with `ADMIN_USERNAME`.

```sh
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"your-username-or-email","password":"your-password"}'
```

Include the returned JWT as a bearer token when calling protected endpoints:

```text
Authorization: Bearer <token>
```

The client provides **Register** and **Sign in** pages and attaches the token to post-management requests. Authors can edit or delete only their own posts; admins can manage all posts. Signing out removes the locally stored token.

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
| `ADMIN_USERNAME` | Configured administrator username | Optional; required with `ADMIN_PASSWORD` for admin sign-in |
| `ADMIN_PASSWORD` | Configured administrator password | Optional; required with `ADMIN_USERNAME` for admin sign-in |
| `JWT_SECRET` | Secret used to sign and verify JWTs (minimum 32 characters) | Required for registration and sign-in |
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
    models/              User and post MongoDB schemas
    routes/              API routes
    utils/               Slug and upload helpers
  uploads/               Locally stored cover images
```

## Deployment notes

- Use HTTPS and strong, unique admin credentials and JWT secrets in production.
- Supply secrets through the hosting platform’s environment configuration, not source control.
- Local image uploads are stored on disk under `server/uploads`. Use durable object storage if the deployment uses ephemeral filesystems, and ensure the API can serve the resulting image URLs.
- Build the client with `npm run build` and deploy the generated `client/dist` directory to a static host, or configure your hosting platform to serve it.
