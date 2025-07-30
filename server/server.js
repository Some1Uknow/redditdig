require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { generateText } = require("ai");
const { mistral } = require("@ai-sdk/mistral");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

async function scrapeRedditPosts(keywords, limit = 5) {
  try {
    console.log(`Scraping Reddit for: "${keywords}"...`);
    // Step 1: Find the most relevant posts from the search page
    const searchUrl = `https://www.reddit.com/search.json`;
    const searchResponse = await axios.get(searchUrl, {
      params: { q: keywords, limit, sort: 'relevance' },
      headers: { 'User-Agent': 'Reddit-Insight-App/1.1' },
    });

    const initialPosts = searchResponse.data.data.children;

    // Step 2: Fetch the full content for each post in parallel
    const detailedPostPromises = initialPosts.map(post =>
      axios.get(`https://www.reddit.com${post.data.permalink}.json`, {
        headers: { 'User-Agent': 'Reddit-Insight-App/1.1' },
      })
    );

    const detailedPostResponses = await Promise.all(detailedPostPromises);

    // Step 3: Process the detailed data to extract full content
    const posts = detailedPostResponses.map(response => {
      const postData = response.data[0].data.children[0].data;
      const commentsData = response.data[1].data.children;

      // Extract the top 3 comments (if they exist)
      const topComments = commentsData
        .slice(0, 3)
        .map((comment, i) => `Comment ${i + 1}: ${comment.data.body}`)
        .join('\n');

      // Combine the post body and top comments into one context field
      const fullContent = `${postData.selftext || 'No post body.'}\n\nTop Comments:\n${topComments || 'No comments.'}`;

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
    console.error('Scraping Error:', error.message);
    return [];
  }
}

app.post("/api/summarize", async (req, res) => {
  const { messages } = req.body;
  const lastUserMessage = messages[messages.length - 1];
  const keywords = lastUserMessage?.content;

  if (!keywords) {
    return res.status(400).json({ error: "No query provided" });
  }

  try {
    const posts = await scrapeRedditPosts(keywords, 5);

    // --- THIS IS THE MAIN CHANGE ---
    // We now build the context using the new 'fullContent' field
    const context = posts
      .map(
        (post, index) =>
          `Source [${index + 1}]:\nSubreddit: r/${post.subreddit}\nTitle: ${
            post.title
          }\nContent and Top Comments:\n${post.fullContent} Post URL:\n${
            post.url
          }`
      )
      .join("\n\n---\n\n");

    const prompt = `You are a Reddit research analyst. Based *only* on the provided Reddit posts, including their main content and top comments, generate a comprehensive and neutral summary.
    
    Instructions:
    1.  Start with a direct, insightful summary paragraph that captures the main themes and sentiments.
    2.  Follow with a bulleted list of the most important specific points, findings, or opinions discussed.
    3.  You **must** cite your information using the format [Source X] at the end of each point.
    
    Here is the research material:
    ${context}
    
    Provide your detailed analysis now:`;

    const { text } = await generateText({
      model: mistral("ministral-8b-2410"),
      prompt: prompt,
    });

    res.json({
      summary: text,
      sources: posts, // The sources object still has title, url, etc. for the frontend
    });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "Failed to generate summary." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
