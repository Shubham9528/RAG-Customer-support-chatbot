import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';

import { validateConfig } from '../config/config.js';
import { loadAllDocuments } from '../utils/textChunker.js';
import { embedBatch } from '../services/embeddingService.js';
import { upsertVectors } from '../services/pineconeService.js';

// Resolve /documents directory path (ESM-compatible __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DOCUMENTS_DIR = path.resolve(__dirname, '../../documents');

/**
 * Main ingestion pipeline:
 *  1. Load & chunk all documents from /documents
 *  2. Embed each chunk using Google AI
 *  3. Upsert vectors + metadata into Pinecone
 */
async function ingest() {
  console.log('🚀 Starting ingestion pipeline...\n');

  // Step 0: Validate API keys
  validateConfig();

  // Step 1: Load and chunk all documents
  const chunks = await loadAllDocuments(DOCUMENTS_DIR);

  if (chunks.length === 0) {
    console.error('❌ No chunks found. Add documents to the /documents folder and try again.');
    process.exit(1);
  }

  // Step 2: Generate embeddings for all chunks
  console.log('🤖 Generating embeddings with Google AI...\n');
  const texts = chunks.map((c) => c.text);
  const embeddings = await embedBatch(texts);

  // Step 3: Build Pinecone vector objects
  const vectors = chunks.map((chunk, i) => ({
    id: uuidv4(),                   // unique ID for each vector
    values: embeddings[i],          // the embedding vector
    metadata: {
      text: chunk.text,             // original chunk text (returned on query)
      source: chunk.source,         // file name
      chunkIndex: chunk.chunkIndex, // position in document
    },
  }));

  // Step 4: Upsert into Pinecone
  console.log('\n📦 Upserting vectors into Pinecone...\n');
  await upsertVectors(vectors);

  console.log('\n🎉 Ingestion complete!');
  console.log(`   📊 Total vectors stored: ${vectors.length}`);
  console.log('   You can now run the chatbot with: npm run dev\n');
}

// Run the ingestion
ingest().catch((err) => {
  console.error('❌ Ingestion failed:', err.message);
  process.exit(1);
});
