# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current state

This repo is **pre-implementation**. It currently contains only `README.md` and `BUKIT - Propuesta TFG.docx` — the project proposal (in Spanish). There is no source code, `package.json`, or tooling yet, so there are no build/lint/test commands to run. When scaffolding, follow the architecture below (taken from the proposal) unless the user directs otherwise.

The proposal is authoritative for product and architecture decisions. When intent is unclear, re-read `BUKIT - Propuesta TFG.docx` (extract text with `unzip -p "BUKIT - Propuesta TFG.docx" word/document.xml | sed 's/<[^>]*>/ /g'`) rather than guessing. The document is written in Spanish; the app's primary language is Spanish.

## What BUKIT is

A goal-oriented social network ("bucket list" app). Unlike entertainment-focused social media, every feature drives users toward _completing life goals_ and, optionally, meeting affinity-matched people to pursue them together. Core product pillars: **structure** (goals as lists with deadlines + reminders), **community** (a feed and affinity matching), and **rewarding progress** over popularity.

Key product rules that constrain the data model and API:

- **Two user tiers.** Normal users vs. TOP users (approved creators/influencers). TOP users get unlimited video and high feed-weighting; motivational feed videos are TOP-exclusive. Feed ranking weights TOP content up and normal content down.
- **Lists are the unit of goals.** Free plan caps at 3 lists. Posts of type "progress"/"completed" can **only** be created from the user's _own_ lists.
- **Ephemeral profile content.** Up to 5 free profile posts + unlimited stories; all profile content auto-deletes after 60 days unless kept.
- **Identity verification gates features.** Publishing and the "discovery map" require DNI (national ID) + phone + photo verification. Discovery/meeting strangers is 18+.
- **Four-tab bottom nav** (Instagram-style): Inicio/FYP (Pinterest-style mosaic feed + a second follows-only feed on swipe), Listas, Mensajes+Mapa+Notificaciones, Perfil.

## Intended architecture

A single **monorepo** (Turborepo + TypeScript) with three apps and shared packages. The guiding principle: web and mobile **share logic** (types, validation, API client) but keep native UIs.

- `apps/web` — React + Vite (+ Redux Toolkit with Reselect memoization, TanStack Query for server state / infinite feed).
- `apps/mobile` — React Native + Expo (EAS build, OTA updates, push).
- `apps/api` — Node backend (Express well-structured, or NestJS). JWT + Bcrypt, refresh-token rotation, double-layer rate limiting, centralized error handling.
- `packages/shared` — TypeScript types, **Zod** schemas (validate once, share types both sides), common business logic.
- `packages/api-client` — typed HTTP client reused by web and mobile.

**Database is the most important decision: PostgreSQL** (not NoSQL) via **Prisma**. One engine covers three needs: relational integrity for the social graph, **PostGIS** for geolocation ("people within radius" via `ST_DWithin` + GiST index), and **pgvector** for affinity (embeddings of goals/interests → vector-similarity matching). Store only approximate/blurred location, only for consenting verified users. Host in an EU region for GDPR.

Special features and their intended approach:

- **AI (deadline estimation + affinity):** event-driven, never polling. Call an LLM (Anthropic Claude API or OpenAI) for structured JSON **only** when a user creates/edits a list or requests an estimate. Run it in a background job (**BullMQ + Redis**), cache results, don't recompute if the list is unchanged. Generate embeddings on goal/interest creation → store in pgvector.
- **Ads:** integrate an existing network (AdMob on mobile, AdSense/Ad Manager on web); own "sponsored posts" table injected into the feed via the ranking logic.
- **Identity/KYC:** integrate a provider (Stripe Identity / Veriff / Onfido) — do **not** build document recognition. Store only the verification status + token; verify then delete the DNI image (data minimization, GDPR).
- **Realtime chat:** Socket.IO or managed equivalent. **Media:** R2/S3 for images, Mux/Cloudflare Stream for video. **Push:** Expo Push or FCM.

## CI/CD

Model the CI on the author's prior project (TrackBites): GitHub Actions, **fail-fast** ordering — static analysis/lint → unit + integration tests in parallel → Playwright E2E as the final gatekeeper, secrets via GitHub Secrets. Add TypeScript `typecheck`. The new goal for BUKIT (deliberately omitted before) is **Continuous Deployment**: auto-deploy after the pipeline passes. Testing stack precedent: Jest/Supertest (backend), Vitest/RTL (frontend), Playwright (E2E). Deploy targets under consideration: Docker backend on Render/Railway/Fly.io, web on Vercel/Cloudflare Pages, mobile via EAS Build/Submit/Update, managed Postgres (Neon/Supabase/Railway) with PostGIS + pgvector.

> Note: **Supabase** is documented as an _acceleration alternative_ (bundles Postgres+PostGIS+pgvector, auth, storage, realtime). The proposal's decision is to build the **custom Node + Prisma + PostgreSQL backend** as the project's core (it demonstrates the degree competencies), keeping Supabase as a possible v2 path.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
