export default function handler(req, res) {
  res.status(200).json({
    status: 'online',
    provider: 'Cerebras',
    model: 'qwen-3-235b-a22b-instruct-2507',
    endpoints: {
      health: 'GET /',
      chat: 'POST /chat { "message": "..." }'
    }
  });
}
