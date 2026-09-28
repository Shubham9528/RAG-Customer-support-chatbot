import 'dotenv/config';
import { validateConfig } from './src/config/config.js';

// Validate environment variables before starting
validateConfig();

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'RAG Customer Support Chatbot is running!',
  });
});

// TODO: Mount chat routes (Step 5)
// import chatRoutes from './src/routes/chatRoutes.js';
// app.use('/api', chatRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
