#!/usr/bin/env node
const axios = require('axios');

const args = process.argv.slice(2);
const options = {};

for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace('--', '');
  const value = args[i + 1];
  if (key && value) options[key] = value;
}

async function scrapeRedditPosts(keywords, limit = 5) { // Limiting to 5 for better performance and context quality
  try {
    console.error(`Scraping Reddit for: "${keywords}"...`);
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
        fullContent: fullContent, // The new, rich context field
      };
    });

    return posts;
  } catch (error) {
    console.error('Scraping Error:', error.message);
    return [];
  }
}

async function main() {
  const { keywords, limit } = options;
  if (!keywords) {
    console.error(JSON.stringify({ error: 'Keywords are required.' }));
    process.exit(1);
  }

  const results = await scrapeRedditPosts(keywords, limit);
  console.log(JSON.stringify({ posts: results }));
}

main();