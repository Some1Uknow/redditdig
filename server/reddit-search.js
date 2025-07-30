#!/usr/bin/env node
const axios = require('axios');

const args = process.argv.slice(2);
const options = {};

for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace('--', '');
  const value = args[i + 1];
  if (key && value) options[key] = value;
}

async function scrapeRedditPosts(keywords, limit = 10) {
  try {
    console.error(`Scraping Reddit for: "${keywords}"...`);
    const searchUrl = `https://www.reddit.com/search.json`;
    const response = await axios.get(searchUrl, {
      params: { q: keywords, limit },
      headers: { 'User-Agent': 'Reddit-Summarizer-App/1.0' },
    });

    const posts = response.data.data.children;
    return posts.map(post => ({
      id: post.data.id,
      title: post.data.title,
      author: post.data.author,
      subreddit: post.data.subreddit,
      score: post.data.score,
      num_comments: post.data.num_comments,
      selftext: post.data.selftext,
      url: `https://www.reddit.com${post.data.permalink}`,
      created_utc: post.data.created_utc,
    }));
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
  // This is the only console.log that prints the final valid JSON to standard output.
  console.log(JSON.stringify({ posts: results }));
}

main();