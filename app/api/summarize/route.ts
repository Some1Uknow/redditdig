import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { generateText, generateObject } from "ai";
import { mistral } from "@ai-sdk/mistral";
import axiosRetry from "axios-retry";
import { z } from "zod";

// Add retry logic to axios
axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000, // Exponential backoff: 1s, 2s, 3s
  retryCondition: (error) => {
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      error.response?.status === 429
    );
  },
});

// Define schemas for structured output
const SearchQuerySchema = z.object({
  keywords: z.array(z.string()).describe("Primary keywords for search"),
  subreddits: z.array(z.string()).describe("Relevant subreddits to search in"),
  excludeTerms: z.array(z.string()).describe("Terms to exclude from search"),
  timeFilter: z
    .enum(["all", "year", "month", "week", "day"])
    .describe("Time filter for posts"),
  sortBy: z
    .enum(["relevance", "hot", "top", "new"])
    .describe("Sort order for results"),
});

const AnalysisSchema = z.object({
  opinions: z.array(
    z.object({
      opinion: z.string(),
      count: z.number(),
      examples: z.array(z.string()),
    })
  ),
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
  biases: z.string(),
  subredditAnalysis: z.record(
    z.object({
      summary: z.string(),
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
      opinions: z.array(
        z.object({
          opinion: z.string(),
          count: z.number(),
        })
      ),
    })
  ),
});

async function generateRedditSearchStrategy(messages: any[]) {
  // Build conversation context properly
  const conversationContext = messages
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const result = await generateObject({
    model: mistral("mistral-small-latest"),
    schema: SearchQuerySchema,
    prompt: `Analyze this conversation and determine the best Reddit search strategy:

${conversationContext}

Based on the conversation:
1. Extract the main keywords that would be most relevant for Reddit search
2. Identify which subreddits would likely contain relevant discussions
3. Determine what terms should be excluded to improve results
4. Choose appropriate time filter and sort order

Be intelligent about subreddit selection - think about where discussions about this topic would naturally occur.`,
  });

  return result.object;
}

