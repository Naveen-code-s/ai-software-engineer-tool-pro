# AI Software Engineer Tool

Web workspace where an AI agent answers questions and builds websites/apps, spreadsheets (.xlsx), documents, presentations and code starters. Node backend (no npm dependencies) + static frontend.

## Run
Requires Node 20.6+.
```
cp .env.example .env      # then set ANTHROPIC_API_KEY
npm start
```
Open http://localhost:3000. Docker: `docker build -t aise . && docker run -p 3000:3000 -v aise-data:/data -e ANTHROPIC_API_KEY=... aise`

## Structure
- `server.js`: static hosting, `/api/health`, `/api/projects` (GET/PUT, stored in `data/projects.json`), `/api/chat` (agent). The API key stays on the server.
- `public/`: `index.html`, `app.css`, `app.js` (UI, previews, exports, real .xlsx writer).

## Security
- Generated pages render in a sandboxed iframe (no same-origin access, no network via CSP). Nothing generated is executed on the server.
- Server validates all input, limits body size, rate-limits `/api/chat` (20/min/IP) and sets security headers.
- Set `APP_PASSWORD` to require a shared login. Put the app behind HTTPS (reverse proxy) for any public deployment.

## Known limits
- One shared workspace: there are no per-user accounts. Use `APP_PASSWORD` or your own auth proxy.
- The agent cannot read your local files or repositories; paste code into the chat.
- Storage is a JSON file, suitable for a single instance.
