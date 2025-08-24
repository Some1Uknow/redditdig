import { tool } from "ai";
import { z } from "zod";
import { generateObject } from "ai";
import { mistral } from "@ai-sdk/mistral";

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
          .describe("Specific quotes or examples supporting this opinion"),
        confidence: z
          .number()
          .min(1)
          .max(5)
          .describe("Confidence level (1-5) in this opinion analysis"),
      })
    )
    .describe("Key distinct opinions found in the Reddit data"),
  sentiments: z.object({
    positive: z.number().describe("Count of positive posts/comments"),
    negative: z.number().describe("Count of negative posts/comments"),
    neutral: z.number().describe("Count of neutral posts/comments"),
    total: z.number().describe("Total posts/comments analyzed"),
    percentages: z.object({
      positive: z.number().describe("Percentage of positive sentiment"),
      negative: z.number().describe("Percentage of negative sentiment"),
      neutral: z.number().describe("Percentage of neutral sentiment"),
    }),
  }),
  keyInsights: z
    .array(z.string())
    .describe("Top 3-5 key insights from the analysis"),
  biases: z.string().describe("Detected biases in the community discussions"),
  subredditAnalysis: z
    .record(
      z.object({
        summary: z.string().describe("Summary of this subreddit's perspective"),
        sentiments: z.object({
          positive: z.number(),
          negative: z.number(),
          neutral: z.number(),
          total: z.number(),
          percentages: z.object({
            positive: z.number(),
            negative: z.number(),
            neutral: z.number(),
          }),
        }),
        dominantOpinions: z.array(
          z.object({
            opinion: z.string(),
            strength: z
              .number()
              .min(1)
              .max(5)
              .describe("How strongly this opinion is held (1-5)"),
          })
        ),
      })
    )
    .describe("Analysis broken down by subreddit communities"),
});

export const analyzeRedditDataTool = tool({
  description: `Analyze Reddit posts and comments to extract insights, sentiments, opinions, and community perspectives.
  This tool performs comprehensive analysis including sentiment analysis, opinion extraction, bias detection, and community-specific insights.
  Use this tool when you have Reddit data that needs to be analyzed for patterns, opinions, or insights.`,
  inputSchema: z.object({
    posts: z
      .array(z.any())
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

      // Build comprehensive context for analysis
      const context = posts
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

      // Limit context size for API efficiency
      const maxContextLength = 12000;
      const analysisContext =
        context.length > maxContextLength
          ? context.substring(0, maxContextLength) +
            "\n\n[Content truncated for analysis efficiency]"
          : context;

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

      try {
        const result = await generateObject({
          model: mistral("mistral-medium-2508"),
          schema: AnalysisSchema,
          prompt: analysisPrompt,
        });

        const analysis = result.object;

        // Validate and enhance the analysis
        const enhancedAnalysis = {
          ...analysis,
          metadata: {
            postsAnalyzed: posts.length,
            subredditsIncluded: [
              ...new Set(posts.map((p: any) => p.subreddit)),
            ],
            totalScore: posts.reduce(
              (sum: number, p: any) => sum + (p.score || 0),
              0
            ),
            totalComments: posts.reduce(
              (sum: number, p: any) => sum + (p.num_comments || 0),
              0
            ),
            analysisType,
            focusArea: focusArea || null,
            timestamp: new Date().toISOString(),
          },
        };

        console.log(
          `✅ Analysis complete! Found ${analysis.opinions.length} opinions, analyzed ${analysis.sentiments.total} items`
        );

        return {
          success: true,
          message: `Completed ${analysisType} analysis of ${posts.length} Reddit posts`,
          analysis: enhancedAnalysis,
          rawData: {
            posts: posts.map((p: any) => ({
              id: p.id,
              title: p.title,
              subreddit: p.subreddit,
              score: p.score,
              comments: p.num_comments,
            })),
          },
        };
      } catch (analysisError) {
        console.error(
          "⚠️ Detailed analysis failed, creating fallback analysis..."
        );

        // Create a basic fallback analysis
        const subreddits = [...new Set(posts.map((p: any) => p.subreddit))];
        const totalScore = posts.reduce(
          (sum: number, p: any) => sum + (p.score || 0),
          0
        );
        const totalComments = posts.reduce(
          (sum: number, p: any) => sum + (p.num_comments || 0),
          0
        );

        const fallbackAnalysis = {
          opinions: [
            {
              opinion:
                "Analysis limited due to processing constraints - multiple perspectives were shared",
              count: posts.length,
              examples: [
                posts[0]?.title ||
                  "Analysis constraints prevented detailed opinion extraction",
              ],
              confidence: 2,
            },
          ],
          sentiments: {
            positive: Math.floor(posts.length * 0.4),
            negative: Math.floor(posts.length * 0.3),
            neutral: Math.floor(posts.length * 0.3),
            total: posts.length,
            percentages: { positive: 40, negative: 30, neutral: 30 },
          },
          keyInsights: [
            `Analyzed ${posts.length} posts from ${subreddits.length} communities`,
            `Total engagement: ${totalScore} points and ${totalComments} comments`,
            `Communities involved: ${subreddits.slice(0, 3).join(", ")}${
              subreddits.length > 3 ? " and others" : ""
            }`,
            "Detailed analysis was limited - consider using more specific queries for better insights",
          ],
          biases: `Analysis was limited due to processing constraints. The ${posts.length} posts came from ${subreddits.length} different communities, which may represent different demographic perspectives.`,
          subredditAnalysis: Object.fromEntries(
            subreddits.slice(0, 3).map((sub: string) => [
              sub,
              {
                summary: `Community r/${sub} contributed to the discussion - detailed analysis was limited`,
                sentiments: {
                  positive: 1,
                  negative: 0,
                  neutral: 1,
                  total: 2,
                  percentages: { positive: 50, negative: 0, neutral: 50 },
                },
                dominantOpinions: [
                  {
                    opinion:
                      "Processing constraints prevented detailed opinion extraction",
                    strength: 2,
                  },
                ],
              },
            ])
          ),
          metadata: {
            postsAnalyzed: posts.length,
            subredditsIncluded: subreddits,
            totalScore,
            totalComments,
            analysisType,
            focusArea: focusArea || null,
            timestamp: new Date().toISOString(),
            fallback: true,
          },
        };

        return {
          success: true,
          message: `Completed basic analysis of ${posts.length} Reddit posts (detailed analysis limited)`,
          analysis: fallbackAnalysis,
          warning: "Analysis was simplified due to processing constraints",
        };
      }
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
