const express = require('express');
const path = require('path');

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname)));

app.post('/api/telegram', async (req, res) => {
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';

  if (!text) {
    return res.status(400).json({ ok: false, error: 'Missing message text.' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return res.status(500).json({
      ok: false,
      error: 'Telegram bot is not configured on this server. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.'
    });
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_notification: false
      })
    });

    const result = await response.json();

    if (!response.ok || !result?.ok) {
      return res.status(response.status || 400).json(result || { ok: false, error: 'Telegram send failed.' });
    }

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || 'Telegram request failed.' });
  }
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, status: 'healthy' });
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }

  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`TNM Mpamba app running on http://localhost:${port}`);
});
