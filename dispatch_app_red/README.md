# 兆櫃 AI 派單系統

`dispatch_app_red` is the single canonical application directory for this repo.

## Local start

```bash
cd dispatch_app_red
copy .env.example .env
npm install
npm start
```

Open `http://localhost:3000`.

The server now opens the browser automatically after startup. If you want to disable that behavior, set `AUTO_OPEN_BROWSER=0` before running `npm start`.

## Validation

```bash
npm run check
```

The regression check covers the dispatch API plus routing behavior for unknown API paths and SPA fallbacks.

## Gemini integration

- `GEMINI_API_KEY` is read on the backend only.
- Ranking, grouping, and consistency checks stay deterministic in `shared/dispatch-engine.js`.
- Gemini runs after a snapshot passes audit and confirmation, then overlays:
  - `aiInsights`
  - `announcement`
- If Gemini is unavailable, the app keeps the rule-based content and reports `aiProvider.status = fallback`.
- The default REST API version is `v1beta`, which supports the structured generation fields used by this backend.

## Deploy

This app is an Express server, so GitHub Pages is not an appropriate deployment target.

Use Render instead:

1. Create a new Render Web Service from this repo.
2. Keep the repo root and let Render read `render.yaml`.
3. Set `GEMINI_API_KEY` in Render environment variables.
4. Deploy and verify `GET /api/health`.
