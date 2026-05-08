# Roadmap

API ini sengaja dirancang biar bisa dipake jadi backend agent (reasoning + task tracing). Roadmap ini ngegambarin tujuan yang udah dicapai dan apa yang mau ditambahin biar makin enak buat use case agent.

## v1.0 — Baseline (sudah live)

**Status:** done
**URL:** https://cerebras-agent.vercel.app

- `GET /` → health/info: `{status, provider, model}`
- `POST /chat` body `{ "message": string }` → `{ success, response }`
- Backend: Vercel serverless functions (`api/index.js`, `api/chat.js`)
- Provider: Cerebras Cloud SDK
- Model: `qwen-3-235b-a22b-instruct-2507`
- Env: `CEREBRAS_API_KEY` di-set encrypted di Vercel project settings

Cocok buat: tes cepat, single-shot Q&A.
Belum cocok buat: agent multi-turn yang butuh konteks/history, integrasi langsung ke LangChain/OpenAI SDK.

---

## v1.1 — System prompt + conversation history

**Status:** planned
**Tujuan:** agent bisa kirim konteks task & langkah sebelumnya biar reasoning trace nyambung.

### Request schema baru (backward-compatible)

```jsonc
POST /chat
{
  "message": "...",                  // shortcut untuk single-turn (tetap didukung)
  "system": "You are a helpful ...", // optional system prompt
  "history": [                       // optional, urut dari paling lama
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "temperature": 0.2,                // optional override
  "max_completion_tokens": 1024      // optional override
}
```

Server gabungin jadi `[system?, ...history, { role: "user", content: message }]` sebelum dipanggil ke Cerebras.

### Response schema (diperkaya, backward-compatible)

```jsonc
{
  "success": true,
  "response": "...",
  "model": "qwen-3-235b-a22b-instruct-2507",
  "usage": {                  // dari Cerebras response
    "prompt_tokens": 0,
    "completion_tokens": 0,
    "total_tokens": 0
  },
  "id": "chatcmpl-...",       // pass-through
  "created": 0
}
```

### Acceptance criteria

- [ ] Permintaan lama `{ "message": "..." }` masih balikin response yang valid (tidak break).
- [ ] `system` di-passing sebagai `role: "system"` di awal messages.
- [ ] `history` di-validate (struktur array of `{role, content}`), kalau invalid → 400.
- [ ] `usage` ikut dibalikin biar agent bisa nge-track token cost per task.
- [ ] Test manual: 3 turn percakapan beruntun, model masih inget konteks turn pertama.

---

## v1.2 — Endpoint OpenAI-compatible (`/v1/chat/completions`)

**Status:** planned
**Tujuan:** plug-and-play sama LangChain, AutoGen, CrewAI, OpenAI SDK, Continue.dev, Cline, dst — tanpa adapter.

### Request schema (mirror OpenAI spec)

```jsonc
POST /v1/chat/completions
Authorization: Bearer <API_KEY>     // optional, lihat catatan di bawah
Content-Type: application/json

{
  "model": "qwen-3-235b-a22b-instruct-2507",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "temperature": 0.2,
  "max_tokens": 1024,
  "stream": false                   // streaming nyusul di v1.3
}
```

### Response schema

Sama persis dengan format OpenAI Chat Completions:

```jsonc
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "created": 1730000000,
  "model": "qwen-3-235b-a22b-instruct-2507",
  "choices": [
    {
      "index": 0,
      "message": { "role": "assistant", "content": "..." },
      "finish_reason": "stop"
    }
  ],
  "usage": { "prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0 }
}
```

### Catatan implementasi

- File baru: `api/v1/chat/completions.js`.
- Vercel rewrite di `vercel.json`: `/v1/chat/completions` → `/api/v1/chat/completions`.
- Untuk `model` yang minta, validate ada di whitelist (`llama3.1-8b`, `qwen-3-235b-a22b-instruct-2507`). Kalau di luar itu balikin 400 "model not supported".
- **Auth (penting biar API kamu gak dipake bebas):**
  - Generate token random, simpen di env `PROXY_API_KEY` di Vercel.
  - Endpoint `/v1/chat/completions` reject kalo `Authorization: Bearer ...` gak match.
  - Endpoint legacy `/chat` tetap public (atau ikut di-protect, sesuai keinginan).

### Acceptance criteria

- [ ] `curl` ke `/v1/chat/completions` dengan body persis OpenAI spec balikin response yang lulus parsing OpenAI SDK.
- [ ] LangChain `ChatOpenAI(base_url="https://cerebras-agent.vercel.app/v1", api_key="<PROXY_API_KEY>", model="qwen-3-235b-a22b-instruct-2507")` jalan.
- [ ] Auth gagal kalo header gak ada / salah → 401.
- [ ] Whitelist model jalan (model selain yang didukung → 400).

---

## v1.3 — Streaming (SSE)

**Status:** planned (lower priority)
**Tujuan:** live trace token-per-token buat agent yang mau show progress.

- Tambah dukungan `stream: true` di `/v1/chat/completions`.
- Pake `text/event-stream` response, format chunk ikut OpenAI SSE spec (`data: {...}\n\n`, terakhir `data: [DONE]`).
- Vercel serverless function bisa stream pakai `Readable` / `ReadableStream` — perlu hati-hati dengan timeout serverless (default 10s di Hobby, 60s max).

Acceptance: LangChain streaming callback jalan, token muncul incremental.

---

## v1.4 — Observability untuk task tracing

**Status:** planned (lower priority)
**Tujuan:** lebih gampang debug agent runs.

- Tambah `request_id` (uuid) di setiap response.
- Log `(request_id, prompt_token_count, completion_token_count, latency_ms)` ke `console` (Vercel auto-collect).
- Optional: kirim event ke endpoint webhook (set via env `TRACE_WEBHOOK_URL`) — biar lo bisa log ke Datadog / Sentry / Langfuse.

---

## v1.5+ — Ide future (belum prioritas)

- **Tool / function calling** kalau Cerebras nambahin support (saat ini Qwen-3-Instruct di Cerebras blm ada tool call native).
- **Rate limiting per token** (Vercel Edge Middleware + Upstash Redis) biar gak kena abuse kalo URL bocor.
- **Multi-model routing**: query parameter `?model=` buat switch antara llama3.1-8b vs qwen-3-235b tanpa redeploy.
- **Reasoning-mode toggle**: kalau Cerebras kasih akses ke `qwen-3-235b-a22b-thinking-2507` atau `gpt-oss-120b` di tier kamu, expose `reasoning_effort` param.

---

## Cara berkontribusi (untuk Devin di sesi berikutnya)

1. Pick versi yang mau dikerjain.
2. Branch baru dari `main`: `git checkout -b devin/<timestamp>-v1.X-<slug>`.
3. Implementasi sesuai schema di section yang relevan.
4. Update tests/manual smoke test (curl examples di README).
5. Push, buka PR ke `main`, tunggu CI ijo, request review.
6. Setelah merge, redeploy: `vercel deploy --prod --token "$VERCEL_TOKEN" --yes`.

Token & secret yang udah disimpan permanen di Devin (scope user `yowanda`):
- `PAT_GITHUB`
- `VERCEL_TOKEN`
- `CEREBRAS_API`
- `RENDER_API_KEY` (legacy, tidak dipakai lagi — Render butuh CC)
