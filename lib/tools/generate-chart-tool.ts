import { tool } from "ai";
import { z } from "zod";

export const generateChartTool = tool({
  description: `Generate chart data for visualizing Reddit analysis results.
  This tool converts analysis data into chart-ready formats for pie charts, bar charts, and other visualizations.
  Use this tool when you need to create visual representations of sentiment data, opinion distributions, or trends.`,
  inputSchema: z.object({
    data: z.any().describe("The data to convert into chart format"),
    chartType: z.enum(["pie", "bar", "line", "scatter", "area"]).describe("Type of chart to generate"),
    title: z.string().describe("Title for the chart"),
    dataField: z.string().optional().describe("Specific field in the data to chart (optional)"),
    maxItems: z.number().min(3).max(20).default(10).describe("Maximum number of items to include in chart"),
    sortBy: z.enum(["value", "name", "frequency"]).default("value").describe("How to sort the chart data"),
  }),
  execute: async ({ data, chartType, title, dataField, maxItems, sortBy }) => {
    try {
      console.log(`📊 Generating ${chartType} chart: "${title}"`);

      let chartData: any[] = [];

      // Handle different chart types and data structures
      if (chartType === "pie") {
        if (data.sentiments && data.sentiments.percentages) {
          // Sentiment pie chart
          chartData = [
            {
              name: "Positive",
              value: data.sentiments.percentages.positive || 0,
              count: data.sentiments.positive || 0,
              color: "#4CAF50"
            },
            {
              name: "Negative", 
              value: data.sentiments.percentages.negative || 0,
              count: data.sentiments.negative || 0,
              color: "#F44336"
            },
            {
              name: "Neutral",
              value: data.sentiments.percentages.neutral || 0,
              count: data.sentiments.neutral || 0,
              color: "#FFC107"
            },
          ].filter(item => item.value > 0);
        } else if (dataField && data[dataField]) {
          // Custom pie chart from specified field
          const fieldData = Array.isArray(data[dataField]) ? data[dataField] : Object.entries(data[dataField]);
          chartData = fieldData
            .slice(0, maxItems)
            .map((item: any, index: number) => ({
              name: item.name || item[0] || `Item ${index + 1}`,
              value: item.value || item.count || item[1] || 0,
              color: generateColor(index)
            }))
            .filter((item: any) => item.value > 0);
        }
      } else if (chartType === "bar") {
        if (data.opinions && Array.isArray(data.opinions)) {
          // Opinion bar chart
          chartData = data.opinions
            .sort((a: any, b: any) => {
              if (sortBy === "value") return (b.count || 0) - (a.count || 0);
              if (sortBy === "name") return (a.opinion || "").localeCompare(b.opinion || "");
              return (b.count || 0) - (a.count || 0);
            })
            .slice(0, maxItems)
            .map((op: any, index: number) => ({
              name: (op.opinion && op.opinion.length > 30) 
                ? op.opinion.substring(0, 30) + "..." 
                : op.opinion || "Unknown",
              fullName: op.opinion || "Unknown",
              value: op.count || 0,
              confidence: op.confidence || 3,
              color: generateColor(index),
              examples: op.examples || []
            }))
            .filter((item: any) => item.value > 0);
        } else if (data.subredditAnalysis) {
          // Subreddit comparison bar chart
          chartData = Object.entries(data.subredditAnalysis)
            .slice(0, maxItems)
            .map(([subreddit, analysis]: [string, any], index: number) => ({
              name: `r/${subreddit}`,
              value: analysis.sentiments?.total || 0,
              positive: analysis.sentiments?.positive || 0,
              negative: analysis.sentiments?.negative || 0,
              neutral: analysis.sentiments?.neutral || 0,
              color: generateColor(index)
            }))
            .filter((item: any) => item.value > 0);
        } else if (dataField && data[dataField]) {
          // Custom bar chart from specified field
          const fieldData = Array.isArray(data[dataField]) ? data[dataField] : Object.entries(data[dataField]);
          chartData = fieldData
            .slice(0, maxItems)
            .map((item: any, index: number) => ({
              name: item.name || item[0] || `Item ${index + 1}`,
              value: item.value || item.count || item[1] || 0,
              color: generateColor(index)
            }))
            .filter((item: any) => item.value > 0);
        }
      } else if (chartType === "line") {
        // Line chart for trends over time (if applicable)
        if (data.trends && Array.isArray(data.trends)) {
          chartData = data.trends.map((trend: any, index: number) => ({
            name: trend.period || `Period ${index + 1}`,
            value: trend.value || trend.count || 0,
            color: generateColor(index)
          }));
        } else {
          // Convert other data to line format
          chartData = [
            { name: "Positive", value: data.sentiments?.positive || 0, color: "#4CAF50" },
            { name: "Negative", value: data.sentiments?.negative || 0, color: "#F44336" },
            { name: "Neutral", value: data.sentiments?.neutral || 0, color: "#FFC107" },
          ];
        }
      }

      // Sort the data if requested
      if (sortBy === "value") {
        chartData.sort((a: any, b: any) => (b.value || 0) - (a.value || 0));
      } else if (sortBy === "name") {
        chartData.sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
      }

      // Limit to maxItems
      chartData = chartData.slice(0, maxItems);

      // Generate additional metadata
      const totalValue = chartData.reduce((sum: number, item: any) => sum + (item.value || 0), 0);
      const avgValue = chartData.length > 0 ? totalValue / chartData.length : 0;

      const result = {
        success: true,
        message: `Generated ${chartType} chart with ${chartData.length} data points`,
        chartConfig: {
          type: chartType,
          title,
          dataField,
          sortBy,
          maxItems
        },
        chartData,
        metadata: {
          totalItems: chartData.length,
          totalValue,
          averageValue: Math.round(avgValue * 100) / 100,
          timestamp: new Date().toISOString()
        }
      };

      console.log(`✅ Generated ${chartType} chart with ${chartData.length} items (total value: ${totalValue})`);
      return result;

    } catch (error) {
      console.error("Chart generation error:", error);
      return {
        success: false,
        message: `Failed to generate chart: ${(error as Error).message}`,
        chartData: []
      };
    }
  },
});

// Helper function to generate consistent colors
function generateColor(index: number): string {
  const colors = [
    "#4CAF50", "#F44336", "#FFC107", "#2196F3", "#9C27B0",
    "#FF9800", "#795548", "#607D8B", "#E91E63", "#3F51B5",
    "#009688", "#8BC34A", "#FFEB3B", "#FF5722", "#673AB7"
  ];
  return colors[index % colors.length];
}
