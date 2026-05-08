# Cerebras Agent

Cerebras Cloud SDK (`llama3.1-8b`) — dua mode: serverless (Vercel) + classic Express server.

## Endpoint

- `GET /` — health/info
- `POST /chat` — body: `{ "message": "..." }` → `{ "success": true, "response": "..." }`

## Vercel (serverless, gratis 24/7)

Function-nya ada di `api/`:
- `api/index.js` — handler `GET /`
- `api/chat.js` — handler `POST /chat`
- `vercel.json` — routing biar `/` dan `/chat` ke-rewrite ke `/api/*`

Deploy: import repo ke https://vercel.com/new, set env `CEREBRAS_API_KEY`, deploy.

## Run Local (Express)

```bash
npm install
cp .env.example .env
# isi CEREBRAS_API_KEY di .env
npm start
```

Test:

```bash
curl http://localhost:3000/
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Halo"}'
```

## Deploy ke VPS (PM2 24/7)

```bash
sudo apt update && sudo apt install -y nodejs npm
git clone YOUR_REPOSITORY && cd cerebras-agent
npm install
cp .env.example .env && nano .env
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save && pm2 startup
```
