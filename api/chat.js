import Cerebras from '@cerebras/cerebras_cloud_sdk';

const cerebras = new Cerebras({
  apiKey: process.env.CEREBRAS_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method not allowed' });
  }

  const { message } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: 'message required' });
  }

  try {
    const completion = await cerebras.chat.completions.create({
      model: 'qwen-3-235b-a22b-instruct-2507',
      messages: [
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.2,
      max_completion_tokens: 1024
    });

    return res.status(200).json({
      success: true,
      response: completion.choices[0].message.content
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
