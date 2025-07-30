require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { spawn } = require("child_process");
const { generateText } = require("ai");
const { mistral } = require("@ai-sdk/mistral");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post("/api/summarize", async (req, res) => {
  const { messages } = req.body;
  const lastUserMessage = messages[messages.length - 1];
  const keywords = lastUserMessage?.content;

  if (!keywords) {
    return res.status(400).json({ error: "No query provided" });
  }

  try {
    const scraperPromise = new Promise((resolve, reject) => {
      const args = ["--keywords", keywords, "--limit", "5"]; // Using limit 5 for better results
      const process = spawn("node", [
        path.join(__dirname, "reddit-search.js"),
        ...args,
      ]);
      let stdout = "",
        stderr = "";
      process.stdout.on("data", (data) => (stdout += data));
      process.stderr.on("data", (data) => (stderr += data));
      process.on("close", (code) => {
        if (code !== 0) return reject(new Error(`Scraper failed: ${stderr}`));
        try {
          resolve(JSON.parse(stdout));
        } catch (e) {
          reject(new Error("Failed to parse scraper JSON."));
        }
      });
    });

    const { posts } = await scraperPromise;

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
