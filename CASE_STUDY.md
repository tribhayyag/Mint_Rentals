# Mint Rentals — Case Study

## Project overview

Mint Rentals is a student-focused housing assistant prototype built during the NVIDIA OpenClaw/Nemotron hackathon and refined post-hackathon to improve explainability, UX, and recommendation transparency.

## Problem statement

Finding student-appropriate housing near UC Santa Cruz is time-consuming: students need to balance affordability, commute time, safety, and amenities while often relying on incomplete listing data.

## Target users

- UCSC undergraduates and graduate students seeking short-term or long-term housing
- Student housing advisors and peer organizers

## Architecture overview

- Frontend: React + TypeScript + Vite — client-first UI and mocked agent flow
- Backend: FastAPI (tools/orchestrator lives in `backend/`)
- Local tooling: Python scripts in `tools/` provide scrapers and safety heuristics

## AI workflow

1. User fills an onboarding wizard to structure preferences
2. Client-side generator produces a candidate listing set (mock or tool-driven)
3. Rankings and match notes are computed locally for explainability
4. The agent reasoning panel surfaces stepwise decisions and fallback usage

## Design decisions

- Keep the UI minimal and accessible for student users
- Keep computations transparent and local when backend APIs are unavailable
- Provide clear fallback labels and data provenance throughout the UI

## Recommendation transparency

The app emphasizes transparency in three ways:
- Per-listing `Why this matches` chips derived from match signals
- An `Agent reasoning` panel that shows stages and whether fallbacks were used
- A `Compare` mode that displays succinct tradeoff summaries for up to three listings

### Tradeoff Analysis (how it works)

For each compared listing the UI shows a concise tradeoff sentence such as:

- "Lower rent but Longer commute by bus"
- "Shorter commute by bike · Furnished"

Tradeoffs are computed only from available data fields (rent, commuteMinutes, commuteMode, safetyRating, roomType, tags). If a field is missing, the UI shows `Data unavailable` or omits that clause — the system never invents values.

## Limitations

- The current demo uses generated/mock listing data; real-world scraper and API integration is incomplete
- Safety scores are mock fallbacks unless a verified safety API is configured
- The app does not perform credit checks, messaging, or booking flows

## Future improvements

- Integrate live listing APIs and verified safety data sources
- Add messaging templates and landlord contact tools
- Expand multi-criteria optimization and visual explainers (charts)

## Screenshots

See the deployed frontend demo: https://frontend-zeta-weld-v7f6db8jp1.vercel.app/

## Contributions & post-hackathon work

This repo began as a hackathon project; post-hackathon work focused on frontend UX, explainability, and recommendation transparency (Agent Reasoning, Why-this-chips, Tradeoff summaries, Compare mode, and saved listings persisted to `localStorage`).
