import { tool } from "ai";
import { z } from "zod";
import { generateObject } from "ai";
import { mistral } from "@ai-sdk/mistral";
import { openai } from "@ai-sdk/openai";

const AnalysisSchema = z.object({
  opinions: z
    .array(
      z.object({
        opinion: z
          .string()
          .describe(
            "A clear, distinct opinion or recommendation found in the data"
          ),
        count: z.number().describe("Number of times this opinion appeared"),
        examples: z
          .array(z.string())
          .describe("Specific quotes or examples supporting this opinion")
          .optional(),
        confidence: z
          .number()
          .min(1)
          .max(5)
          .describe("Confidence level (1-5) in this opinion analysis")
          .optional(),
      })
    )
    .describe("Key distinct opinions found in the Reddit data"),
  sentiments: z.object({
    positive: z.number().describe("Count of positive posts/comments").optional(),
    negative: z.number().describe("Count of negative posts/comments").optional(),
    neutral: z.number().describe("Count of neutral posts/comments").optional(),
    total: z.number().describe("Total posts/comments analyzed").optional(),
    percentages: z.object({
      positive: z.number().describe("Percentage of positive sentiment").optional(),
      negative: z.number().describe("Percentage of negative sentiment").optional(),
      neutral: z.number().describe("Percentage of neutral sentiment").optional(),
    }).optional(),
  }).optional(),
  keyInsights: z
    .array(z.string())
    .describe("Top 3-5 key insights from the analysis")
    .optional(),
  biases: z.string().describe("Detected biases in the community discussions").optional(),
  subredditAnalysis: z
    .record(
      z.object({
        summary: z.string().describe("Summary of this subreddit's perspective").optional(),
        sentiments: z.object({
          positive: z.number().optional(),
          negative: z.number().optional(),
          neutral: z.number().optional(),
          total: z.number().optional(),
          percentages: z.object({
            positive: z.number().optional(),
            negative: z.number().optional(),
            neutral: z.number().optional(),
          }).optional(),
        }).optional(),
        dominantOpinions: z.array(
          z.object({
            opinion: z.string().optional(),
            strength: z
              .number()
              .min(1)
              .max(5)
              .describe("How strongly this opinion is held (1-5)")
              .optional(),
          })
        ).optional(),
      })
    )
    .describe("Analysis broken down by subreddit communities")
    .optional(),
});

