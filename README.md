# funded.gr

Greek startup and side-project showcase. Founders submit projects, admins review them, the community can like published projects, and owners can request an AI evaluation.

## Repository structure

| Directory | Stack | Role |
|-----------|-------|------|
| [`fe/`](fe/) | Next.js (Pages Router), Tailwind, SWR | Static frontend |
| [`be/`](be/) | FastAPI, Mangum, DynamoDB | API (single Lambda in production) |

More detail: [`fe/README.md`](fe/README.md) · [`be/README.md`](be/README.md)

## Prerequisites

- **Node.js 20+** — frontend
- **Python 3.12+** or **Docker** — backend
- **AWS account** with:
  - DynamoDB table (single-table design; default name `funded-gr`)
  - Cognito User Pool + app client
  - IAM credentials with DynamoDB access (for local backend)
- **OpenAI API key** — optional; only needed for AI evaluation
- **GitHub token** — optional; only needed for daily star-count refresh
- **Cloudflare Turnstile** — optional; only needed for the contact form

## Quick start

Run the backend and frontend in separate terminals.

### 1. Backend

**Docker (recommended)**

```bash
cd be
cp env.docker.example .env.docker
# Edit .env.docker with your AWS and Cognito values

docker compose up --build
```

API: http://localhost:8000  
Swagger: http://localhost:8000/docs

**Without Docker**

```bash
cd be
python -m venv .venv

# macOS / Linux
source .venv/bin/activate

# Windows (PowerShell)
.venv\Scripts\Activate.ps1

# Windows (Git Bash / cmd)
source .venv/Scripts/activate

pip install -r requirements.txt "uvicorn[standard]"
cp env.docker.example .env
# Edit .env with the same values as above

uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd fe
npm install
cp env.development.example .env.development
# Edit .env.development — Cognito IDs must match the backend pool

npm run dev
```

App: http://localhost:3000

Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000` so the frontend talks to the local API (the code default is port 3001).

## Environment variables

### Backend (`be/.env.docker` or `be/.env`)

Copy from [`be/env.docker.example`](be/env.docker.example).

| Variable | Required | Description |
|----------|----------|-------------|
| `DYNAMODB_TABLE_NAME` | Yes | DynamoDB table name |
| `AWS_REGION` | Yes | e.g. `eu-central-1` |
| `AWS_ACCESS_KEY_ID` | Yes (local) | Not needed on Lambda — role provides credentials |
| `AWS_SECRET_ACCESS_KEY` | Yes (local) | |
| `COGNITO_USER_POOL_ID` | Yes | Must match frontend |
| `COGNITO_CLIENT_ID` | Yes | Must match frontend |
| `CORS_ORIGIN` | Yes | `http://localhost:3000` for local dev |
| `OPENAI_API_KEY` | For eval | AI project evaluation |
| `OPENAI_MODEL` | No | Default `gpt-4o` |
| `GITHUB_TOKEN` | No | GitHub star refresh cron |
| `TURNSTILE_SECRET_KEY` | No | Contact form bot check |

### Frontend (`fe/.env.development`)

Copy from [`fe/env.development.example`](fe/env.development.example).

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | `http://localhost:8000` locally |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | Yes | Same pool as backend |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | Yes | Same client as backend |
| `NEXT_PUBLIC_COGNITO_DOMAIN` | For OAuth | Cognito Hosted UI domain |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | No | Contact form widget |

Env files are gitignored. Use the `.example` files as templates.

## Cognito setup

1. Create a User Pool in the same region as DynamoDB.
2. Add an app client (no client secret for browser SDK auth).
3. Enable email sign-up and verification if using email/password.
4. Copy the User Pool ID and Client ID into both backend and frontend env files.

Auth uses the Cognito SDK directly in the browser — a real User Pool is required.

On first authenticated request, `GET /users/me` creates the DynamoDB user profile if the Cognito post-confirmation trigger is not wired locally.

## Bootstrap an admin user

1. Sign up through the app at http://localhost:3000.
2. Find your Cognito `sub` (user ID) in the Cognito console or DynamoDB.
3. Set `role` to `admin` on the user profile item (`PK = USER#<sub>`, `SK = PROFILE`).

If you have the helper script (see [`be/README.md`](be/README.md)):

```bash
python scripts/create_admin.py <userId> <table_name>
```

## Verify the setup

1. Backend health: `curl http://localhost:8000/health` → `{"status":"ok"}`
2. Sign up / sign in on the frontend.
3. Create a draft project from **Profile** or **Submit**.
4. Promote yourself to admin, then approve the project from **Admin**.

## Local development notes

| Feature | Local behavior |
|---------|----------------|
| Auth | Real Cognito; verification emails are sent |
| Database | Real DynamoDB (not DynamoDB Local by default) |
| AI evaluation | Async worker invokes Lambda; **does not run** without `AWS_LAMBDA_FUNCTION_NAME` and a deployed function |
| Contact form | Needs Turnstile site key + secret; otherwise submissions fail verification |
| GitHub refresh | EventBridge cron; only runs in deployed Lambda |

Core flows — sign-up, project CRUD, admin review, likes — work against real AWS with the backend and frontend running locally.

## Production build (frontend)

```bash
cd fe
npm run build
```

Output is written to `fe/out/` for S3 + CloudFront static hosting. Set `NEXT_PUBLIC_API_BASE_URL` to your API Gateway URL before building.

## Deploy backend

See [`be/README.md`](be/README.md) for Lambda packaging, triggers (Cognito, EventBridge), and IAM permissions.
