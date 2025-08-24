/**
 * Utility functions for estimating and monitoring token usage
 */

// Approximate characters per token (conservative estimate)
const CHARS_PER_TOKEN = 3.5;

/**
 * Estimate token count from string length
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil((text?.length || 0) / CHARS_PER_TOKEN);
}

/**
 * Estimate token count for Reddit post
 */
export function estimatePostTokenCount(post: any): number {
  let total = 0;
  
  // Title (typically short)
  total += estimateTokenCount(post.title);
  
  // Selftext
  total += estimateTokenCount(post.selftext);
  
  // Comments
  if (Array.isArray(post.topComments)) {
    total += post.topComments.reduce((sum: number, comment: any) => {
      return sum + estimateTokenCount(comment.body);
    }, 0);
  }
  
  return total;
}

/**
 * Estimate token count for analysis prompt
 */
export function estimateAnalysisTokenCount(posts: any[], prompt: string): number {
  let total = estimateTokenCount(prompt);
  
  // Add posts
  if (Array.isArray(posts)) {
    total += posts.reduce((sum: number, post: any) => {
      return sum + estimatePostTokenCount(post);
    }, 0);
  }
  
  return total;
}

/**
 * Check if estimated token count is within safe limits
 */
export function isWithinTokenLimit(posts: any[], prompt: string, safetyMargin = 0.8): boolean {
  const estimatedTokens = estimateAnalysisTokenCount(posts, prompt);
  const safeLimit = 128000 * safetyMargin; // 80% of GPT-4o context window
  return estimatedTokens <= safeLimit;
}

/**
 * Log token usage for monitoring
 */
export function logTokenUsage(operation: string, estimatedTokens: number, context?: string) {
  console.log(`📊 Token Usage - ${operation}: ~${estimatedTokens} tokens ${context ? `(${context})` : ''}`);
}