export const analyzeRedditDataTool = tool({
  description: `Analyze Reddit posts and comments to extract insights, sentiments, opinions, and community perspectives.
  This tool performs comprehensive analysis including sentiment analysis, opinion extraction, bias detection, and community-specific insights.
  Use this tool when you have Reddit data that needs to be analyzed for patterns, opinions, or insights.`,
  inputSchema: z.object({
    // Use a concrete item schema for posts so the schema can be converted to JSON
    // (z.any() is not serializable to JSON Schema in some toolchains and causes
    // "array schema missing items" validation errors).
    posts: z
      .array(
        z
          .object({
            id: z.string().optional(),
            title: z.string().optional(),
            subreddit: z.string().optional(),
            author: z.string().optional(),
            score: z.number().optional(),
            num_comments: z.number().optional(),
            selftext: z.string().optional(),
            topComments: z
              .array(
                z.object({
                  body: z.string().optional(),
                  score: z.number().optional(),
                })
              )
              .optional(),
          })
          .passthrough()
      )
      .describe("Array of Reddit posts with content and comments to analyze"),
    analysisType: z
      .enum(["comprehensive", "sentiment", "opinions", "community", "trends"])
      .default("comprehensive")
      .describe("Type of analysis to perform"),
    focusArea: z
      .string()
      .optional()
      .describe("Specific area to focus the analysis on (optional)"),
  }),
  execute: async ({ posts, analysisType, focusArea }) => {
    try {
      console.log(
        `🧠 Starting ${analysisType} analysis of ${posts.length} Reddit posts...`
      );

      if (!posts || posts.length === 0) {
        return {
          success: false,
          message: "No posts provided for analysis",
          analysis: null,
        };
      }

      // Restore full content for high-quality analysis
      const limitedPosts = posts.map((post: any) => ({
        ...post,
        // Remove content truncation for comprehensive analysis
        selftext: post.selftext,
        // Restore full comments for better context
        topComments: post.topComments || [],
      }));

      // Increase batch size for more comprehensive analysis
      const batchSize = 8;
      const batches = [];
      for (let i = 0; i < limitedPosts.length; i += batchSize) {
        batches.push(limitedPosts.slice(i, i + batchSize));
      }

      let allOpinions: any[] = [];
      let allKeyInsights: any[] = [];
      let allBiases: string[] = [];
      let allSubreddits = new Set<string>();
      let totalScore = 0;
      let totalComments = 0;
      let allSentiments = { positive: 0, negative: 0, neutral: 0, total: 0 };
      let allSubredditAnalysis: Record<string, any> = {};
      let totalPostsAnalyzed = 0;
      let analysisSucceeded = false;

      try {
        for (const batch of batches) {
          // Build context for this batch
          const context = batch
            .map((post: any, index: number) => {
              const commentsText = post.topComments
                ? post.topComments
                    .map((c: any) => `Comment (${c.score} pts): ${c.body}`)
                    .join("\n")
                : "No comments available";
              return `Post ${index + 1}:
Subreddit: r/${post.subreddit}
Title: ${post.title}
Author: u/${post.author}
Score: ${post.score} points, ${post.num_comments} comments
Content: ${post.selftext || "No post body"}
Top Comments:
${commentsText}
---`;
            })
            .join("\n\n");

          // Restore full context for comprehensive analysis
          const maxContextLength = 12000;
          const analysisContext = context;

          console.log(
            `📊 Analyzing ${analysisContext.length} characters of Reddit content...`
          );

          // Create focused analysis prompt based on type
          let analysisPrompt = `Analyze this Reddit data comprehensively. Extract meaningful insights, opinions, and patterns.

${analysisContext}

Instructions:
1. OPINIONS: Identify distinct, meaningful viewpoints and recommendations. Focus on actionable insights and clear positions people take.
2. SENTIMENT: Accurately count emotional tones - positive (happy, satisfied, recommending), negative (frustrated, disappointed, warning), neutral (informational, factual).
3. KEY INSIGHTS: Extract the most important takeaways and patterns.
4. BIASES: Identify echo chambers, demographic skews, or community-specific biases.
5. SUBREDDIT ANALYSIS: Analyze how different communities approach the topic differently.

${
  focusArea
    ? `FOCUS AREA: Pay special attention to insights related to "${focusArea}".`
    : ""
}

Be specific, cite examples, and ensure opinions are substantial and distinct.`;

          // Modify prompt based on analysis type
          if (analysisType === "sentiment") {
            analysisPrompt +=
              "\n\nFocus primarily on sentiment analysis and emotional patterns.";
          } else if (analysisType === "opinions") {
            analysisPrompt +=
              "\n\nFocus primarily on extracting distinct opinions and viewpoints.";
          } else if (analysisType === "community") {
            analysisPrompt +=
              "\n\nFocus primarily on community-specific perspectives and differences between subreddits.";
          } else if (analysisType === "trends") {
            analysisPrompt +=
              "\n\nFocus on identifying trends, patterns, and emerging themes in the discussions.";
          }

          const result = await generateObject({
            model: openai("gpt-4o-2024-11-20"),
            schema: AnalysisSchema,
            prompt: analysisPrompt,
          });

          const analysis = result.object;
          // Merge batch results
          if (Array.isArray(analysis.opinions)) {
            allOpinions.push(...analysis.opinions);
          }
          if (Array.isArray(analysis.keyInsights)) {
            allKeyInsights.push(...analysis.keyInsights);
          }
          if (typeof analysis.biases === "string") {
            allBiases.push(analysis.biases);
          }
          batch.forEach((p: any) => {
            allSubreddits.add(p.subreddit);
            totalScore += p.score || 0;
            totalComments += p.num_comments || 0;
          });
          // Merge sentiments
          if (analysis.sentiments) {
            allSentiments.positive += analysis.sentiments.positive || 0;
            allSentiments.negative += analysis.sentiments.negative || 0;
            allSentiments.neutral += analysis.sentiments.neutral || 0;
            allSentiments.total += analysis.sentiments.total || 0;
          }
          // Merge subredditAnalysis
          if (analysis.subredditAnalysis) {
            for (const [sub, subAnalysis] of Object.entries(
              analysis.subredditAnalysis
            )) {
              if (!allSubredditAnalysis[sub]) {
                allSubredditAnalysis[sub] = subAnalysis;
              } else {
                // Merge only allowed sentiment keys
                const prev = allSubredditAnalysis[sub];
                // Use a typed key union to satisfy TypeScript when indexing
                const sentimentKeys = [
                  "positive",
                  "negative",
                  "neutral",
                  "total",
                ] as const;
                for (const key of sentimentKeys) {
                  const k = key as keyof typeof prev.sentiments;
                  if (k in prev.sentiments && subAnalysis.sentiments && k in subAnalysis.sentiments) {
                    // Type assertions are safe here because keys are restricted above
                    (prev.sentiments as any)[k] += (
                      subAnalysis.sentiments as any
                    )[k] || 0;
                  }
                }
                if (subAnalysis.dominantOpinions) {
                  prev.dominantOpinions.push(...subAnalysis.dominantOpinions);
                }
              }
            }
          }
          totalPostsAnalyzed += batch.length;
          analysisSucceeded = true;
          console.log(
            `✅ Batch analysis complete! Found ${
              Array.isArray(analysis.opinions) ? analysis.opinions.length : 0
            } opinions, analyzed ${analysis.sentiments?.total ?? 0} items`
          );
        }
      } catch (analysisError) {
        console.error(
          "⚠️ Detailed batch analysis failed"
        );
        // Don't set analysisSucceeded = false, let the outer try/catch handle it
        throw analysisError;
      }

      // Merge all batch results
      const enhancedAnalysis = {
        opinions: allOpinions,
        sentiments: {
          ...allSentiments,
          percentages: {
            positive: allSentiments.total
              ? Math.round((allSentiments.positive / allSentiments.total) * 100)
              : 0,
            negative: allSentiments.total
              ? Math.round((allSentiments.negative / allSentiments.total) * 100)
              : 0,
            neutral: allSentiments.total
              ? Math.round((allSentiments.neutral / allSentiments.total) * 100)
              : 0,
          },
        },
        keyInsights: allKeyInsights,
        biases: allBiases.join("\n"),
        subredditAnalysis: allSubredditAnalysis,
        metadata: {
          postsAnalyzed: totalPostsAnalyzed,
          subredditsIncluded: Array.from(allSubreddits),
          totalScore,
          totalComments,
          analysisType,
          focusArea: focusArea || null,
          timestamp: new Date().toISOString(),
        },
      };

      return {
        success: true,
        message: `Completed ${analysisType} analysis of ${totalPostsAnalyzed} Reddit posts (batched)`,
        analysis: enhancedAnalysis,
        rawData: {
          posts: limitedPosts.map((p: any) => ({
            id: p.id,
            title: p.title,
            subreddit: p.subreddit,
            score: p.score,
            comments: p.num_comments,
          })),
        },
      };
    } catch (error) {
      console.error("Reddit analysis error:", error);
      return {
        success: false,
        message: `Analysis failed: ${(error as Error).message}`,
        analysis: null,
      };
    }
  },
});
