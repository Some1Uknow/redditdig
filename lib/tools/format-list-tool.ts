import { tool } from "ai";
import { z } from "zod";

export const formatAsListTool = tool({
  description: `Format data as structured lists with various formatting options.
  This tool converts Reddit analysis data, opinions, or any structured data into well-formatted lists.
  Use this when users ask for lists, summaries, or want data presented in list format.`,
  inputSchema: z.object({
    data: z.any().describe("The data to format as a list"),
    // Make listType and category optional with sensible defaults so calls that omit them don't fail validation
    listType: z
      .enum(["numbered", "bullet", "detailed", "summary", "ranking"])
      .default("summary")
      .describe("Type of list formatting"),
    category: z
      .enum(["opinions", "subreddits", "insights", "posts", "comments", "general"])
      .default("general")
      .describe("Category of data being formatted"),
    maxItems: z.number().min(1).max(50).default(10).describe("Maximum number of items to include"),
    includeDetails: z.boolean().default(true).describe("Whether to include additional details for each item"),
    sortBy: z.enum(["relevance", "score", "count", "alphabetical"]).default("relevance").describe("How to sort the list items"),
  }),
  execute: async ({ data, listType, category, maxItems, includeDetails, sortBy }) => {
    try {
      console.log(`📋 Formatting ${category} data as ${listType} list...`);

      let items: any[] = [];
      let listTitle = "";

      // Extract relevant data based on category
      if (category === "opinions" && data.opinions) {
        items = data.opinions;
        listTitle = "Key Opinions and Viewpoints";
      } else if (category === "subreddits" && data.subredditAnalysis) {
        items = Object.entries(data.subredditAnalysis).map(([name, analysis]: [string, any]) => ({
          name: `r/${name}`,
          summary: analysis.summary,
          total: analysis.sentiments?.total || 0,
          positive: analysis.sentiments?.positive || 0,
          negative: analysis.sentiments?.negative || 0,
          dominantOpinions: analysis.dominantOpinions || []
        }));
        listTitle = "Community Analysis by Subreddit";
      } else if (category === "insights" && data.keyInsights) {
        items = data.keyInsights.map((insight: string, index: number) => ({
          insight,
          priority: index + 1
        }));
        listTitle = "Key Insights and Findings";
      } else if (category === "posts" && Array.isArray(data)) {
        items = data;
        listTitle = "Reddit Posts Summary";
      } else if (data.posts && Array.isArray(data.posts)) {
        items = data.posts;
        listTitle = "Reddit Posts Summary";
      } else {
        // Try to extract any array-like data
        if (Array.isArray(data)) {
          items = data;
        } else if (typeof data === 'object') {
          items = Object.entries(data).map(([key, value]) => ({ name: key, data: value }));
        }
        listTitle = "Data Summary";
      }

      // Sort items based on sortBy parameter
      if (sortBy === "score" && items[0]?.score !== undefined) {
        items.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
      } else if (sortBy === "count" && (items[0]?.count !== undefined || items[0]?.total !== undefined)) {
        items.sort((a: any, b: any) => (b.count || b.total || 0) - (a.count || a.total || 0));
      } else if (sortBy === "alphabetical") {
        items.sort((a: any, b: any) => {
          const nameA = a.name || a.title || a.opinion || a.insight || "";
          const nameB = b.name || b.title || b.opinion || b.insight || "";
          return nameA.localeCompare(nameB);
        });
      }
      // Default is relevance (keep original order or existing sort)

      // Limit items
      items = items.slice(0, maxItems);

      // Format the list based on type
      let formattedList = "";

      if (listType === "numbered") {
        formattedList = items
          .map((item: any, index: number) => {
            const number = index + 1;
            return formatListItem(item, category, includeDetails, number);
          })
          .join('\n\n');
      } else if (listType === "bullet") {
        formattedList = items
          .map((item: any) => formatListItem(item, category, includeDetails, '•'))
          .join('\n\n');
      } else if (listType === "detailed") {
        formattedList = items
          .map((item: any, index: number) => {
            const header = `### ${index + 1}. ${getItemTitle(item, category)}`;
            const details = formatDetailedItem(item, category);
            return `${header}\n${details}`;
          })
          .join('\n\n---\n\n');
      } else if (listType === "summary") {
        formattedList = items
          .map((item: any, index: number) => 
            `${index + 1}. **${getItemTitle(item, category)}** - ${getItemSummary(item, category)}`
          )
          .join('\n');
      } else if (listType === "ranking") {
        formattedList = items
          .map((item: any, index: number) => {
            const rank = index + 1;
            const title = getItemTitle(item, category);
            const score = getItemScore(item, category);
            return `**#${rank}** ${title}${score ? ` (${score})` : ''}`;
          })
          .join('\n');
      }

      // Create final formatted output
      const output = `# ${listTitle}\n\n${formattedList}`;

      const result = {
        success: true,
        message: `Formatted ${items.length} items as ${listType} list`,
        formattedList: output,
        metadata: {
          listType,
          category,
          itemCount: items.length,
          totalAvailable: Array.isArray(data) ? data.length : (data.opinions?.length || data.posts?.length || Object.keys(data).length),
          sortedBy: sortBy,
          includesDetails: includeDetails,
          timestamp: new Date().toISOString()
        }
      };

      console.log(`✅ Created ${listType} list with ${items.length} items`);
      return result;

    } catch (error) {
      console.error("List formatting error:", error);
      return {
        success: false,
        message: `Failed to format list: ${(error as Error).message}`,
        formattedList: ""
      };
    }
  },
});

