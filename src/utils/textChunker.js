import fs from "fs";
import path from "path";
import { createRequire } from "module";
import config from "../config/config.js";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

/**
 * Splits a long text string into overlapping chunks.
 *
 * @param {string} text       - The raw text to chunk
 * @param {number} chunkSize  - Max characters per chunk
 * @param {number} overlap    - Characters to overlap between consecutive chunks
 * @returns {string[]}        - Array of text chunks
 */
export function splitIntoChunks(
  text,
  chunkSize = config.rag.chunkSize,
  overlap = config.rag.chunkOverlap,
) {
  const chunks = [];
  let start = 0;

  // Normalize whitespace
  const cleanText = text.replace(/\s+/g, " ").trim();

  while (start < cleanText.length) {
    const end = start + chunkSize;
    const chunk = cleanText.slice(start, end).trim();

    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    // Move forward by (chunkSize - overlap) so chunks share some context
    start += chunkSize - overlap;
  }

  return chunks;
}

/**
 * Reads a .txt file and returns its text content.
 *
 * @param {string} filePath - Absolute path to the .txt file
 * @returns {Promise<string>}
 */
async function readTxtFile(filePath) {
  return fs.promises.readFile(filePath, "utf-8");
}

/**
 * Reads a .pdf file and returns its text content.
 *
 * @param {string} filePath - Absolute path to the .pdf file
 * @returns {Promise<string>}
 */
async function readPdfFile(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const pdfData = await pdfParse(dataBuffer);
  return pdfData.text;
}

/**
 * Loads a single document file (.txt or .pdf) and returns chunked results.
 *
 * @param {string} filePath - Absolute path to the document
 * @returns {Promise<Array<{ text: string, source: string, chunkIndex: number }>>}
 */
export async function loadAndChunkDocument(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath);
  let rawText = "";

  console.log(`📄 Loading: ${fileName}`);

  if (ext === ".txt") {
    rawText = await readTxtFile(filePath);
  } else if (ext === ".pdf") {
    rawText = await readPdfFile(filePath);
  } else {
    console.warn(`⚠️  Skipping unsupported file type: ${fileName}`);
    return [];
  }

  const chunks = splitIntoChunks(rawText);

  console.log(`   ✂️  Split into ${chunks.length} chunks`);

  // Attach metadata to each chunk
  return chunks.map((text, index) => ({
    text,
    source: fileName,
    chunkIndex: index,
  }));
}

/**
 * Loads ALL supported documents from a given directory and returns all chunks.
 *
 * @param {string} docsDir - Absolute path to the documents folder
 * @returns {Promise<Array<{ text: string, source: string, chunkIndex: number }>>}
 */
export async function loadAllDocuments(docsDir) {
  const supportedExtensions = [".txt", ".pdf"];

  const files = fs.readdirSync(docsDir).filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return supportedExtensions.includes(ext);
  });

  if (files.length === 0) {
    console.warn("⚠️  No supported documents found in /documents folder.");
    return [];
  }

  console.log(`\n📁 Found ${files.length} document(s) in ${docsDir}\n`);

  const allChunks = [];

  for (const file of files) {
    const filePath = path.join(docsDir, file);
    const chunks = await loadAndChunkDocument(filePath);
    allChunks.push(...chunks);
  }

  console.log(`\n✅ Total chunks ready for embedding: ${allChunks.length}\n`);
  return allChunks;
}
