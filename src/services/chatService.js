import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config/config.js';
import { embedText } from './embeddingService.js';
import { querySimilarChunks } from './pineconeService.js';

// Initialize Gemini chat model (requires v1, not v1beta)
const genAI = new GoogleGenerativeAI(config.google.apiKey, { apiVersion: 'v1' });
const chatModel = genAI.getGenerativeModel({ model: config.rag.chatModel });

/**
 * Builds the prompt sent to Gemini.
 * Injects retrieved context chunks + the user's question.
 *
 * @param {string} question       - The user's question
 * @param {string[]} contextChunks - Relevant text chunks from Pinecone
 * @returns {string}              - Final prompt string
 */
function buildPrompt(question, contextChunks) {
  const context = contextChunks.join('\n\n---\n\n');

  return `You are a helpful and friendly customer support assistant.
Use ONLY the information provided in the context below to answer the user's question.
If the answer is not found in the context, politely say you don't have that information and suggest contacting support.

CONTEXT:
${context}

USER QUESTION:
${question}

ANSWER:`;
}

/**
 * Core RAG pipeline — handles one complete user question.
 *
 * Steps:
 *  1. Embed the user's question
 *  2. Query Pinecone for top-K similar chunks
 *  3. Build a prompt with retrieved context
 *  4. Send to Gemini and return the generated answer
 *
 * @param {string} question - The user's question
 * @param {number} topK     - Number of context chunks to retrieve
 * @returns {Promise<{ answer: string, sources: string[], context: string[] }>}
 */
export async function chat(question, topK = config.rag.topK) {
  // Step 1: Embed the question
  const questionVector = await embedText(question);

  // Step 2: Retrieve top-K similar chunks from Pinecone
  const matches = await querySimilarChunks(questionVector, topK);

  if (matches.length === 0) {
    return {
      answer: "I'm sorry, I couldn't find any relevant information to answer your question. Please contact our support team directly.",
      sources: [],
      context: [],
    };
  }

  // Step 3: Extract text chunks and source filenames
  const contextChunks = matches.map((m) => m.text);
  const sources = [...new Set(matches.map((m) => m.source))]; // unique sources

  // Step 4: Build prompt and call Gemini
  const prompt = buildPrompt(question, contextChunks);
  const result = await chatModel.generateContent(prompt);
  const answer = result.response.text();

  return {
    answer,
    sources,  // which documents were used
    context: contextChunks, // the actual chunks used (useful for debugging)
  };
}