async function scrapeRedditPosts(searchStrategy: any, limit = 5) {
  try {
    const { keywords, subreddits, excludeTerms, sortBy } = searchStrategy;

    // Add safety checks for the search strategy parameters
    const safeKeywords = Array.isArray(keywords)
      ? keywords.filter((k) => k && typeof k === "string")
      : [];
    const safeSubreddits = Array.isArray(subreddits)
      ? subreddits.filter((s) => s && typeof s === "string")
      : [];
    const safeExcludeTerms = Array.isArray(excludeTerms)
      ? excludeTerms.filter((t) => t && typeof t === "string")
      : [];
    const safeSortBy = sortBy || "relevance";

    if (safeKeywords.length === 0) {
      console.log("No valid keywords found in search strategy");
      return [];
    }

    const searchQuery = safeKeywords.join(" ");
    const excludeQuery =
      safeExcludeTerms.length > 0 ? ` -${safeExcludeTerms.join(" -")}` : "";
    const fullQuery = searchQuery + excludeQuery;

    console.log(`Scraping Reddit with strategy:`, {
      keywords: safeKeywords,
      subreddits: safeSubreddits,
      excludeTerms: safeExcludeTerms,
      sortBy: safeSortBy,
    });

    // Build search approaches based on the strategy
    const searchApproaches = [
      // General search
      {
        url: "https://www.reddit.com/search.json",
        params: {
          q: fullQuery,
          limit: limit * 2,
          sort: safeSortBy,
          type: "link",
        },
      },
      // Subreddit-specific searches
      ...safeSubreddits.map((subreddit: string) => ({
        url: `https://www.reddit.com/r/${subreddit}/search.json`,
        params: {
          q: searchQuery,
          restrict_sr: "on",
          limit: Math.max(
            2,
            Math.floor(limit / Math.max(safeSubreddits.length, 1))
          ),
          sort: safeSortBy,
          type: "link",
        },
      })),
    ];

    let allPosts: any[] = [];

    for (const approach of searchApproaches) {
      try {
        console.log(
          `Searching in: ${approach.url} with query: ${approach.params.q}`
        );
        const searchResponse = await axios.get(approach.url, {
          params: approach.params,
          headers: {
            "User-Agent":
              "Reddit-Insight-App/1.1 (contact: your.email@example.com)",
          },
        });

        const posts = searchResponse.data.data.children;
        console.log(`Found ${posts.length} posts from ${approach.url}`);
        allPosts.push(...posts);

        // Rate limiting
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (err) {
        console.error(
          `Error with search approach ${approach.url}:`,
          (err as Error).message
        );
      }
    }

    // Remove duplicates
    const uniquePosts = allPosts.filter(
      (post, index, self) =>
        index === self.findIndex((p) => p?.data?.id === post?.data?.id)
    );

    console.log(`Found ${uniquePosts.length} unique posts after deduplication`);

    if (uniquePosts.length === 0) {
      console.log("No posts found.");
      return [];
    }

    // Log a sample of the posts for debugging
    console.log("Sample post data structure:", {
      firstPost: uniquePosts[0]?.data
        ? {
            id: uniquePosts[0].data.id,
            title: uniquePosts[0].data.title?.substring(0, 50),
            subreddit: uniquePosts[0].data.subreddit,
            hasPermalink: !!uniquePosts[0].data.permalink,
          }
        : "No data",
    });

    // Smart relevance scoring based on search strategy
    const scoredPosts = uniquePosts
      .filter((post) => post.data && post.data.title && post.data.subreddit) // Filter out invalid posts
      .map((post) => {
        let relevanceScore = 0;
        const title = post.data.title?.toLowerCase() || "";
        const subreddit = post.data.subreddit?.toLowerCase() || "";

        // Score based on keyword presence
        safeKeywords.forEach((keyword: string) => {
          if (keyword && title.includes(keyword.toLowerCase())) {
            relevanceScore += 3;
          }
        });

        // Score based on target subreddits
        if (
          safeSubreddits.map((s: string) => s.toLowerCase()).includes(subreddit)
        ) {
          relevanceScore += 5;
        }

        // Penalize excluded terms
        safeExcludeTerms.forEach((term: string) => {
          if (term && title.includes(term.toLowerCase())) {
            relevanceScore -= 2;
          }
        });

        // Engagement bonus (with null checks)
        const score = post.data.score || 0;
        const comments = post.data.num_comments || 0;
        relevanceScore += Math.log(score + 1) * 0.5;
        relevanceScore += Math.log(comments + 1) * 0.3;

        return { ...post, relevanceScore };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit * 2);

    // Fetch detailed content
    const detailedPosts = [];
    let successCount = 0;

    for (const post of scoredPosts) {
      if (successCount >= limit) break;

      try {
        // Additional safety checks
        if (!post.data || !post.data.permalink || !post.data.title) {
          console.log(`Skipping invalid post: ${post.data?.id || "unknown"}`);
          continue;
        }

        console.log(
          `Fetching post ${
            successCount + 1
          }/${limit}: ${post.data.title.substring(0, 50)}...`
        );
        const response = await axios.get(
          `https://www.reddit.com${post.data.permalink}.json`,
          {
            headers: {
              "User-Agent":
                "Reddit-Insight-App/1.1 (contact: your.email@example.com)",
            },
          }
        );

        // Check if response has expected structure
        if (
          !response.data ||
          !Array.isArray(response.data) ||
          response.data.length < 2
        ) {
          console.log(`Invalid response structure for post ${post.data.id}`);
          continue;
        }

        const postData = response.data[0]?.data?.children?.[0]?.data;
        const commentsData = response.data[1]?.data?.children || [];

        if (!postData) {
          console.log(`No post data found for ${post.data.id}`);
          continue;
        }

        const topComments = commentsData
          .slice(0, 5)
          .filter(
            (comment: any) =>
              comment.data.body &&
              comment.data.body !== "[deleted]" &&
              comment.data.body !== "[removed]"
          )
          .map(
            (comment: any, i: number) =>
              `Comment ${i + 1}: ${comment.data.body}`
          )
          .join("\n");

        const fullContent = `${
          postData.selftext || "No post body."
        }\n\nTop Comments:\n${topComments || "No comments."}`;

        detailedPosts.push({
          id: postData.id,
          title: postData.title,
          author: postData.author,
          subreddit: postData.subreddit,
          score: postData.score,
          num_comments: postData.num_comments,
          selftext: postData.selftext,
          url: `https://www.reddit.com${postData.permalink}`,
          fullContent: fullContent,
        });

        successCount++;
        console.log(`Successfully fetched post ${successCount}/${limit}`);

        await new Promise((resolve) =>
          setTimeout(resolve, 1000 + Math.random() * 500)
        );
      } catch (err) {
        console.error(
          `Error fetching post ${post.data.id}:`,
          (err as Error).message
        );
      }
    }

    console.log(`Successfully scraped ${detailedPosts.length} posts`);
    return detailedPosts;
  } catch (error) {
    console.error("Scraping Error:", (error as Error).message);
    return [];
  }
}

export async function POST(request: NextRequest) {
  // Add timeout wrapper
  const timeout = new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error("Request timeout after 30 seconds")),
      30000
    )
  );

  const processRequest = async () => {
    try {
      const body = await request.json();
      const { messages } = body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return NextResponse.json(
          { error: "No messages provided" },
          { status: 400 }
        );
      }

      // 1. Build full conversation history (properly handle multiple messages)
      const conversation = messages
        .map(
          (m: { role: string; content: string }) =>
            `${m.role.toUpperCase()}: ${m.content}`
        )
        .join("\n\n");

      // 2. Generate intelligent search strategy via AI
      const searchStrategy = await generateRedditSearchStrategy(messages);
      console.log(`Generated search strategy:`, searchStrategy);

      // 3. Scrape using the intelligent strategy
      const posts = await scrapeRedditPosts(searchStrategy, 5);
      console.log(`Scraped ${posts.length} posts successfully`);

      if (posts.length === 0) {
        return NextResponse.json(
          { error: "No Reddit data found for the query." },
          { status: 404 }
        );
      }

      // 4. Build context
      const context = posts
        .map(
          (post, index) =>
            `Source [${index + 1}]:
Subreddit: r/${post.subreddit}
Title: ${post.title}
URL: ${post.url}
Content and Top Comments:
${post.fullContent}`
        )
        .join("\n\n---\n\n");

      // 5. Generate summary
      console.log("🔍 Starting summary generation...");
      const summaryPrompt = `You are a Reddit research analyst. Based *only* on the provided Reddit posts, including their main content and top comments, generate a comprehensive and neutral summary.
    
    Instructions:
    1. Start with a direct, insightful summary paragraph that captures the main themes and sentiments.
    2. Follow with a bulleted list of the most important specific points, findings, or opinions discussed.
    3. You **must** cite your information using the format [Source X] at the end of each point.
    4. Ensure all URLs are properly formatted and clickable, post should be in markdown format strictly.
    
    Here is the research material:
    ${context}
    
    Provide your detailed analysis now:`;

      const { text: summary } = await generateText({
        model: mistral("ministral-8b-latest"),
        prompt: summaryPrompt,
        maxTokens: 1500, // Add token limit
      });
      console.log("✅ Summary generation completed");

      // 6. Generate advanced analysis using structured output
      let analysis;
      try {
        console.log("Starting analysis generation...");
        const result = await generateObject({
          model: mistral("ministral-8b-latest"),
          schema: AnalysisSchema,
          prompt: `Analyze this Reddit data comprehensively and extract meaningful insights:

${context}

Instructions:
1. OPINIONS: Identify distinct viewpoints, recommendations, or conclusions expressed in posts/comments. Focus on actionable insights, product recommendations, or clear stances. Each opinion should represent a meaningful perspective.
2. SENTIMENT: Analyze the emotional tone of each post and comment. Count positive (satisfied, recommending, happy), negative (frustrated, warning, complaining), and neutral (informational, factual) sentiments.
3. BIASES: Look for echo chambers, promotional content, brand favoritism, or demographic skews.
4. SUBREDDIT ANALYSIS: Analyze how different communities approach the topic differently.

Provide specific examples and accurate counts. Make sure opinions are substantial and meaningful, not just keywords.`,
          maxTokens: 2000, // Add token limit to prevent timeouts
        });

        analysis = result.object;
        console.log("✅ Analysis generation completed successfully");
        console.log("Analysis opinions count:", analysis.opinions?.length || 0);
        console.log("Analysis sentiments:", analysis.sentiments);
        console.log("First opinion example:", analysis.opinions?.[0]);
      } catch (err) {
        console.error("❌ Analysis generation error:", err);
        // Create a more detailed fallback analysis
        analysis = {
          opinions: [
            {
              opinion:
                "Analysis could not be generated due to processing limitations",
              count: 1,
              examples: ["Please try with a simpler query"],
            },
          ],
          sentiments: {
            positive: 1,
            negative: 0,
            neutral: 0,
            total: 1,
            percentages: { positive: 100, negative: 0, neutral: 0 },
          },
          biases:
            "Analysis generation failed - unable to detect biases in the provided content",
          subredditAnalysis: {
            general: {
              summary:
                "Analysis was not completed due to processing constraints",
              sentiments: {
                positive: 1,
                negative: 0,
                neutral: 0,
                total: 1,
                percentages: { positive: 100, negative: 0, neutral: 0 },
              },
              opinions: [
                {
                  opinion: "Processing failed",
                  count: 1,
                },
              ],
            },
          },
        };
      }

      // 7. Prepare chart data (extract from analysis for frontend rendering)
      const chartData = {
        sentimentPie:
          analysis.sentiments && analysis.sentiments.percentages
            ? [
                {
                  name: "Positive",
                  value: analysis.sentiments.percentages.positive || 0,
                },
                {
                  name: "Negative",
                  value: analysis.sentiments.percentages.negative || 0,
                },
                {
                  name: "Neutral",
                  value: analysis.sentiments.percentages.neutral || 0,
                },
              ].filter(
                (item: { name: string; value: number }) => item.value > 0
              ) // Only include non-zero values
            : [],
        opinionBar:
          analysis.opinions && Array.isArray(analysis.opinions)
            ? analysis.opinions
                .map((op: any) => ({
                  name:
                    op.opinion && op.opinion.length > 30
                      ? op.opinion.substring(0, 30) + "..."
                      : op.opinion || "Unknown",
                  fullName: op.opinion || "Unknown", // Keep full name for tooltip
                  value: op.count || 0,
                }))
                .filter(
                  (item: { name: string; value: number; fullName: string }) =>
                    item.value > 0
                )
                .slice(0, 8) // Limit to top 8 opinions for readability
            : [],
      };

      console.log("Chart data prepared:", {
        sentimentPieCount: chartData.sentimentPie.length,
        opinionBarCount: chartData.opinionBar.length,
        analysisOpinionsCount: analysis.opinions?.length || 0,
        firstOpinion: analysis.opinions?.[0],
      });

      console.log("🎯 Preparing final response...");
      const response = {
        summary,
        analysis,
        chartData,
        sources: posts,
      };
      console.log("✅ Response prepared successfully");

      return NextResponse.json(response);
    } catch (error) {
      console.error("API Error:", error);
      return NextResponse.json(
        { error: "Failed to generate response." },
        { status: 500 }
      );
    }
  };

  try {
    return await Promise.race([processRequest(), timeout]);
  } catch (error) {
    console.error("Request failed or timed out:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message.includes("timeout")
            ? "Request timed out. Please try with a simpler query."
            : "Failed to generate response.",
      },
      { status: 500 }
    );
  }
}
