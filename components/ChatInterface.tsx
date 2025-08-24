"use client";

import React from "react";
import rehypeExternalLinks from "rehype-external-links";
import ReactMarkdown from "react-markdown";
import InputForm from "./InputForm";
import SourceCard from "./SourceCard";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import type { UIMessage } from "ai";

interface RedditPost {
  url: string;
  subreddit: string;
  title: string;
  selftext?: string;
  score: number;
  num_comments: number;
}

interface ChatInterfaceProps {
  messages: UIMessage[];
  isLoading: boolean;
  input: string;
  handleInputChange: (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const COLORS = ["#4CAF50", "#F44336", "#FFC107"]; // Green for positive, red for negative, yellow for neutral

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isLoading,
  input,
  handleInputChange,
  handleSubmit
}) => {
  // Debug: Log message structure to understand AI SDK v5 format
  // React.useEffect(() => {
  //   if (messages.length > 0) {
  //     console.log("📱 Current messages structure:", JSON.stringify(messages, null, 2));
  //   }
  // }, [messages]);

  return (
    <>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-8">
            {messages.map((message, index) => (
              <div key={message.id || index} className="space-y-6">
                {/* User Message */}
                {message.role === "user" && (
                  <div className="flex justify-end">
                    <div className="bg-orange-500 text-white px-4 py-2 rounded-lg max-w-xl">
                      <ReactMarkdown
                        rehypePlugins={[
                          [rehypeExternalLinks, { target: "_blank" }],
                        ]}
                      >
                        {message.parts?.find(part => part.type === 'text')?.text || 
                         (message as any).content || ""}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Assistant Message */}
                {message.role === "assistant" && (
                  <div className="flex justify-start items-start space-x-3">
                    {/* Reddit Dig Avatar */}
                    <img
                      src="/redditDig.png"
                      alt="Reddit Dig"
                      className="w-8 h-8 rounded-full mt-2"
                    />

                    <div className="w-4/5">
                      {/* Debug info */}
                      {process.env.NODE_ENV === 'development' && (
                        <div className="text-xs text-gray-400 mb-2">
                          Parts: {message.parts?.length || 0} | 
                          Legacy: {(message as any).toolInvocations?.length || 0} |
                          Types: {message.parts?.map(p => p.type).join(', ') || 'none'}
                        </div>
                      )}

                      {/* Render message content */}
                      <div className="leading-relaxed text-gray-700 space-y-4">
                        {/* Text content - render text parts */}
                        {message.parts?.map((part, partIndex) => {
                          if (part.type === 'text') {
                            return (
                              <div key={partIndex}>
                                <ReactMarkdown
                                  components={{
                                    a: ({ href, children }) => (
                                      <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 underline hover:text-blue-800"
                                      >
                                        {children}
                                      </a>
                                    ),
                                  }}
                                >
                                  {part.text}
                                </ReactMarkdown>
                              </div>
                            );
                          }
                          
                          // Handle step-start parts (show progress)
                          if (part.type === 'step-start') {
                            return (
                              <div key={partIndex} className="text-sm text-gray-500 italic">
                                🔄 Starting new step...
                              </div>
                            );
                          }
                          
                          // Handle tool parts (AI SDK v5 format: "tool-{toolName}")
                          if (part.type.startsWith('tool-')) {
                            const toolPart = part as any;
                            const toolName = part.type.replace('tool-', ''); // Extract tool name from type
                            
                            // Determine if this is a call or result based on state
                            const isResult = toolPart.state === 'output-available' || toolPart.state === 'output-error';
                            const isError = toolPart.state === 'output-error';
                            
                            return (
                              <div key={partIndex}>
                                {/* Tool Call/Result Rendering */}
                                {toolName === "searchReddit" && (
                                  <ToolCallRenderer
                                    toolInvocation={{
                                      state: isResult ? 'result' : 'call',
                                      toolName: toolName,
                                      args: toolPart.input,
                                      result: isResult ? (isError ? { error: toolPart.errorText } : toolPart.output) : undefined,
                                      toolCallId: toolPart.toolCallId
                                    }}
                                    toolName="Reddit Search"
                                    icon="🔍"
                                  />
                                )}

                                {toolName === "analyzeRedditData" && (
                                  <ToolCallRenderer
                                    toolInvocation={{
                                      state: isResult ? 'result' : 'call',
                                      toolName: toolName,
                                      args: toolPart.input,
                                      result: isResult ? (isError ? { error: toolPart.errorText } : toolPart.output) : undefined,
                                      toolCallId: toolPart.toolCallId
                                    }}
                                    toolName="Analysis"
                                    icon="🧠"
                                  />
                                )}

                                {toolName === "generateChart" && (
                                  <ChartRenderer
                                    toolInvocation={{
                                      state: isResult ? 'result' : 'call',
                                      toolName: toolName,
                                      args: toolPart.input,
                                      result: isResult ? (isError ? { error: toolPart.errorText } : toolPart.output) : undefined,
                                      toolCallId: toolPart.toolCallId
                                    }}
                                  />
                                )}

                                {toolName === "formatAsList" && (
                                  <ListRenderer
                                    toolInvocation={{
                                      state: isResult ? 'result' : 'call',
                                      toolName: toolName,
                                      args: toolPart.input,
                                      result: isResult ? (isError ? { error: toolPart.errorText } : toolPart.output) : undefined,
                                      toolCallId: toolPart.toolCallId
                                    }}
                                  />
                                )}
                              </div>
                            );
                          }
                          
                          // Fallback for unhandled part types
                          return (
                            <div key={partIndex} className="text-xs text-gray-400 italic">
                              [Unhandled part type: {part.type}]
                            </div>
                          );
                        })}

                        {/* Show a message if no text parts were found */}
                        {message.parts && message.parts.length > 0 && 
                         !message.parts.some(part => part.type === 'text') && (
                          <div className="text-gray-600 italic mb-4">
                            🤖 Processing your request with {message.parts.length} tool operations...
                          </div>
                        )}

                        {/* Show final summary if we have completed tool results */}
                        {message.parts && message.parts.some((part: any) => 
                          part.type.startsWith('tool-') && part.state === 'output-available'
                        ) && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <div className="text-sm font-medium text-gray-800 mb-2">
                              🎉 Analysis Complete!
                            </div>
                            <div className="text-sm text-gray-600">
                              I've successfully searched Reddit and analyzed the discussions. The results are displayed above with tool outputs, charts, and formatted data as requested.
                            </div>
                          </div>
                        )}

                        {/* Fallback for old content format */}
                        {!message.parts && (message as any).content && (
                          <div>
                            <ReactMarkdown
                              components={{
                                a: ({ href, children }) => (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 underline hover:text-blue-800"
                                  >
                                    {children}
                                  </a>
                                ),
                              }}
                            >
                              {(message as any).content}
                            </ReactMarkdown>
                          </div>
                        )}

                        {/* Legacy Tool Results - fallback */}
                        {(message as any).toolInvocations &&
                          (message as any).toolInvocations.map(
                            (toolInvocation: any, toolIndex: number) => (
                              <div key={toolIndex}>
                                {/* Tool Call Rendering */}
                                {toolInvocation.toolName === "searchReddit" && (
                                  <ToolCallRenderer
                                    toolInvocation={toolInvocation}
                                    toolName="Reddit Search"
                                    icon="🔍"
                                  />
                                )}

                                {toolInvocation.toolName ===
                                  "analyzeRedditData" && (
                                  <ToolCallRenderer
                                    toolInvocation={toolInvocation}
                                    toolName="Analysis"
                                    icon="🧠"
                                  />
                                )}

                                {toolInvocation.toolName ===
                                  "generateChart" && (
                                  <ChartRenderer
                                    toolInvocation={toolInvocation}
                                  />
                                )}

                                {toolInvocation.toolName === "formatAsList" && (
                                  <ListRenderer
                                    toolInvocation={toolInvocation}
                                  />
                                )}
                              </div>
                            )
                          )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start items-start space-x-3">
                <img
                  src="/redditDig.png"
                  alt="Reddit Dig"
                  className="w-8 h-8 rounded-full mt-2"
                />
                <div className="w-4/5 text-gray-700 p-4 rounded-lg bg-gray-50">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                    <p className="text-sm font-medium">
                      🤖 Working with AI tools to analyze Reddit...
                    </p>
                  </div>

                  <div className="text-xs text-gray-600">
                    The AI is deciding which tools to use and how to research
                    your query...
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Fixed Input Form at the bottom */}
      <div className="sticky bottom-0 py-4 px-4">
        <div className="max-w-4xl mx-auto">
          <InputForm
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      </div>
    </>
  );
};

// Memoize the ToolCallRenderer component to prevent unnecessary re-renders
const ToolCallRenderer = React.memo(({ toolInvocation, toolName, icon }: { toolInvocation: any; toolName: string; icon: string }) => {
  const { state, args, result } = toolInvocation;
  
  switch (state) {
    case 'call':
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">{icon}</span>
            <span className="font-medium text-blue-800">{toolName}</span>
            <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
          </div>
          <div className="text-sm text-blue-700 mb-2">
            Running with parameters:
          </div>
          <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
            {JSON.stringify(args, null, 2)}
          </pre>
        </div>
      );
    
    case 'result':
      // Handle error results
      if (result?.error) {
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">❌</span>
              <span className="font-medium text-red-800">{toolName} - Error</span>
            </div>
            <div className="text-sm text-red-700 mb-2">
              Tool execution failed:
            </div>
            <div className="text-xs bg-red-100 p-2 rounded border">
              {result.error}
            </div>
          </div>
        );
      }
      
      // Handle successful results
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">{icon}</span>
            <span className="font-medium text-green-800">{toolName} - Completed</span>
            <span className="text-green-600">✅</span>
          </div>
          {result?.message && (
            <div className="text-sm text-green-700 mb-2">
              {result.message}
            </div>
          )}
          {result?.posts && result.posts.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-green-800">
                Found {result.posts.length} Reddit posts:
              </div>
              <div className="flex overflow-x-auto space-x-3 pb-2">
                {result.posts.map((post: any, idx: number) => (
                  <div key={idx} className="flex-shrink-0">
                    <SourceCard post={post} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {result?.analysis && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-green-800">
                Analysis Results:
              </div>
              <div className="text-xs bg-green-100 p-2 rounded">
                <div className="mb-1">
                  <strong>Key Insights:</strong> {result.analysis.keyInsights?.length || 0} found
                </div>
                <div className="mb-1">
                  <strong>Opinions:</strong> {result.analysis.opinions?.length || 0} extracted
                </div>
                <div>
                  <strong>Sentiment:</strong> {result.analysis.sentiments?.total || 0} analyzed
                </div>
              </div>
            </div>
          )}
        </div>
      );
    
    default:
      return null;
  }
});

// Move tooltip formatter outside component to prevent recreation
const tooltipFormatter = (value: any, name: string, props: any) => {
  const entry = props.payload;
  return [`${value} (${entry.percentage || 0}%)`, name];
};

// Memoize the ChartRenderer component to prevent unnecessary re-renders
const ChartRenderer = React.memo(({ toolInvocation }: { toolInvocation: any }) => {
  const { state, result } = toolInvocation;
  
  if (state === 'call') {
    return <ToolCallRenderer toolInvocation={toolInvocation} toolName="Chart Generation" icon="📊" />;
  }
  
  if (result?.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-lg">❌</span>
          <span className="font-medium text-red-800">Chart Generation - Error</span>
        </div>
        <div className="text-sm text-red-700 mb-2">
          Failed to generate chart:
        </div>
        <div className="text-xs bg-red-100 p-2 rounded">
          {result.error}
        </div>
      </div>
    );
  }
  
  if (!result?.success || !result?.chartData) {
    return <ToolCallRenderer toolInvocation={toolInvocation} toolName="Chart Generation" icon="📊" />;
  }

  const { chartData, chartConfig } = result;
  
  // Create a stable key for the chart container to prevent unnecessary re-renders
  const chartKey = `chart-${toolInvocation.toolCallId}-${chartConfig.type}`;
  
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-lg">📊</span>
        <span className="font-medium text-purple-800">Generated Chart: {chartConfig.title}</span>
      </div>
      
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%" key={chartKey}>
          {chartConfig.type === 'pie' ? (
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percentage }) => `${name} (${percentage}%)`}
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={tooltipFormatter} />
              <Legend />
            </PieChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={tooltipFormatter} />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
});

// Memoize the ListRenderer component to prevent unnecessary re-renders
const ListRenderer = React.memo(({ toolInvocation }: { toolInvocation: any }) => {
  const { state, result } = toolInvocation;
  
  if (state === 'call') {
    return <ToolCallRenderer toolInvocation={toolInvocation} toolName="List Formatting" icon="📋" />;
  }
  
  if (result?.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-lg">❌</span>
          <span className="font-medium text-red-800">List Formatting - Error</span>
        </div>
        <div className="text-sm text-red-700 mb-2">
          Failed to format list:
        </div>
        <div className="text-xs bg-red-100 p-2 rounded">
          {result.error}
        </div>
      </div>
    );
  }
  
  if (!result?.success || !result?.formattedList) {
    return <ToolCallRenderer toolInvocation={toolInvocation} toolName="List Formatting" icon="📋" />;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-lg">📋</span>
        <span className="font-medium text-yellow-800">Formatted List</span>
      </div>
      
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown>
          {result.formattedList}
        </ReactMarkdown>
      </div>
    </div>
  );
});

export default ChatInterface;
