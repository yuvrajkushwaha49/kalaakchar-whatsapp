import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { executeQuery, isUsingFallback, getMemoryStore, saveMemoryStore } from '../../database/db.js';
import logger from '../../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KNOWLEDGE_BASE_DIR = path.resolve(__dirname, '../../../knowledge-base');

/**
 * Knowledge Base Indexing & Retrieval Service
 */

let inMemoryChunksCache = [];
let isIndexingInProgress = false;

/**
 * Recursively scans and indexes all markdown files in knowledge-base directory
 */
export async function indexKnowledgeBase() {
  if (isIndexingInProgress) return { status: 'already_running' };
  isIndexingInProgress = true;

  try {
    logger.info(`📚 [KnowledgeBase] Starting document indexing from ${KNOWLEDGE_BASE_DIR}...`);

    if (!fs.existsSync(KNOWLEDGE_BASE_DIR)) {
      logger.warn(`⚠️ [KnowledgeBase] Directory not found: ${KNOWLEDGE_BASE_DIR}`);
      isIndexingInProgress = false;
      return { status: 'directory_not_found', count: 0 };
    }

    const allFiles = getAllMarkdownFiles(KNOWLEDGE_BASE_DIR);
    logger.info(`📚 [KnowledgeBase] Found ${allFiles.length} markdown documents to process.`);

    const documents = [];
    const chunks = [];
    let docIdCounter = 1;
    let chunkIdCounter = 1;

    for (const filePath of allFiles) {
      const relativePath = path.relative(KNOWLEDGE_BASE_DIR, filePath).replace(/\\/g, '/');
      const category = relativePath.split('/')[0] || 'general';
      const fileName = path.basename(filePath, '.md');
      const content = fs.readFileSync(filePath, 'utf-8');

      // Extract document title from first # header or filename
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : fileName.replace(/-/g, ' ');

      const docRecord = {
        id: docIdCounter++,
        document_name: title,
        document_path: relativePath,
        category,
        version: '1.0',
        status: 'indexed',
        indexed_at: new Date()
      };
      documents.push(docRecord);

      // Split document into meaningful chunks by sections (## headings)
      const docChunks = splitMarkdownIntoChunks(content, docRecord.id, relativePath, title, category);
      for (const c of docChunks) {
        c.id = chunkIdCounter++;
        chunks.push(c);
      }
    }

    // Persist into database or memory store
    if (isUsingFallback()) {
      const store = getMemoryStore();
      store.ai_knowledge_documents = documents;
      store.ai_knowledge_chunks = chunks;
      saveMemoryStore();
    } else {
      // Clear and re-populate MySQL tables
      await executeQuery('DELETE FROM ai_knowledge_chunks');
      await executeQuery('DELETE FROM ai_knowledge_documents');

      for (const doc of documents) {
        await executeQuery(
          `INSERT INTO ai_knowledge_documents (id, document_name, document_path, category, version, status, indexed_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [doc.id, doc.document_name, doc.document_path, doc.category, doc.version, doc.status]
        );
      }

      for (const chunk of chunks) {
        await executeQuery(
          `INSERT INTO ai_knowledge_chunks (id, document_id, chunk_content, chunk_index, search_metadata)
           VALUES (?, ?, ?, ?, ?)`,
          [chunk.id, chunk.document_id, chunk.chunk_content, chunk.chunk_index, JSON.stringify(chunk.search_metadata)]
        );
      }
    }

    inMemoryChunksCache = chunks;
    logger.info(`✅ [KnowledgeBase] Indexing complete! Indexed ${documents.length} docs and ${chunks.length} chunks.`);

    return {
      status: 'indexed',
      documentsCount: documents.length,
      chunksCount: chunks.length,
      indexedAt: new Date()
    };
  } catch (err) {
    logger.error(`❌ [KnowledgeBase] Indexing failed: ${err.message}`);
    throw err;
  } finally {
    isIndexingInProgress = false;
  }
}

/**
 * Search the knowledge base for relevant chunks
 */
export async function searchKnowledgeBase(query, limit = 4) {
  if (!query || typeof query !== 'string') return [];

  // Ensure chunks are loaded
  if (inMemoryChunksCache.length === 0) {
    await ensureChunksLoaded();
  }

  const terms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);

  if (terms.length === 0) return inMemoryChunksCache.slice(0, limit);

  // Score chunks using TF-IDF style term frequency + header bonus
  const scored = inMemoryChunksCache.map(chunk => {
    const contentLower = (chunk.chunk_content || '').toLowerCase();
    const titleLower = (chunk.search_metadata?.title || '').toLowerCase();
    const categoryLower = (chunk.search_metadata?.category || '').toLowerCase();

    let score = 0;

    for (const term of terms) {
      // Exact word matches
      const contentMatches = (contentLower.match(new RegExp(`\\b${term}\\b`, 'g')) || []).length;
      score += contentMatches * 2;

      // Partial substring matches
      if (contentLower.includes(term)) {
        score += 1;
      }

      // Title/heading match bonus
      if (titleLower.includes(term)) {
        score += 5;
      }

      // Category match bonus
      if (categoryLower.includes(term)) {
        score += 3;
      }
    }

    // Exact phrase match bonus
    const cleanPhrase = query.toLowerCase().trim();
    if (cleanPhrase.length > 5 && contentLower.includes(cleanPhrase)) {
      score += 15;
    }

    return {
      id: chunk.id,
      document_id: chunk.document_id,
      title: chunk.search_metadata?.title || 'Platform Documentation',
      category: chunk.search_metadata?.category || 'general',
      path: chunk.search_metadata?.path || '',
      content: chunk.chunk_content,
      score
    };
  });

  // Filter chunks with positive score, sort descending, and return top N
  return scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Returns current Knowledge Base status
 */
export async function getKnowledgeBaseStatus() {
  if (inMemoryChunksCache.length === 0) {
    await ensureChunksLoaded();
  }

  const store = isUsingFallback() ? getMemoryStore() : null;
  const docs = store?.ai_knowledge_documents || [];
  const chunks = inMemoryChunksCache;

  const categories = {};
  for (const c of chunks) {
    const cat = c.search_metadata?.category || 'general';
    categories[cat] = (categories[cat] || 0) + 1;
  }

  return {
    isReady: chunks.length > 0,
    documentsCount: docs.length > 0 ? docs.length : new Set(chunks.map(c => c.document_id)).size,
    chunksCount: chunks.length,
    categories,
    lastIndexedAt: docs[0]?.indexed_at || new Date()
  };
}

/**
 * Ensures chunks are loaded into memory cache
 */
async function ensureChunksLoaded() {
  if (isUsingFallback()) {
    const store = getMemoryStore();
    if (!store.ai_knowledge_chunks || store.ai_knowledge_chunks.length === 0) {
      await indexKnowledgeBase();
    } else {
      inMemoryChunksCache = store.ai_knowledge_chunks;
    }
  } else {
    try {
      const rows = await executeQuery('SELECT * FROM ai_knowledge_chunks LIMIT 1');
      if (rows.length === 0) {
        await indexKnowledgeBase();
      } else {
        const allRows = await executeQuery('SELECT * FROM ai_knowledge_chunks');
        inMemoryChunksCache = allRows.map(r => ({
          ...r,
          search_metadata: typeof r.search_metadata === 'string' ? JSON.parse(r.search_metadata) : r.search_metadata
        }));
      }
    } catch (e) {
      await indexKnowledgeBase();
    }
  }
}

/**
 * Helper: Find all markdown files recursively
 */
function getAllMarkdownFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllMarkdownFiles(fullPath));
    } else if (file.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Helper: Split markdown content into logical chunks by sections
 */
function splitMarkdownIntoChunks(content, documentId, docPath, docTitle, category) {
  const sections = content.split(/\n(?=##\s+)/g);
  const chunks = [];

  sections.forEach((section, idx) => {
    const trimmed = section.trim();
    if (trimmed.length > 30) {
      const sectionTitleMatch = trimmed.match(/^##\s+(.+)$/m);
      const sectionTitle = sectionTitleMatch ? sectionTitleMatch[1].trim() : docTitle;

      chunks.push({
        document_id: documentId,
        chunk_content: trimmed,
        chunk_index: idx,
        search_metadata: {
          title: `${docTitle} - ${sectionTitle}`,
          category,
          path: docPath
        }
      });
    }
  });

  return chunks.length > 0 ? chunks : [{
    document_id: documentId,
    chunk_content: content.trim(),
    chunk_index: 0,
    search_metadata: { title: docTitle, category, path: docPath }
  }];
}
