require('dotenv').config();
const { validateConfig } = require('./src/config/config');

// Validate environment variables before starting
validateConfig();

const express = require('express');
const cors = require('cors');

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
// const chatRoutes = require('./src/routes/chatRoutes');
// app.use('/api', chatRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
