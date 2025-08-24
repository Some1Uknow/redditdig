import { tool } from "ai";
import { z } from "zod";
import axios from "axios";
import axiosRetry from "axios-retry";

// Configure axios retry
axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
  retryCondition: (error) => {
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      error.response?.status === 429
    );
  },
});

export const redditSearchTool = tool({
  description: `Search Reddit for posts and discussions about a specific topic. 
  This tool intelligently searches across relevant subreddits and returns detailed posts with comments.
  Use this when users ask about Reddit opinions, discussions, experiences, or want to research a topic.`,
  inputSchema: z.object({
    query: z.string().describe("The main topic or question to search for"),
    subreddits: z
      .array(z.string())
      .optional()
      .describe("Specific subreddits to search in (optional)"),
    excludeTerms: z
      .array(z.string())
      .optional()
      .describe("Terms to exclude from search results"),
    sortBy: z
      .enum(["relevance", "hot", "top", "new"])
      .default("relevance")
      .describe("How to sort the results"),
    timeFilter: z
      .enum(["all", "year", "month", "week", "day"])
      .default("all")
      .describe("Time range for posts"),
    limit: z
      .number()
      .min(1)
      .max(2)
      .default(2)
      .describe("Number of posts to retrieve"),
  }),
  execute: async ({
    query,
    subreddits = [],
    excludeTerms = [],
    sortBy,
    timeFilter,
    limit,
  }) => {
    try {
      console.log(`🔍 Searching Reddit for: "${query}"`);

      // Determine smart subreddits if none provided
      const smartSubreddits =
        subreddits.length > 0 ? subreddits : generateSmartSubreddits(query);

      const searchQuery = query;
      const excludeQuery =
        excludeTerms.length > 0 ? ` -${excludeTerms.join(" -")}` : "";
      const fullQuery = searchQuery + excludeQuery;

      const searchApproaches: Array<{
        url: string;
        params: any;
        isGeneral: boolean;
        subreddit?: string;
      }> = [
        // General Reddit search
        {
          url: "https://www.reddit.com/search.json",
          params: {
            q: fullQuery,
            limit: limit * 2,
            sort: sortBy,
            type: "link",
          },
          isGeneral: true,
        },
        // Subreddit-specific searches
        ...smartSubreddits.map((subreddit: string) => ({
          url: `https://www.reddit.com/r/${subreddit}/search.json`,
          params: {
            q: searchQuery,
            restrict_sr: "on",
            limit: Math.max(
              2,
              Math.floor(limit / Math.max(smartSubreddits.length, 1))
            ),
            sort: sortBy,
            type: "link",
          },
          isGeneral: false,
          subreddit,
        })),
      ];

      let allPosts: any[] = [];

      for (const approach of searchApproaches) {
        try {
          console.log(
            `📂 Searching ${
              approach.isGeneral ? "all Reddit" : `r/${approach.subreddit}`
            }...`
          );

          const searchResponse = await axios.get(approach.url, {
            params: approach.params,
            headers: {
              "User-Agent": "RedditDig-App/2.0 (Advanced Reddit Analysis Tool)",
            },
          });

          const posts = searchResponse.data.data.children;
          allPosts.push(...posts);
          console.log(
            `✅ Found ${posts.length} posts from ${
              approach.isGeneral ? "general search" : `r/${approach.subreddit}`
            }`
          );

          await new Promise((resolve) => setTimeout(resolve, 300));
        } catch (err) {
          console.error(
            `⚠️ Error searching ${approach.url}:`,
            (err as Error).message
          );
        }
      }

      // Remove duplicates and filter invalid posts
      const uniquePosts = allPosts.filter(
        (post, index, self) =>
          post?.data?.id &&
          post?.data?.title &&
          post?.data?.subreddit &&
          index === self.findIndex((p) => p?.data?.id === post?.data?.id)
      );

      console.log(
        `📊 Found ${uniquePosts.length} unique posts, scoring and ranking...`
      );

      if (uniquePosts.length === 0) {
        return {
          success: false,
          message: "No Reddit posts found for the given query.",
          posts: [],
        };
      }

      // Smart relevance scoring
      const scoredPosts = uniquePosts
        .map((post) => {
          let relevanceScore = 0;
          const title = post.data.title?.toLowerCase() || "";
          const subreddit = post.data.subreddit?.toLowerCase() || "";

          // Keyword matching
          const queryWords = query.toLowerCase().split(/\s+/);
          queryWords.forEach((word: string) => {
            if (word.length > 2 && title.includes(word)) {
              relevanceScore += 3;
            }
          });

          // Subreddit relevance
          if (
            smartSubreddits
              .map((s: string) => s.toLowerCase())
              .includes(subreddit)
          ) {
            relevanceScore += 5;
          }

          // Exclude term penalty
          excludeTerms.forEach((term: string) => {
            if (term && title.includes(term.toLowerCase())) {
              relevanceScore -= 2;
            }
          });

          // Engagement scoring
          const score = post.data.score || 0;
          const comments = post.data.num_comments || 0;
          relevanceScore += Math.log(Math.max(score, 1)) * 0.5;
          relevanceScore += Math.log(Math.max(comments, 1)) * 0.3;

          return { ...post, relevanceScore };
        })
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);

      console.log(
        `📑 Getting detailed content from top ${scoredPosts.length} posts...`
      );

      // Fetch detailed post content in parallel
      const fetchPostDetails = async (post: any) => {
        try {
          if (!post.data?.permalink) return null;
          console.log(`📖 Reading: "${post.data.title.substring(0, 40)}..."`);
          const response = await axios.get(
            `https://www.reddit.com${post.data.permalink}.json`,
            {
              headers: {
                "User-Agent":
                  "RedditDig-App/2.0 (Advanced Reddit Analysis Tool)",
              },
            }
          );
          if (
            !response.data ||
            !Array.isArray(response.data) ||
            response.data.length < 2
          ) {
            return null;
          }
          const postData = response.data[0]?.data?.children?.[0]?.data;
          const commentsData = response.data[1]?.data?.children || [];
          if (!postData) return null;
          // Extract top comments - reduced from 5 to 3 and truncate long comments
          const topComments = commentsData
            .slice(0, 3)
            .filter(
              (comment: any) =>
                comment.data.body &&
                comment.data.body !== "[deleted]" &&
                comment.data.body !== "[removed]" &&
                comment.data.body.length > 10
            )
            .map((comment: any, i: number) => ({
              author: comment.data.author,
              body: comment.data.body.length > 300 
                ? comment.data.body.substring(0, 300) + "..."
                : comment.data.body,
              score: comment.data.score,
              index: i + 1,
            }));
          // Truncate post content for token efficiency
          const truncatedSelftext = postData.selftext && postData.selftext.length > 800
            ? postData.selftext.substring(0, 800) + "..."
            : postData.selftext || "No post body.";
            
          const fullContent = `${truncatedSelftext}\n\nTop Comments:\n${
            topComments.length > 0
              ? topComments
                  .map(
                    (c: any) =>
                      `Comment ${c.index} (${c.score} points): ${c.body}`
                  )
                  .join("\n\n")
              : "No comments available."
          }`;
          return {
            id: postData.id,
            title: postData.title,
            author: postData.author,
            subreddit: postData.subreddit,
            score: postData.score,
            num_comments: postData.num_comments,
            selftext: postData.selftext,
            url: `https://www.reddit.com${postData.permalink}`,
            fullContent: fullContent,
            topComments: topComments,
            relevanceScore: post.relevanceScore,
          };
        } catch (err) {
          console.error(
            `⚠️ Failed to fetch post details:`,
            (err as Error).message
          );
          return null;
        }
      };

      // Run all fetches in parallel, limit to 'limit' posts
      const detailedPostsRaw = await Promise.all(
        scoredPosts.slice(0, limit).map(fetchPostDetails)
      );
      const detailedPosts = detailedPostsRaw.filter(Boolean);

      console.log(
        `🎉 Successfully retrieved ${detailedPosts.length} detailed Reddit posts!`
      );

      return {
        success: true,
        message: `Found ${detailedPosts.length} relevant Reddit posts about "${query}"`,
        query,
        searchParams: {
          subreddits: smartSubreddits,
          sortBy,
          timeFilter,
          excludeTerms,
        },
        posts: detailedPosts,
        totalFound: uniquePosts.length,
      };
    } catch (error) {
      console.error("Reddit search error:", error);
      return {
        success: false,
        message: `Failed to search Reddit: ${(error as Error).message}`,
        posts: [],
      };
    } finally {
    }
  },
});

