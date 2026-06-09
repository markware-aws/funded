# funded.gr — Frontend

Next.js (Pages Router) + Tailwind CSS + SWR.

See [`../README.md`](../README.md) for the full local setup guide.

## Prerequisites

- Node 20+
- A running backend (see `../be/README.md`)
- AWS Cognito User Pool created

## Setup

```bash
cd fe
npm install
cp env.development.example .env.development
# Edit .env.development with your Cognito and API values
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
