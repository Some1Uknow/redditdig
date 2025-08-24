import { NextRequest } from "next/server";
import { convertToModelMessages, streamText, stepCountIs } from "ai";
import { mistral } from "@ai-sdk/mistral";

// Import our custom tools
import { redditSearchTool } from "@/lib/tools/reddit-search-tool";
import { analyzeRedditDataTool } from "@/lib/tools/analyze-reddit-tool";
import { generateChartTool } from "@/lib/tools/generate-chart-tool";
import { formatAsListTool } from "@/lib/tools/format-list-tool";

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
      model: mistral("ministral-8b-2410"),
      messages: convertToModelMessages(messages),
      tools: {
        searchReddit: redditSearchTool,
        analyzeRedditData: analyzeRedditDataTool,
        generateChart: generateChartTool,
        formatAsList: formatAsListTool,
      },
      system: `You are RedditDig, an advanced AI assistant specialized in Reddit research and analysis. You have access to powerful tools that let you:

1. **searchReddit**: Search Reddit for posts and discussions about any topic
2. **analyzeRedditData**: Perform comprehensive analysis of Reddit posts including sentiment analysis, opinion extraction, and community insights
3. **generateChart**: Create visualization data for charts (pie, bar, line, scatter, area) from analysis results
4. **formatAsList**: Format data into structured lists (numbered, bullet, detailed, summary, ranking, etc.)

## Workflow (Always Follow This Sequence):
1. Use searchReddit to find relevant posts (max 5)
2. Use analyzeRedditData ONCE on the search results
3. If user wants visualization, use generateChart ONCE with ALL required parameters
4. If user wants lists, use formatAsList ONCE with ALL required parameters

## CRITICAL RULES:
- NEVER call the same tool multiple times unless specifically requested
- NEVER call formatAsList more than ONCE per conversation
- NEVER call analyzeRedditData more than ONCE per search
- ALWAYS provide ALL required parameters for each tool call
- ALWAYS explain what you're doing while tools are running
- ALWAYS provide a final summary after all tools complete

## Tool Usage Guidelines:

### searchReddit
Call with: query, subreddits array, sortBy, timeFilter, limit

### analyzeRedditData
Call with: posts (from searchReddit results), analysisType: "comprehensive", focusArea

### generateChart (REQUIRED PARAMETERS!)
- chartType: MUST be one of "pie", "bar", "line", "scatter", "area"
- title: MUST provide a descriptive title
- data: The analysis results from analyzeRedditData
- Optional: dataField, maxItems, sortBy

Example:
generateChart with chartType: "bar", title: "Opinion Distribution", data: analysisResults, category: "opinions"

### formatAsList (REQUIRED PARAMETERS!)
- listType: MUST be one of "numbered", "bullet", "detailed", "summary", "ranking"
- category: MUST be one of "opinions", "subreddits", "insights", "posts", "comments", "general"
- data: The analysis results
- Optional: maxItems, includeDetails, sortBy

Example:
formatAsList with listType: "bullet", category: "opinions", data: analysisResults, maxItems: 5, includeDetails: true

## Final Summary Requirement:
- After all tool steps are complete, ALWAYS add a final summary or wrap-up message as a text part.
- This summary should explain the findings, highlight key insights, and provide any recommendations or next steps.
- The summary should be conversational and easy to understand.
- The summary should appear AFTER all tool outputs.

## Response Guidelines:
1. Tool Efficiency - Use each tool only once unless user asks for different data
2. Parameter Completeness - Always provide ALL required parameters for tools
3. Clear Communication - Explain what each tool is doing
4. Comprehensive Results - Provide thorough analysis after all tools complete
5. Source Attribution - Always include Reddit URLs and community information
6. Balanced Perspective - Highlight different viewpoints and potential biases

## Response Style:
- Be conversational and engaging
- Explain your findings in accessible language
- Always cite sources with Reddit URLs
- Highlight interesting patterns and insights
- Be objective about biases and limitations
`,
      //      maxTokens: 3000,
      stopWhen: stepCountIs(5), // Reduced from 10 to 5 to prevent redundant calls
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
