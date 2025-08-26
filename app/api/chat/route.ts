import { NextRequest } from "next/server";
import { convertToModelMessages, streamText, stepCountIs } from "ai";
// import { mistral } from "@ai-sdk/mistral";
// import { openai } from "@ai-sdk/openai";
import { groq } from "@ai-sdk/groq";

// Import our custom tools
import { redditSearchTool } from "@/lib/tools/reddit-search-tool";
import { analyzeRedditDataTool } from "@/lib/tools/analyze-reddit-tool";
import { generateChartTool } from "@/lib/tools/generate-chart-tool";
import { prepareForVisualizationTool } from "@/lib/tools/prepare-for-visualization-tool";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "No messages provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("🚀 Starting AI-powered Reddit analysis with tools...");

    // Create the AI stream with our custom tools
    const result = streamText({
      //   model: openai("gpt-4o-2024-11-20"),
      model: groq("moonshotai/kimi-k2-instruct"),
      messages: convertToModelMessages(messages),
      tools: {
        searchReddit: redditSearchTool,
        analyzeRedditData: analyzeRedditDataTool,
        generateChart: generateChartTool,
        prepareForVisualization: prepareForVisualizationTool,
      },
      system: `You are RedditDig, an AI assistant specialized in Reddit research and analysis. You have access to tools that let you:

1. **searchReddit**: Search Reddit for posts and discussions
2. **analyzeRedditData**: Analyze posts for sentiment, opinions, and insights (focus on high-quality analysis)
3. **prepareForVisualization**: Prepare analysis data for visualization by ensuring proper structure and format
4. **generateChart**: Create visualizations from analysis summaries (opinions, sentiments, subreddit analysis)

## Workflow:
1. Use searchReddit to find relevant posts (max 3)
2. Use analyzeRedditData ONCE on the results (focus on high-quality analysis)
3. If data structure is not correct for visualization, use prepareForVisualization to fix it
4. Use generateChart with ALL required parameters (directly from analysis summaries)

## Critical Rules:
- NEVER call generateChart before analyzeRedditData
- If analyzeRedditData fails, report the error and do not proceed to visualization steps
- If generateChart fails due to data structure issues, use prepareForVisualization first
- ALWAYS provide ALL required parameters for each tool
- Always explain what you're doing at each step
- Always provide a final summary about the query after all tools complete

## Rules:
- NEVER call the same tool multiple times unless requested
- ALWAYS provide ALL required parameters for each tool
- ALWAYS explain what you're doing
- ALWAYS provide a final summary after all tools complete

## Tool Usage:
### searchReddit
- query, subreddits[], sortBy, timeFilter, limit

### analyzeRedditData
- posts, analysisType: "comprehensive", focusArea

### prepareForVisualization
- data: raw analysis data to prepare
- dataType: "sentiment", "opinions", "subreddit", or "trends"
- chartType: "pie", "bar", "line", "scatter", or "area"

### generateChart
- chartType: "pie", "bar"
- title: descriptive title
- data: analysis results (opinions, sentiments, subreddit analysis)
- For bar charts: Uses opinion data or subreddit analysis
- For pie charts: Uses sentiment data or opinion distributions
- For line charts: Uses trend data
- When generating bar charts for opinions, ALWAYS include percentage data based on opinion counts
- Calculate percentages as (opinion count / total opinion count) * 100
- Display percentages in the chart and tooltips

## Final Summary:
- After all tools complete, provide a summary explaining findings and insights
- The summary should be conversational and appear after all tool outputs
`,

      stopWhen: stepCountIs(10),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process request",
        details: (error as Error).message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
