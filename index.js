import express from 'express';
import dotenv from 'dotenv';
import Cerebras from '@cerebras/cerebras_cloud_sdk';

dotenv.config();

const app = express();

app.use(express.json());

const cerebras = new Cerebras({
  apiKey: process.env.CEREBRAS_API_KEY
});

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    provider: 'Cerebras',
    model: 'qwen-3-235b-a22b-instruct-2507'
  });
});

app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'message required'
      });
    }

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

    return res.json({
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
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
