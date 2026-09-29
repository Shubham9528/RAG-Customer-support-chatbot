import "dotenv/config";

const config = {
  google: {
    apiKey: process.env.GOOGLE_API_KEY,
  },
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY,
    indexName: process.env.PINECONE_INDEX_NAME || "customer-support-index",
  },
  server: {
    port: process.env.PORT || 3000,
  },
  rag: {
    chunkSize: 500, // characters per chunk
    chunkOverlap: 50, // overlap between chunks
    topK: 5, // number of results to retrieve from Pinecone
    embeddingModel: "gemini-embedding-001",
    chatModel: "gemini-3.5-flash-lite",
  },
};

// Validate required keys on startup
export const validateConfig = () => {
  const missing = [];
  if (!config.google.apiKey) missing.push("GOOGLE_API_KEY");
  if (!config.pinecone.apiKey) missing.push("PINECONE_API_KEY");

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
};

export default config;
