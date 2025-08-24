import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { generateText } from "ai";
import { mistral } from "@ai-sdk/mistral";
import axiosRetry from "axios-retry"; // Install via npm i axios-retry

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

async function generateRedditSearchQuery(conversation: string) {
  const prompt = `Based on the following conversation history, generate a simple Reddit search query using basic keywords.

Guidelines:
- Use simple keywords and phrases (no complex operators like AND, OR, NOT)
- Focus on the main topic the user is asking about
- Include relevant product names, brands, or specific terms
- Keep it simple - Reddit search works better with basic terms
- Maximum 10 words
- Output ONLY the search query string, nothing else

Conversation history:
${conversation}`;

  const { text: query } = await generateText({
    model: mistral("mistral-small-latest"),
    prompt,
  });

  // Clean and simplify the query
  let cleanedQuery = query.trim()
    .replace(/[`"']/g, '') // Remove quotes and backticks
    .replace(/\s+/g, ' ') // Normalize spaces
    .replace(/\b(AND|OR|NOT)\b/gi, '') // Remove boolean operators
    .replace(/[()]/g, '') // Remove parentheses
    .replace(/title:|subreddit:|selftext:|author:|timestamp:/gi, '') // Remove search operators
    .trim();

  // Fallback: if model output is invalid, use simple keyword extraction
  if (!cleanedQuery || cleanedQuery.length < 3) {
    cleanedQuery = conversation
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .slice(0, 5) // Limit to 5 words
      .join(" ");
  }

  return cleanedQuery;
}

async function scrapeRedditPosts(searchQuery: string, limit = 5) {
  try {
    console.log(`Scraping Reddit with query: "${searchQuery}"...`);
    
    // Step 1: Try multiple search approaches
    const searchApproaches = [
      // Approach 1: General search
      {
        url: "https://www.reddit.com/search.json",
        params: { q: searchQuery, limit: limit * 3, sort: "relevance", type: "link" }
      },
      // Approach 2: Search in specific subreddits if the query seems to be about tech/products
      ...(searchQuery.toLowerCase().includes('macbook') || searchQuery.toLowerCase().includes('laptop') || searchQuery.toLowerCase().includes('computer') ? 
        [
          {
            url: "https://www.reddit.com/r/Apple/search.json",
            params: { q: searchQuery, restrict_sr: "on", limit: limit * 2, sort: "relevance", type: "link" }
          },
          {
            url: "https://www.reddit.com/r/mac/search.json", 
            params: { q: searchQuery, restrict_sr: "on", limit: limit * 2, sort: "relevance", type: "link" }
          }
        ] : [])
    ];

    let allPosts: any[] = [];
    
    for (const approach of searchApproaches) {
      try {
        console.log(`Trying search approach: ${approach.url}`);
        const searchResponse = await axios.get(approach.url, {
          params: approach.params,
          headers: {
            "User-Agent": "Reddit-Insight-App/1.1 (contact: your.email@example.com)",
          },
        });

        const posts = searchResponse.data.data.children;
        console.log(`Found ${posts.length} posts from ${approach.url}`);
        allPosts.push(...posts);
        
        // Add delay between different search approaches
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (err) {
        console.error(`Error with search approach ${approach.url}:`, (err as Error).message);
      }
    }

    // Remove duplicates based on post id
    const uniquePosts = allPosts.filter((post, index, self) => 
      index === self.findIndex(p => p.data.id === post.data.id)
    );
    
    console.log(`Found ${uniquePosts.length} unique posts after deduplication`);

    if (uniquePosts.length === 0) {
      console.log("No posts found.");
      return [];
    }

    // Step 2: Filter and score posts for relevance
    const scoredPosts = uniquePosts
      .map(post => {
        let relevanceScore = 0;
        const title = post.data.title.toLowerCase();
        const subreddit = post.data.subreddit.toLowerCase();
        const queryWords = searchQuery.toLowerCase().split(' ');
        
        // Score based on title relevance
        queryWords.forEach(word => {
          if (word.length > 2 && title.includes(word)) {
            relevanceScore += 2;
          }
        });
        
        // Bonus for relevant subreddits
        const relevantSubs = ['apple', 'mac', 'macbook', 'laptops', 'suggestalaptop', 'buyitforlife'];
        if (relevantSubs.includes(subreddit)) {
          relevanceScore += 3;
        }
        
        // Bonus for engagement
        relevanceScore += Math.min(post.data.score / 10, 5);
        relevanceScore += Math.min(post.data.num_comments / 5, 3);
        
        return { ...post, relevanceScore };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit * 2); // Take top scored posts, more than needed in case some fail

    // Step 3: Fetch the full content for each post with delay to avoid rate limits
    const detailedPosts = [];
    let successCount = 0;
    
    for (const post of scoredPosts) {
      if (successCount >= limit) break;
      
      try {
        console.log(`Fetching post ${successCount + 1}/${limit}: ${post.data.title.substring(0, 50)}...`);
        const response = await axios.get(
          `https://www.reddit.com${post.data.permalink}.json`,
          {
            headers: {
              "User-Agent": "Reddit-Insight-App/1.1 (contact: your.email@example.com)",
            },
          }
        );
        const postData = response.data[0].data.children[0].data;
        const commentsData = response.data[1].data.children;

        // Extract top 5 comments (increased for better analysis)
        const topComments = commentsData
          .slice(0, 5)
          .filter((comment: any) => comment.data.body && comment.data.body !== '[deleted]' && comment.data.body !== '[removed]')
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

        // Delay 1-2 seconds between requests
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 + Math.random() * 1000)
        );
      } catch (err) {
        console.error(
          `Error fetching post ${post.data.id}:`,
          (err as Error).message
        );
        // Continue to next post on error
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
  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "No messages provided" },
        { status: 400 }
      );
    }

    // 1. Build full conversation history
    const conversation = messages
      .map(
        (m: { role: string; content: string }) =>
          `${m.role.toUpperCase()}: ${m.content}`
      )
      .join("\n\n");

    // 2. Generate advanced search query via Mistral
    const searchQuery = await generateRedditSearchQuery(conversation);
    console.log(`Conversation → Search Query: "${searchQuery}"`);

    // 3. Scrape using the generated query
    const posts = await scrapeRedditPosts(searchQuery, 5);
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
    });

    // 6. Generate advanced analysis
    const analysisPrompt = `You are an advanced data analyst. Analyze the Reddit data and output ONLY valid JSON with no markdown formatting.
    
    Analyze based on the content:
    - Identify main opinions/themes with counts
    - Perform sentiment analysis with exact counts and percentages
    - Detect potential biases
    - Analyze per subreddit
    
    Output format (JSON only, no backticks):
    {
      "opinions": [{"opinion": "Brief description", "count": 1, "examples": ["example"]}],
      "sentiments": {"positive": 0, "negative": 0, "neutral": 1, "total": 1, "percentages": {"positive": 0, "negative": 0, "neutral": 100}},
      "biases": "Description of biases",
      "subredditAnalysis": {"subredditName": {"summary": "Summary", "sentiments": {"positive": 0, "negative": 0, "neutral": 1, "total": 1, "percentages": {"positive": 0, "negative": 0, "neutral": 100}}, "opinions": [{"opinion": "opinion", "count": 1}]}}
    }
    
    Data: ${context}`;

    const { text: analysisText } = await generateText({
      model: mistral("ministral-8b-latest"),
      prompt: analysisPrompt,
    });

    let analysis;
    try {
      // Clean potential markdown fences from the AI's output
      let cleanedJsonString = analysisText.trim();
      
      // Remove markdown code fences
      cleanedJsonString = cleanedJsonString
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/, "")
        .replace(/```\s*$/g, "")
        .trim();
      
      console.log("Cleaned JSON string length:", cleanedJsonString.length);
      analysis = JSON.parse(cleanedJsonString);
      console.log("Successfully parsed analysis JSON");
    } catch (err) {
      console.error("Analysis JSON parse error:", err);
      console.error("Original text that failed parsing:", analysisText.substring(0, 500) + "..."); // Log first 500 chars
      analysis = { 
        error: "Failed to parse analysis.",
        opinions: [],
        sentiments: { positive: 0, negative: 0, neutral: 0, total: 0, percentages: { positive: 0, negative: 0, neutral: 0 } },
        biases: "Analysis parsing failed",
        subredditAnalysis: {}
      };
    }

    // 7. Prepare chart data (extract from analysis for frontend rendering)
    const chartData = {
      sentimentPie: analysis.sentiments && analysis.sentiments.percentages
        ? [
            {
              name: "Positive",
              value: analysis.sentiments.percentages.positive || 0,
            },
            {
              name: "Negative", 
              value: analysis.sentiments.percentages.negative || 0,
            },
            { name: "Neutral", value: analysis.sentiments.percentages.neutral || 0 },
          ].filter((item: {name: string, value: number}) => item.value > 0) // Only include non-zero values
        : [],
      opinionBar: analysis.opinions && Array.isArray(analysis.opinions)
        ? analysis.opinions.map((op: any) => ({
            name: op.opinion || "Unknown",
            value: op.count || 0,
          })).filter((item: {name: string, value: number}) => item.value > 0) // Only include non-zero values
        : [],
      // Add more as needed, e.g., per subreddit
    };

    console.log("Chart data prepared:", {
      sentimentPieCount: chartData.sentimentPie.length,
      opinionBarCount: chartData.opinionBar.length
    });

    return NextResponse.json({
      summary,
      analysis,
      chartData,
      sources: posts,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate response." },
      { status: 500 }
    );
  }
}
