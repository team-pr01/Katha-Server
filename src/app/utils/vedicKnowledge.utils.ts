/* eslint-disable no-case-declarations */
/* eslint-disable @typescript-eslint/no-explicit-any */

import crypto from "crypto";
import { ObjectId } from "mongoose";
import mammoth from 'mammoth';
import { IVedicChunk } from "../modules/rag/vedicKnowledge/vedicKnowledge.interface";
import pdfParse from "pdf-parse";

/**
 * Splits a large text into meaningful chunks
 * Keeps paragraphs together and respects sentence boundaries
 */
export const chunkText = (
  text: string,
  documentId: ObjectId,
  title: string,
  category: string,
  maxChunkSize: number = 1000,
  overlap: number = 200
): IVedicChunk[] => {
  // Remove extra whitespace and normalize
  const cleanedText = text.replace(/\s+/g, " ").trim();
  
  // Split by paragraphs first
  const paragraphs = cleanedText.split(/\n\s*\n/);
  
  const chunks: IVedicChunk[] = [];
  let currentChunk = "";
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) continue;

    // If adding this paragraph exceeds max size, save current chunk and start new
    if (currentChunk.length + trimmedParagraph.length > maxChunkSize && currentChunk.length > 0) {
      // Save current chunk
      chunks.push({
        content: currentChunk.trim(),
        metadata: {
          documentId,
          title,
          category,
          chunkIndex,
          totalChunks: 0, // Will update later
        },
      });
      chunkIndex++;
      
      // Start new chunk with overlap
      const overlapText = currentChunk.slice(-overlap);
      currentChunk = overlapText + " " + trimmedParagraph;
    } else {
      currentChunk += (currentChunk ? " " : "") + trimmedParagraph;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      metadata: {
        documentId,
        title,
        category,
        chunkIndex,
        totalChunks: 0,
      },
    });
  }

  // Update totalChunks for all chunks
  const totalChunks = chunks.length;
  chunks.forEach((chunk, index) => {
    chunk.metadata.totalChunks = totalChunks;
    chunk.metadata.chunkIndex = index;
  });

  return chunks;
};

/**
 * Generates content hash for duplicate detection
 */
export const generateContentHash = (content: string): string => {
  return crypto
    .createHash("sha256")
    .update(content)
    .digest("hex");
};

/**
 * Extracts text from various file types
 */
export const extractTextFromFile = async (
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> => {
  try {
    switch (mimeType) {
      case "application/pdf": {
        console.log('📖 Extracting text from PDF...');
        // ✅ Use pdfParse directly (not .default)
        const pdfData = await pdfParse(fileBuffer);
        console.log(`✅ Extracted ${pdfData.text.length} characters from PDF`);
        return pdfData.text;
      }
        
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
        console.log('📖 Extracting text from DOCX...');
        const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
        console.log(`✅ Extracted ${docxResult.value.length} characters from DOCX`);
        return docxResult.value;
      }
        
      case "text/plain": {
        console.log('📖 Extracting text from TXT file...');
        const text = fileBuffer.toString("utf-8");
        console.log(`✅ Extracted ${text.length} characters from TXT`);
        return text;
      }
        
      default:
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    console.error('❌ Error extracting text from file:', error);
    throw new Error(`Failed to extract text from file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Clean text for better embeddings
 */
export const cleanTextForEmbedding = (text: string): string => {
  return text
    .replace(/[^\w\s.,!?-]/g, " ") // Remove special characters
    .replace(/\s+/g, " ") // Multiple spaces to single
    .trim()
    .slice(0, 8000); // OpenAI limit
};

/**
 * Check if content is duplicate
 */
export const isDuplicateContent = async (
  contentHash: string,
  model: any
): Promise<boolean> => {
  const existing = await model.findOne({ contentHash });
  return !!existing;
};