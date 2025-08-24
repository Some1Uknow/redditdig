import { tool } from "ai";
import { z } from "zod";

export const prepareForVisualizationTool = tool({
  description: `Prepare analysis data for visualization by ensuring proper structure and format.
  This tool transforms raw analysis data into the structure expected by generateChart.
  Use this tool when you have analysis results that need to be visualized but are not in the correct format.`,
  inputSchema: z.object({
    data: z.any().describe("The raw analysis data to prepare for visualization"),
    dataType: z.enum(["sentiment", "opinions", "subreddit", "trends"]).describe("Type of data being prepared"),
    chartType: z.enum(["pie", "bar", "line", "scatter", "area"]).describe("Type of chart that will be generated"),
  }),
  execute: async ({ data, dataType, chartType }) => {
    try {
      console.log(`🔧 Preparing ${dataType} data for ${chartType} chart visualization...`);

      // Validate input data
      if (!data) {
        return {
          success: false,
          message: "No data provided for preparation",
          preparedData: null,
        };
      }

      let preparedData: any = {};

      // Prepare data based on type
      if (dataType === "sentiment") {
        // Ensure sentiment data has proper structure
        preparedData.sentiments = {
          percentages: {
            positive: data.positive || 0,
            negative: data.negative || 0,
            neutral: data.neutral || 0,
          },
          total: (data.positive || 0) + (data.negative || 0) + (data.neutral || 0),
        };
      } else if (dataType === "opinions") {
        // Ensure opinions data has proper structure
        if (Array.isArray(data)) {
          preparedData.opinions = data.map((opinion: any) => ({
            opinion: opinion.opinion || opinion.name || "Unknown",
            count: opinion.count || opinion.value || 1,
            examples: opinion.examples || [],
            confidence: opinion.confidence || 3,
          }));
        } else if (data.opinions) {
          preparedData.opinions = data.opinions;
        }
      } else if (dataType === "subreddit") {
        // Ensure subreddit analysis data has proper structure
        if (data.subredditAnalysis) {
          preparedData.subredditAnalysis = data.subredditAnalysis;
        } else {
          preparedData.subredditAnalysis = data;
        }
      } else if (dataType === "trends") {
        // Ensure trend data has proper structure
        if (Array.isArray(data)) {
          preparedData.trends = data;
        } else if (data.trends) {
          preparedData.trends = data.trends;
        }
      }

      // Add metadata
      preparedData.visualization = {
        dataQuality: "prepared",
        modifications: [`Data prepared for ${chartType} chart visualization`],
        timestamp: new Date().toISOString(),
      };

      return {
        success: true,
        message: `Successfully prepared ${dataType} data for ${chartType} chart`,
        preparedData,
        metadata: {
          originalDataKeys: Object.keys(data),
          dataType,
          chartType,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("Data preparation error:", error);
      return {
        success: false,
        message: `Failed to prepare data: ${(error as Error).message}`,
        preparedData: null,
      };
    }
  },
});
