/**
 * Global Express error handling middleware.
 * Must have exactly 4 parameters (err, req, res, next) for Express to recognize it.
 *
 * @param {Error}    err
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function errorHandler(err, req, res, next) {
  console.error(`❌ [${new Date().toISOString()}] ${err.message}`);

  // Google AI API errors
  if (err.message?.includes('API key')) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or missing Google API key. Check your .env file.',
    });
  }

  // Pinecone errors
  if (err.message?.includes('Pinecone') || err.message?.includes('index')) {
    return res.status(503).json({
      success: false,
      error: 'Vector database unavailable. Check your Pinecone configuration.',
    });
  }

  // Generic server error
  return res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development'
      ? err.message
      : 'An unexpected error occurred. Please try again later.',
  });
}
