# Mint Rentals

Mint Rentals is a UCSC student housing assistant built for the NVIDIA OpenClaw/Nemotron hackathon.

The app helps students describe what kind of housing they want, then turns that request into structured preferences, searches for matching listings, and displays housing options in a clean frontend UI.

## What it does

- Parses natural language housing preferences
- Searches housing listings through backend tools
- Displays matched listings in a frontend dashboard
- Clearly labels fallback/demo data when live listing data is unavailable
- Runs with OpenClaw + Nemotron on an ASUS GX10 / DGX Spark setup

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: FastAPI
- Tools: Python
- Agent/runtime: OpenClaw
- Model: Nemotron via Ollama on DGX Spark
## Live demo

The frontend is deployed on Vercel (live demo):

https://frontend-zeta-weld-v7f6db8jp1.vercel.app/

## Backend

Run the backend locally for full tool integration:

```bash
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

