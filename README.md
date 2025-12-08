# Luckybeard Tech Launchpad – Todo API (2026)

A fully-featured, user-isolated Todo API with authentication, CRUD operations, file upload, analytics and an AI-assisted productivity module (powered by HuggingFace).  
Built using **Node.js**, **Express**, **Prisma**, **PostgreSQL**, and **Docker**.

---

## Features

### Authentication (JWT)
- Register, login, get profile, delete account (soft delete)
- Per-user token-based access control
- Passwords hashed securely

### Todos
- Create, Read, Update, Delete
- Per-user isolation enforced at database and application level
- Status tracking: pending, in-progress, done
- Automatic timestamps

### Bulk Upload
- Upload JSON or CSV files to bulk-create Todos
- Merged into existing user Todos

### Analytics
- Counts of completed, pending, deleted, and total todos
- Designed with extendable metrics

### AI Integration (HuggingFace)
- `/api/todos/generate` — generate todo suggestions from a prompt  
- `/api/todos/coach` — produce personalised productivity coaching advice  
- Per-user isolation—no shared context between users

### Health Check
- `/api/health`

### Docker Support
- Fully dockerised environment
- Prisma migrations applied automatically at startup
- `docker compose up --build` = everything works

---

# Requirements

- Node.js ≥ 18  
- npm ≥ 9  
- Docker & Docker Compose  
- Postman (for testing)

---

# Getting Started (Docker)

### 1. Clone the repo

```sh
git clone https://github.com/bahiya666/luckybeard-tech-launchpad-2026.git
cd luckybeard-tech-launchpad-2026/server
```

### 2. Create your `.env` file

Copy from the example:

```sh
cp env.example .env
```

Fill in:
- PostgreSQL password
- JWT secret
- HuggingFace API key

### 3. Start everything

```sh
docker compose up --build
```

Wait for:

```
🚀 Server running on port 3000
```

This means:
- PostgreSQL is running
- Migrations applied
- API fully operational

---

# Running Without Docker (Local Node)

Ensure Postgres is running locally.

```sh
npm install
cp env.example .env
npm run build
npm start
```

---

# Database Migrations

To manually apply migrations inside the container:

```sh
docker compose exec luckybeard_api npx prisma migrate deploy
```

To generate new migrations:

```sh
npx prisma migrate dev
```

---

# Creating the SQL Dump (Required for Submission)

Run while the containers are up:

```sh
docker compose exec db pg_dump -U postgres -d luckybeard -F p -f /tmp/luckybeard.sql
docker compose cp $(docker compose ps -q db):/tmp/luckybeard.sql ./luckybeard.sql
docker compose exec db rm /tmp/luckybeard.sql
```

This creates `luckybeard.sql` in the `server/` folder.

---

# Postman Collection

The project includes a Postman folder:

```
postman/
  Luckybeard Todo API.postman_collection.json  
  Luckybeard Local.postman_environment.json
```

Import both into Postman.

Set:

```
baseUrl = http://localhost:3000
token   = <leave empty until login then add the login token>
```

---

# Security Notes
- `.env` **must NOT be committed**  
- `env.example` contains non-sensitive placeholders  
---

# Optional Testing (Jest + Supertest)

Tests can be added in:

```
tests/
  ai.test.ts
  auth.test.ts
  health.test.ts
  todos.test.ts
  upload.test.ts
```

Run using:

```sh
npm test
```

---

# What’s Included in This Submission

- Full API implementation  
- Per-user data isolation  
- AI-powered Todo generation and productivity coaching  
- Bulk upload & analytics  
- Dockerised environment  
- Prisma schema + migrations  
- SQL dump  
- Postman documentation  
- README + instructions  
- `env.example`

---

# Author

Submitted for the **Luckybeard Tech Launchpad 2026** challenge.

