# Cerebras Agent

Express server yang ngebungkus Cerebras Cloud SDK (`llama3.1-8b`).

## Endpoint

- `GET /` — health/info
- `POST /chat` — body: `{ "message": "..." }` → `{ "success": true, "response": "..." }`

## Run Local

```bash
npm install
cp .env.example .env
# isi CEREBRAS_API_KEY di .env
npm start
```

## Deploy ke Render (free)

1. Push folder ini ke GitHub repo kamu (public).
2. Buka https://render.com → Sign up pakai GitHub.
3. Dashboard → **New** → **Blueprint** → pilih repo kamu (Render bakal baca `render.yaml`).
4. Render akan minta isi env var `CEREBRAS_API_KEY` (gak ke-commit, sync=false). Paste API key kamu.
5. Klik **Apply**. Tunggu build + deploy ~2 menit.
6. Render kasih URL `https://cerebras-agent-xxxx.onrender.com`.

Test:

```bash
curl https://YOUR_URL.onrender.com/
curl -X POST https://YOUR_URL.onrender.com/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Halo"}'
```

Free tier sleeps after ~15 min idle — request pertama setelah idle akan cold-start (~30 detik).

## Deploy ke VPS (alternatif, PM2 24/7)

```bash
sudo apt update && sudo apt install -y nodejs npm
git clone YOUR_REPOSITORY && cd cerebras-agent
npm install
cp .env.example .env && nano .env
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save && pm2 startup
```
