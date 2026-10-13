# MINT

**Machine Inspection and Normalization Toolkit**

A two-part SaaS product for engineering managers: a lightweight Tauri background agent (Mac) that scans each engineer's machine and syncs to a Next.js dashboard where managers set a golden config and track team environment health.

## Stack

- **Agent:** Tauri v2 (Rust + React), Mac only
- **Dashboard:** Next.js 16 (App Router), Supabase, Stripe
- **Auth:** Supabase magic link
- **Billing:** Stripe seat-based ($15/seat/month)

## Getting Started

1. Copy `.env.local.example` to `.env.local` and fill in Supabase + Stripe keys
2. Apply migrations: `supabase db push`
3. `npm install && npm run dev`
