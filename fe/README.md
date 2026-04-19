# funded.gr — Frontend

Next.js 14 (Pages Router) + Tailwind CSS + SWR.

## Prerequisites

- Node 20+
- A running backend (see `../be/README.md`)
- AWS Cognito User Pool created

## Setup

```bash
cd fe
npm install
```

Create `.env.development` (already tracked in repo — fill in your values):

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_COGNITO_USER_POOL_ID=eu-central-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_COGNITO_DOMAIN=auth.funded.gr
```

## Run

```bash
npm run dev
```

Open http://localhost:3000

## Notes

- Auth uses Cognito directly via the SDK — no Hosted UI. You need a real User Pool (no local mock).
- Sign-up sends a real verification email via Cognito.
- `NEXT_PUBLIC_COGNITO_DOMAIN` is only used for the Hosted UI OAuth flow, not for SDK sign-in.
- In production, set `NEXT_PUBLIC_API_BASE_URL` to your API Gateway invoke URL.
