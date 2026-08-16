/* eslint-disable no-misleading-character-class */
import RAGConfig from "../config/rag.config";

/**
 * ✅ Truncate context to stay within token limits
 * Uses character count as a rough estimate (1 token ≈ 4 chars for English)
 */
export const truncateContext = (
  context: string,
  maxTokens: number = RAGConfig.openai.maxContextTokens,
  safetyMargin: number = RAGConfig.openai.safetyMargin
): string => {
  if (!context) return context;

  // Calculate safe limit with margin
  const safeMaxTokens = Math.floor(maxTokens * safetyMargin);
  const estimatedMaxChars = safeMaxTokens * 4; // Rough estimate

  if (context.length <= estimatedMaxChars) {
    return context;
  }

  console.warn(
    `⚠️ Context is too large (${context.length} chars). ` +
    `Truncating to approximately ${estimatedMaxChars} chars.`
  );

  // Try to truncate at a sentence boundary
  const truncated = context.slice(0, estimatedMaxChars);
  
  // Find the last sentence boundary
  const boundaries = [
    truncated.lastIndexOf('. '),
    truncated.lastIndexOf('.\n'),
    truncated.lastIndexOf('?\n'),
    truncated.lastIndexOf('!\n'),
    truncated.lastIndexOf('\n\n'),
    truncated.lastIndexOf('.'),
  ];
  
  let breakPoint = Math.max(...boundaries);
  
  // If no good break point, cut at the limit
  if (breakPoint < estimatedMaxChars * 0.6) {
    breakPoint = estimatedMaxChars;
  }

  return truncated.slice(0, breakPoint) + '\n\n...[Content truncated due to size]...';
};

/**
 * ✅ Truncate conversation history
 */
export const truncateHistory = (
  history: string,
  maxTokens: number = 2000
): string => {
  return truncateContext(history, maxTokens);
};

/**
 * ✅ Estimate token count (rough estimate)
 */
export const estimateTokens = (text: string): number => {
  // Rough estimate: 1 token ≈ 4 characters for English
  // For Bengali/Hindi, it's about 2 characters per token
  const hasIndic = /[\u0980-\u09FF\u0900-\u097F]/.test(text);
  const charsPerToken = hasIndic ? 2 : 4;
  return Math.ceil(text.length / charsPerToken);
};

/**
 * ✅ Check if context exceeds token limit
 */
export const isContextTooLarge = (
  context: string,
  maxTokens: number = RAGConfig.openai.maxContextTokens
): boolean => {
  const estimatedTokens = estimateTokens(context);
  return estimatedTokens > maxTokens;
};

/**
 * ✅ Smart truncation that preserves important parts
 */
export const smartTruncate = (
  context: string,
  maxTokens: number = RAGConfig.openai.maxContextTokens,
  preserveStart: number = 0.7 // 70% from start, 30% from end
): string => {
  const safeMaxTokens = Math.floor(maxTokens * RAGConfig.openai.safetyMargin);
  const estimatedMaxChars = safeMaxTokens * 4;

  if (context.length <= estimatedMaxChars) {
    return context;
  }

  const startChars = Math.floor(estimatedMaxChars * preserveStart);
  const endChars = estimatedMaxChars - startChars;

  const start = context.slice(0, startChars);
  const end = context.slice(-endChars);

  // Find sentence boundaries for clean cutting
  const startBreak = start.lastIndexOf('. ') || start.lastIndexOf('\n\n') || startChars;
  const endBreak = end.indexOf('. ') || end.indexOf('\n\n') || endChars;

  const finalStart = start.slice(0, startBreak);
  const finalEnd = end.slice(endBreak);

  return finalStart + '\n\n...[Content truncated]...\n\n' + finalEnd;
};