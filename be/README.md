# funded.gr — Backend

FastAPI + Mangum, deployed as a single AWS Lambda. PydanticAI for AI evaluation, DynamoDB single-table design.

## Local development (Docker)

The recommended way to run locally. Points at real AWS DynamoDB.

```bash
cd be
cp .env.docker .env.docker.local   # optional: keep a local override
# Edit .env.docker and fill in real values (see Environment Variables below)

docker compose up --build
```

API available at http://localhost:8000  
Swagger docs at http://localhost:8000/docs

### `.env.docker` values

```
DYNAMODB_TABLE_NAME=funded-gr
AWS_REGION=eu-central-1
COGNITO_USER_POOL_ID=eu-central-1_XXXXXXXXX
COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
CORS_ORIGIN=http://localhost:3000
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
GITHUB_TOKEN=ghp_...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

## Local development (without Docker)

```bash
cd be
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt uvicorn[standard]
uvicorn app.main:app --reload --port 8000
```

Set the same environment variables from `.env.docker` in your shell or a local `.env` file.

## Deploy to Lambda

### Package

```bash
cd be
pip install -r requirements.txt -t package/
cp -r app lambda_handler.py package/
cd package && zip -r ../function.zip . && cd ..
```

Upload `function.zip` in the Lambda console.

| Setting | Value |
|---|---|
| Runtime | Python 3.12 |
| Handler | `lambda_handler.handler` |
| Timeout | 60s |
| Memory | 256 MB |

### Lambda environment variables

```
DYNAMODB_TABLE_NAME=funded-gr
AWS_REGION=eu-central-1
COGNITO_USER_POOL_ID=eu-central-1_XXXXXXXXX
COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
GITHUB_TOKEN=ghp_...
CORS_ORIGIN=https://funded.gr
```

No `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` needed — the Lambda execution role provides credentials automatically.

### Triggers to attach

| Trigger | Config |
|---|---|
| API Gateway | Proxy integration, all routes (`/{proxy+}`) |
| Cognito Post Confirmation | Attach to your User Pool → Triggers → Post confirmation |
| EventBridge | Cron `0 2 * * ? *` for daily GitHub star refresh |

### IAM permissions

The Lambda execution role needs:
- `dynamodb:*` on the `funded-gr` table and its indexes
- `lambda:InvokeFunction` on itself (used by the async evaluation worker)

A scoped IAM policy is available at `../plan.md`.

## Bootstrap first admin

After signing up through the app, promote your user to admin:

```bash
# From the repo root — requires AWS credentials configured locally
python scripts/create_admin.py <userId> <table_name>

# Example:
python scripts/create_admin.py abc123-sub-from-cognito funded-gr
```

`userId` is the Cognito `sub` value, visible in DynamoDB or the Cognito console.
