# Marmat.ai — Node.js

The Marmat.ai marketing site served by a dependency-free Node.js server. It also accepts demo requests and stores them as leads.

## Requirements

- Node.js 18 or newer

## Quick start

```bash
cd marmat-ai-node
npm start
```

Then open http://localhost:3000

Use a different port with:

```bash
PORT=8080 npm start
```

For auto-reload while developing (Node 18.11+):

```bash
npm run dev
```

## Project structure

```
marmat-ai-node/
├── server.js        # HTTP server, static file serving, API routes
├── package.json
├── public/          # Front-end files served to the browser
│   ├── index.html
│   ├── styles.css
│   └── script.js
└── data/            # Created automatically; stores leads.json
```

## API

| Method | Path            | Description                          |
|--------|-----------------|--------------------------------------|
| GET    | `/api/health`   | Health check                         |
| POST   | `/api/contact`  | Submit a demo request (JSON body)    |

Example request:

```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","company":"Doe Builders"}'
```

Successful submissions return `201` and are appended to `data/leads.json`.

## Configuration

| Variable | Default   | Purpose             |
|----------|-----------|---------------------|
| `PORT`   | `3000`    | Port to listen on   |
| `HOST`   | `0.0.0.0` | Interface to bind   |

## Production notes

- Run behind a reverse proxy (Nginx, Caddy or an AWS load balancer) that handles HTTPS for `marmat.ai`.
- Keep the `data/` folder on persistent storage or replace `leads.json` with a real database (PostgreSQL, DynamoDB, etc.) before scaling.
- Use a process manager such as PM2 or systemd to keep the server running:

  ```bash
  npm install -g pm2
  pm2 start server.js --name marmat-ai
  ```

- Send new leads to your CRM or email by adding a call inside `handleContact()` in `server.js`.
