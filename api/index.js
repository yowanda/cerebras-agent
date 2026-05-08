export default function handler(req, res) {
  res.status(200).json({
    status: 'online',
    provider: 'Cerebras',
    model: 'llama3.1-8b',
    endpoints: {
      health: 'GET /',
      chat: 'POST /chat { "message": "..." }'
    }
  });
}
