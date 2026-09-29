import express from 'express';
import { chat } from '../services/chatService.js';

const router = express.Router();

/**
 * POST /api/chat
 *
 * Request body:
 *   { "question": "What is your return policy?" }
 *
 * Response:
 *   { "answer": "...", "sources": ["faq.txt"] }
 */
router.post('/chat', async (req, res, next) => {
  try {
    const { question } = req.body;

    // Validate input
    if (!question || typeof question !== 'string' || question.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid "question" in the request body.',
      });
    }

    const { answer, sources, context } = await chat(question.trim());

    return res.status(200).json({
      success: true,
      question: question.trim(),
      answer,
      sources,
      // Only include raw context in development for debugging
      ...(process.env.NODE_ENV === 'development' && { context }),
    });

  } catch (error) {
    next(error); // forward to global error handler
  }
});

/**
 * GET /api/health
 * Quick health check for the API
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    message: 'RAG Customer Support API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