// Helper functions for formatting
function getItemTitle(item: any, category: string): string {
  if (category === "opinions") return item.opinion || "Unknown Opinion";
  if (category === "subreddits") return item.name || "Unknown Subreddit";
  if (category === "insights") return item.insight || "Unknown Insight";
  if (category === "posts") return item.title || "Untitled Post";
  return item.name || item.title || item.opinion || "Unknown Item";
}

function getItemSummary(item: any, category: string): string {
  if (category === "opinions") return `Mentioned ${item.count || 0} times`;
  if (category === "subreddits") return item.summary || "Community analysis";
  if (category === "insights") return `Priority ${item.priority || 'unknown'}`;
  if (category === "posts") return `${item.score || 0} points, ${item.num_comments || 0} comments`;
  return "Summary unavailable";
}

function getItemScore(item: any, category: string): string | null {
  if (category === "opinions" && item.count) return `${item.count} mentions`;
  if (category === "subreddits" && item.total) return `${item.total} posts`;
  if (category === "posts" && item.score) return `${item.score} points`;
  return null;
}

function formatListItem(item: any, category: string, includeDetails: boolean, prefix: number | string): string {
  const title = getItemTitle(item, category);
  let formatted = `${prefix}. **${title}**`;

  if (includeDetails) {
    if (category === "opinions") {
      formatted += `\n   - Mentioned ${item.count || 0} times`;
      if (item.confidence) formatted += ` (Confidence: ${item.confidence}/5)`;
      if (item.examples && item.examples.length > 0) {
        formatted += `\n   - Examples: "${item.examples[0]}"${item.examples.length > 1 ? ` and ${item.examples.length - 1} more` : ''}`;
      }
    } else if (category === "subreddits") {
      formatted += `\n   - ${item.summary || 'No summary available'}`;
      formatted += `\n   - Activity: ${item.total || 0} posts (${item.positive || 0} positive, ${item.negative || 0} negative)`;
    } else if (category === "posts") {
      formatted += `\n   - Score: ${item.score || 0} points, ${item.num_comments || 0} comments`;
      formatted += `\n   - Posted in r/${item.subreddit || 'unknown'} by u/${item.author || 'unknown'}`;
      if (item.selftext && item.selftext.length > 100) {
        formatted += `\n   - Preview: ${item.selftext.substring(0, 100)}...`;
      }
    }
  }

  return formatted;
}

function formatDetailedItem(item: any, category: string): string {
  if (category === "opinions") {
    let detailed = `**Frequency:** ${item.count || 0} mentions\n`;
    if (item.confidence) detailed += `**Confidence:** ${item.confidence}/5\n`;
    if (item.examples && item.examples.length > 0) {
      detailed += `**Examples:**\n${item.examples.slice(0, 3).map((ex: string) => `- "${ex}"`).join('\n')}`;
      if (item.examples.length > 3) detailed += `\n- ...and ${item.examples.length - 3} more examples`;
    }
    return detailed;
  } else if (category === "subreddits") {
    let detailed = `**Summary:** ${item.summary || 'No summary available'}\n`;
    detailed += `**Activity:** ${item.total || 0} total posts\n`;
    detailed += `**Sentiment Breakdown:**\n`;
    detailed += `- Positive: ${item.positive || 0} posts\n`;
    detailed += `- Negative: ${item.negative || 0} posts\n`;
    detailed += `- Neutral: ${(item.total || 0) - (item.positive || 0) - (item.negative || 0)} posts`;
    return detailed;
  } else if (category === "posts") {
    let detailed = `**Author:** u/${item.author || 'unknown'}\n`;
    detailed += `**Subreddit:** r/${item.subreddit || 'unknown'}\n`;
    detailed += `**Engagement:** ${item.score || 0} points, ${item.num_comments || 0} comments\n`;
    if (item.selftext) {
      detailed += `**Content:** ${item.selftext.length > 200 ? item.selftext.substring(0, 200) + '...' : item.selftext}`;
    }
    return detailed;
  }
  return "Details not available for this item type.";
}
