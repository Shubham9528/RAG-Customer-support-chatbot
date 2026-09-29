import 'dotenv/config';
import { validateConfig } from './src/config/config.js';

// Validate environment variables before starting
validateConfig();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import chatRoutes from './src/routes/chatRoutes.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { startKeepAlive } from './src/services/keepAliveService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Routes ───────────────────────────────────────────────────
app.use('/api', chatRoutes);

// Root health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: '🤖 RAG Customer Support Chatbot is running!',
    endpoints: {
      chat:   'POST /api/chat    → { question: "..." }',
      health: 'GET  /api/health → status check',
    },
  });
});

// ─── 404 Handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found.` });
});

// ─── Global Error Handler ─────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅ Server running at http://localhost:${PORT}`);
  console.log(`📮 POST http://localhost:${PORT}/api/chat`);
  console.log(`💚 GET  http://localhost:${PORT}/api/health\n`);

  // Start keep-alive ping (keeps Render free tier active)
  startKeepAlive(PORT);
});
