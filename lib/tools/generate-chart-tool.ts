import { tool } from "ai";
import { z } from "zod";

export const generateChartTool = tool({
  description: `Generate chart data for visualizing Reddit analysis results.
  This tool converts analysis data into chart-ready formats for pie charts, bar charts, and other visualizations.
  Use this tool when you need to create visual representations of sentiment data, opinion distributions, or trends.`,
  inputSchema: z.object({
    data: z.any().describe("The data to convert into chart format"),
    chartType: z
      .enum(["pie", "bar", "line", "scatter", "area"])
      .describe("Type of chart to generate"),
    title: z.string().describe("Title for the chart"),
    dataField: z
      .string()
      .optional()
      .describe("Specific field in the data to chart (optional)"),
    maxItems: z
      .number()
      .min(3)
      .max(20)
      .default(10)
      .describe("Maximum number of items to include in chart"),
    sortBy: z
      .enum(["value", "name", "frequency"])
      .default("value")
      .describe("How to sort the chart data"),
  }),
  execute: async ({ data, chartType, title, dataField, maxItems, sortBy }) => {
    try {
      console.log(`📊 Generating ${chartType} chart: "${title}"`);

      // Validate input data
      if (!data) {
        return {
          success: false,
          message: "No data provided for chart generation",
          chartData: [],
        };
      }

      // Initialize chart data
      let chartData: any[] = [];

      // Handle raw analysis data (no preparation step needed)
      // Ensure data has required structure
      const processedData = { ...data };
      
      // Ensure sentiments have percentages
      if (processedData.sentiments && processedData.sentiments.total > 0 && (!processedData.sentiments.percentages || Object.keys(processedData.sentiments.percentages).length === 0)) {
        processedData.sentiments.percentages = {
          positive: Math.round((processedData.sentiments.positive / processedData.sentiments.total) * 100),
          negative: Math.round((processedData.sentiments.negative / processedData.sentiments.total) * 100),
          neutral: Math.round((processedData.sentiments.neutral / processedData.sentiments.total) * 100)
        };
      }

      // Handle different chart types with visualization-ready data
      if (chartType === "bar" || chartType === "pie") {
        // Enhanced data extraction to handle multiple data formats
        let sourceData = null;
        let dataType = "";

        // Try to find opinion data
        if (data.opinions && Array.isArray(data.opinions) && data.opinions.length > 0) {
          sourceData = data.opinions;
          dataType = "opinions";
        } 
        // Try to find sentiment data in various formats
        else if (data.sentiments || (data.positive !== undefined || data.negative !== undefined || data.neutral !== undefined)) {
          // Handle both nested and flat sentiment structures
          const sentiments = data.sentiments || data;
          const hasPercentages = sentiments.percentages && (sentiments.percentages.positive !== undefined || sentiments.percentages.negative !== undefined || sentiments.percentages.neutral !== undefined);
          
          sourceData = [
            { name: "Positive", value: hasPercentages ? sentiments.percentages.positive : sentiments.positive || 0, count: sentiments.positive || 0 },
            { name: "Negative", value: hasPercentages ? sentiments.percentages.negative : sentiments.negative || 0, count: sentiments.negative || 0 },
            { name: "Neutral", value: hasPercentages ? sentiments.percentages.neutral : sentiments.neutral || 0, count: sentiments.neutral || 0 }
          ];
          dataType = "sentiments";
        }
        // Try to find subreddit analysis data
        else if (data.subredditAnalysis) {
          sourceData = Object.entries(data.subredditAnalysis).map(([subreddit, analysis]: [string, any]) => ({
            name: `r/${subreddit}`,
            value: analysis.sentiments?.total || 0,
            positive: analysis.sentiments?.positive || 0,
            negative: analysis.sentiments?.negative || 0,
            neutral: analysis.sentiments?.neutral || 0
          }));
          dataType = "subredditAnalysis";
        }
        // Try to use any other data field specified
        else if (dataField && data[dataField]) {
          sourceData = data[dataField];
          dataType = dataField;
        }
        // Try to use the root data if it's an array
        else if (Array.isArray(data) && data.length > 0) {
          sourceData = data;
          dataType = "array";
        }

        // If we found valid source data, process it
        if (sourceData && sourceData.length > 0) {
          // Filter out zero values
          const validData = sourceData.filter((item: any) => (item.value || item.count || 0) > 0);
          
          if (validData.length > 0) {
            // Sort the data
            const sortedData = [...validData].sort((a: any, b: any) => {
              if (sortBy === "value") return (b.value || b.count || 0) - (a.value || a.count || 0);
              if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
              return (b.value || b.count || 0) - (a.value || a.count || 0);
            }).slice(0, maxItems);

            // Generate chart data
            chartData = sortedData.map((item: any, index: number) => {
              // Calculate percentage if we have count data
              const totalCount = sortedData.reduce((sum: number, i: any) => sum + (i.count || i.value || 0), 0);
              const value = item.value !== undefined ? item.value : (item.count || 0);
              const percentage = totalCount > 0 ? Math.round((value / totalCount) * 100) : 0;

              // Base chart item
              let chartItem: any = {
                name: item.name || item.opinion || item.subreddit || `Item ${index + 1}`,
                value: chartType === "pie" ? percentage : value,
                color: generateColor(index)
              };

              // Add additional properties based on data type and chart type
              if (dataType === "opinions") {
                chartItem.fullName = item.opinion || "Unknown";
                chartItem.confidence = item.confidence || 3;
                chartItem.examples = item.examples || [];
                chartItem.isEstimated = item.isEstimated || false;
                if (chartType === "bar") {
                  chartItem.percentage = percentage;
                }
              } else if (dataType === "sentiments") {
                chartItem.count = item.count || 0;
                if (chartType === "bar") {
                  chartItem.percentage = percentage;
                }
              } else if (dataType === "subredditAnalysis") {
                chartItem.value = value; // Keep actual count for bar charts
                if (chartType === "pie") {
                  chartItem.value = percentage; // Use percentage for pie charts
                }
                chartItem.positive = item.positive || 0;
                chartItem.negative = item.negative || 0;
                chartItem.neutral = item.neutral || 0;
              }

              return chartItem;
            });
          }
        }

        // If no chart data was generated, check for other data formats
        if (chartData.length === 0) {
          // Handle simple key-value objects (like the percentages object in the example)
          if (data && typeof data === 'object' && !Array.isArray(data)) {
            const entries = Object.entries(data).filter(([key, value]) => typeof value === 'number' && value > 0);
            if (entries.length > 0) {
              chartData = entries
                .sort(([aKey, aValue], [bKey, bValue]) => {
                  if (sortBy === "value") return (bValue as number) - (aValue as number);
                  if (sortBy === "name") return aKey.localeCompare(bKey);
                  return (bValue as number) - (aValue as number);
                })
                .slice(0, maxItems)
                .map(([key, value], index) => {
                  // Calculate percentage
                  const total = entries.reduce((sum, [k, v]) => sum + (v as number), 0);
                  const percentage = total > 0 ? Math.round(((value as number) / total) * 100) : 0;
                  
                  return {
                    name: key.charAt(0).toUpperCase() + key.slice(1),
                    value: chartType === "pie" ? percentage : (value as number),
                    color: generateColor(index)
                  };
                });
            }
          }
        }

        // Final validation
        if (chartData.length === 0) {
          const chartTypeMsg = chartType === "bar" ? 
            "No suitable data available for bar chart generation" : 
            "No suitable data available for pie chart generation";
          return {
            success: false,
            message: `${chartTypeMsg} (requires numeric data with positive values)`,
            chartData: [],
          };
        }
      } else if (chartType === "line") {
        // Line chart
        if (data.trends && Array.isArray(data.trends) && data.trends.length > 0) {
          chartData = data.trends.map((trend: any, index: number) => ({
            name: trend.period || `Period ${index + 1}`,
            value: trend.value || trend.count || 0,
            color: generateColor(index),
          }));
        } else {
          return {
            success: false,
            message: "No trend data available for line chart generation",
            chartData: [],
          };
        }
      }

      // Generate additional metadata
      const totalValue = chartData.reduce(
        (sum: number, item: any) => sum + (item.value || 0),
        0
      );
      const avgValue = chartData.length > 0 ? totalValue / chartData.length : 0;

      const result = {
        success: true,
        message: `Generated ${chartType} chart with ${chartData.length} data points`,
        chartConfig: {
          type: chartType,
          title,
          dataField,
          sortBy,
          maxItems,
        },
        chartData,
        metadata: {
          totalItems: chartData.length,
          totalValue,
          averageValue: Math.round(avgValue * 100) / 100,
          timestamp: new Date().toISOString(),
          dataQuality: data.visualization?.dataQuality || "unknown",
          modifications: data.visualization?.modifications || []
        },
      };

      console.log(
        `✅ Generated ${chartType} chart with ${chartData.length} items (total value: ${totalValue})`
      );
      return result;
    } catch (error) {
      console.error("Chart generation error:", error);
      return {
        success: false,
        message: `Failed to generate chart: ${(error as Error).message}`,
        chartData: [],
      };
    }
  },
});

// Helper function to generate consistent colors
function generateColor(index: number): string {
  const colors = [
    "#4CAF50",
    "#F44336",
    "#FFC107",
    "#2196F3",
    "#9C27B0",
    "#FF9800",
    "#795548",
    "#607D8B",
    "#E91E63",
    "#3F51B5",
    "#009688",
    "#8BC34A",
    "#FFEB3B",
    "#FF5722",
    "#673AB7",
  ];
  return colors[index % colors.length];
}