// Helper function to generate smart subreddits based on query
function generateSmartSubreddits(query: string): string[] {
  const lowerQuery = query.toLowerCase();

  // Tech and programming
  if (
    lowerQuery.includes("programming") ||
    lowerQuery.includes("coding") ||
    lowerQuery.includes("javascript") ||
    lowerQuery.includes("python") ||
    lowerQuery.includes("react") ||
    lowerQuery.includes("node")
  ) {
    return [
      "programming",
      "javascript",
      "reactjs",
      "node",
      "webdev",
      "learnprogramming",
    ];
  }

  // Gaming
  if (
    lowerQuery.includes("game") ||
    lowerQuery.includes("gaming") ||
    lowerQuery.includes("pc") ||
    lowerQuery.includes("console")
  ) {
    return [
      "gaming",
      "pcgaming",
      "Games",
      "gamingsuggestions",
      "patientgamers",
    ];
  }

  // Career and work
  if (
    lowerQuery.includes("job") ||
    lowerQuery.includes("career") ||
    lowerQuery.includes("work") ||
    lowerQuery.includes("interview")
  ) {
    return [
      "jobs",
      "careerguidance",
      "cscareerquestions",
      "ITCareerQuestions",
      "careerchange",
    ];
  }

  // Health and fitness
  if (
    lowerQuery.includes("fitness") ||
    lowerQuery.includes("health") ||
    lowerQuery.includes("diet") ||
    lowerQuery.includes("workout")
  ) {
    return ["fitness", "health", "loseit", "gainit", "nutrition"];
  }

  // Relationships and advice
  if (
    lowerQuery.includes("relationship") ||
    lowerQuery.includes("dating") ||
    lowerQuery.includes("advice")
  ) {
    return ["relationship_advice", "dating_advice", "relationships", "dating"];
  }

  // Finance and investing
  if (
    lowerQuery.includes("invest") ||
    lowerQuery.includes("money") ||
    lowerQuery.includes("financial") ||
    lowerQuery.includes("crypto")
  ) {
    return [
      "investing",
      "personalfinance",
      "financialindependence",
      "stocks",
      "CryptoCurrency",
    ];
  }

  // General discussion subreddits
  return [
    "AskReddit",
    "discussion",
    "TrueAskReddit",
    "NoStupidQuestions",
    "explainlikeimfive",
  ];
}
