# AI Software Engineer Tool

A web workspace where an AI agent can answer questions and help create websites and apps, spreadsheets, documents, presentations, and code starters. The project uses a Node.js backend and a static frontend.

## Features

- Chat with an AI agent through a browser interface.
- Create and preview generated web content.
- Export spreadsheet and document-style outputs.
- Save workspace projects in a local JSON file.
- Run locally with Node.js or in Docker.

## Requirements

- Node.js 20.6 or newer
- An Anthropic API key
- Docker (optional)

## Run locally

1. Clone the repository and enter the application directory:

   ```bash
   git clone https://github.com/Naveen-code-s/ai-software-engineer-tool-pro.git
   cd ai-software-engineer-tool-pro/ai-software-engineer-tool-pro
   ```

2. Copy the example environment file and add your API key:

   ```bash
   cp .env.example .env
   ```

   Set `ANTHROPIC_API_KEY` in `.env`. Keep the key private and do not commit `.env`.

3. Start the server:

   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000).

The app has no npm dependencies to install.

## Run with Docker

From the application directory:

```bash
docker build -t ai-software-engineer-tool .
docker run --rm -p 3000:3000 -v ai-software-engineer-data:/data -e ANTHROPIC_API_KEY=your_api_key ai-software-engineer-tool
```

For a persistent deployment, configure `APP_PASSWORD` and serve the app behind HTTPS. Do not expose the service publicly without suitable authentication and transport security.

## Project structure

```text
ai-software-engineer-tool-pro/
├── server.js          # Static hosting and API endpoints
├── public/            # Frontend interface, previews, and exports
├── .env.example       # Example environment configuration
└── Dockerfile
```

## Security notes

- The API key stays on the server and should be supplied through environment configuration.
- Generated pages are rendered in a sandboxed iframe with a restrictive content security policy.
- The server validates input, limits request size, applies a chat rate limit, and sets security headers.
- The app uses one shared workspace and does not provide per-user accounts. Use `APP_PASSWORD` or an authentication proxy for access control.
- The agent cannot access local files or repositories; provide any needed code directly in the app.

## Known limitations

Workspace data is stored in a JSON file and is intended for a single running instance. Use a database and an authentication system if you need multi-user or horizontally scaled deployments.

## License

No license file is currently documented. Add a `LICENSE` file if you want others to know how they may use, modify, or distribute this project.
