import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/config.js';

// Initialize Google AI client (text-embedding-004 requires v1, not v1beta)
const genAI = new GoogleGenerativeAI(config.google.apiKey, { apiVersion: 'v1' });
const embeddingModel = genAI.getGenerativeModel({ model: config.rag.embeddingModel });

/**
 * Generates an embedding vector for a single text string.
 * outputDimensionality is set to match the Pinecone index dimension (1024).
 * gemini-embedding-001 supports: 3072 (default), 1536, 1024, 768, 256.
 *
 * @param {string} text - The text to embed
 * @returns {Promise<number[]>} - A vector array
 */
export async function embedText(text) {
  const result = await embeddingModel.embedContent({
    content: { parts: [{ text }], role: 'user' },
    outputDimensionality: 1024,
  });
  return result.embedding.values;
}

/**
 * Generates embeddings for an array of text chunks in batches.
 * Batching avoids hitting API rate limits.
 *
 * @param {string[]} texts     - Array of text strings to embed
 * @param {number}   batchSize - How many texts to embed per API call
 * @returns {Promise<number[][]>} - Array of embedding vectors
 */
export async function embedBatch(texts, batchSize = 10) {
  const allEmbeddings = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    console.log(`   🔢 Embedding batch ${Math.floor(i / batchSize) + 1} / ${Math.ceil(texts.length / batchSize)}`);

    // Embed each text in the batch (Google AI doesn't support bulk embed in one call)
    const batchEmbeddings = await Promise.all(batch.map((text) => embedText(text)));
    allEmbeddings.push(...batchEmbeddings);

    // Small delay between batches to respect rate limits
    if (i + batchSize < texts.length) {
      await new Promise((res) => setTimeout(res, 500));
    }
  }

  return allEmbeddings;
}
