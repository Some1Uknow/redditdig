import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { generateText } from 'ai';
import { mistral } from '@ai-sdk/mistral';

async function normalizeWithMistral(rawQuery: string) {
  const prompt = `Rewrite the following user search query into a concise, keyword-only format suitable for Reddit search.
- Remove all filler words and question structure.
- Keep only essential nouns and modifiers.
- Do NOT output a sentence.
- Return lowercase, space-separated keywords only.`;

  const { text: normalized } = await generateText({
    model: mistral("mistral-small-latest"),
    prompt: `${prompt} + \n Query - ${rawQuery}`,
  });

  // fallback if the model gives you garbage
  if (!normalized || normalized.split(/\s+/).length < 2) {
    return rawQuery
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .join(" ");
  }

  return normalized.trim();
}

async function scrapeRedditPosts(keywords: string, limit = 5) {
  try {
    console.log(`Scraping Reddit for: "${keywords}"...`);
    // Step 1: Find the most relevant posts from the search page
    const searchUrl = `https://www.reddit.com/search.json`;
    const searchResponse = await axios.get(searchUrl, {
      params: { q: keywords, limit, sort: "relevance" },
      headers: { "User-Agent": "Reddit-Insight-App/1.1" },
    });

    const initialPosts = searchResponse.data.data.children;

    // Step 2: Fetch the full content for each post in parallel
    const detailedPostPromises = initialPosts.map((post: any) =>
      axios.get(`https://www.reddit.com${post.data.permalink}.json`, {
        headers: { "User-Agent": "Reddit-Insight-App/1.1" },
      })
    );

    const detailedPostResponses = await Promise.all(detailedPostPromises);

    // Step 3: Process the detailed data to extract full content
    const posts = detailedPostResponses.map((response) => {
      const postData = response.data[0].data.children[0].data;
      const commentsData = response.data[1].data.children;

      // Extract the top 3 comments (if they exist)
      const topComments = commentsData
        .slice(0, 3)
        .map((comment: any, i: number) => `Comment ${i + 1}: ${comment.data.body}`)
        .join("\n");

      // Combine the post body and top comments into one context field
      const fullContent = `${
        postData.selftext || "No post body."
      }\n\nTop Comments:\n${topComments || "No comments."}`;

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
      };
    });

    return posts;
  } catch (error) {
    console.error("Scraping Error:", (error as Error).message);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body;
    const lastUserMessage = messages[messages.length - 1];
    const rawQuery = lastUserMessage?.content;

    if (!rawQuery) {
      return NextResponse.json({ error: "No query provided" }, { status: 400 });
    }

    // 1. Normalize the query via MistralAI
    const normalizedQuery = await normalizeWithMistral(rawQuery);
    console.log(`Raw: "${rawQuery}" → Normalized: "${normalizedQuery}"`);

    // 2. Now scrape using the keyword-style query
    const posts = await scrapeRedditPosts(normalizedQuery, 5);

    // Build the context using the new 'fullContent' field
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

    const prompt = `You are a Reddit research analyst. Based *only* on the provided Reddit posts, including their main content and top comments, generate a comprehensive and neutral summary.
    
    Instructions:
    1.  Start with a direct, insightful summary paragraph that captures the main themes and sentiments.
    2.  Follow with a bulleted list of the most important specific points, findings, or opinions discussed.
    3.  You **must** cite your information using the format [Source X] at the end of each point.
    4.  Ensure all URLs are properly formatted and clickable, post should be in markdown format strictly.
    
    Here is the research material:
    ${context}
    
    Provide your detailed analysis now:`;

    const { text } = await generateText({
      model: mistral("ministral-8b-latest"),
      prompt: prompt,
    });

    return NextResponse.json({
      summary: text,
      sources: posts,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary." },
      { status: 500 }
    );
  }
}