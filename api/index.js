export default function handler(req, res) {
  res.status(200).json({
    status: 'online',
    provider: 'Cerebras',
    model: 'gpt-oss-120b',
    endpoints: {
      health: 'GET /',
      chat: 'POST /chat { "message": "..." }'
    }
  });
}
