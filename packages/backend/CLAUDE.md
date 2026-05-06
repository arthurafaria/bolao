<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->

# Bolão Backend Notes

## Auth

- Auth lives in `convex/auth.ts` and uses `@convex-dev/auth`.
- Providers are `Password` with `verify: ResendOTP` plus Google OAuth from `@auth/core/providers/google`.
- Email signup is a two-step flow: `flow: "signUp"` creates the pending account and sends a 6-digit OTP, then `flow: "email-verification"` confirms the code.
- OTP delivery is implemented in `convex/ResendOTP.ts`, uses `AUTH_RESEND_KEY`, and expires codes after 15 minutes.
- Do not reintroduce `BETTER_AUTH_*` variables; the app migrated to Convex Auth.

## Required Convex Env

- `JWT_PRIVATE_KEY` and `JWKS` must be RSA 2048 / RS256.
- `SITE_URL` must point to the frontend URL in production.
- `AUTH_RESEND_KEY` is required for email verification.
- `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are required if Google OAuth is enabled.
- `FOOTBALL_DATA_API_KEY` powers football-data.org sync.
- `API_FOOTBALL_KEY` is optional and only enriches venue data when the plan supports the target season.

## Local Commands

- `bun run dev:server` starts Convex dev from the repo root.
- `bun run check-types` runs TypeScript for the Convex package.
- `npx convex logs --tail` is the quickest way to inspect backend runtime failures.
