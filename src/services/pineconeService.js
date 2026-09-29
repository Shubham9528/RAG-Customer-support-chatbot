import { Pinecone } from '@pinecone-database/pinecone';
import config from '../config/config.js';

// Singleton Pinecone client
let pineconeClient = null;
let pineconeIndex = null;

/**
 * Initializes and returns the Pinecone index (singleton).
 * Reuses the connection on subsequent calls.
 *
 * @returns {Promise<import('@pinecone-database/pinecone').Index>}
 */
export async function getPineconeIndex() {
  if (pineconeIndex) return pineconeIndex;

  pineconeClient = new Pinecone({ apiKey: config.pinecone.apiKey });
  pineconeIndex = pineconeClient.index(config.pinecone.indexName);

  console.log(`✅ Connected to Pinecone index: "${config.pinecone.indexName}"`);
  return pineconeIndex;
}

/**
 * Upserts (insert or update) a batch of vectors into Pinecone.
 *
 * @param {Array<{ id: string, values: number[], metadata: object }>} vectors
 */
export async function upsertVectors(vectors) {
  const index = await getPineconeIndex();

  // Pinecone recommends upserting in batches of up to 100
  const batchSize = 100;

  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    await index.upsert(batch);
    console.log(`   📤 Upserted ${Math.min(i + batchSize, vectors.length)} / ${vectors.length} vectors`);
  }
}

/**
 * Queries Pinecone for the top-K most similar vectors to the given query vector.
 *
 * @param {number[]} queryVector  - The embedding of the user's question
 * @param {number}   topK         - Number of results to return
 * @returns {Promise<Array<{ score: number, metadata: object }>>}
 */
export async function querySimilarChunks(queryVector, topK = config.rag.topK) {
  const index = await getPineconeIndex();

  const result = await index.query({
    vector: queryVector,
    topK,
    includeMetadata: true,
  });

  return result.matches.map((match) => ({
    score: match.score,
    text: match.metadata.text,
    source: match.metadata.source,
    chunkIndex: match.metadata.chunkIndex,
  }));
}
