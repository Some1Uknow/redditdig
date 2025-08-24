"use client";

import React from "react";
import rehypeExternalLinks from "rehype-external-links";
import ReactMarkdown from "react-markdown";
import InputForm from "./InputForm";
import SourceCard from "./SourceCard";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';

interface Message {
  role: "user" | "assistant";
  content?: string;
  summary?: string;
  analysis?: {
    opinions: { opinion: string; count: number; examples: string[] }[];
    sentiments: { positive: number; negative: number; neutral: number; total: number; percentages: { positive: number; negative: number; neutral: number } };
    biases: string;
    subredditAnalysis: { [key: string]: { summary: string; sentiments: { positive: number; negative: number; neutral: number; total: number; percentages: { positive: number; negative: number; neutral: number } }; opinions: { opinion: string; count: number }[] } };
  };
  chartData?: {
    sentimentPie: { name: string; value: number }[];
    opinionBar: { name: string; value: number; fullName?: string }[];
  };
  sources?: RedditPost[];
}

interface RedditPost {
  url: string;
  subreddit: string;
  title: string;
  selftext?: string;
  score: number;
  num_comments: number;
}

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

const COLORS = ['#4CAF50', '#F44336', '#FFC107']; // Green for positive, red for negative, yellow for neutral

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isLoading,
  input,
  setInput,
  handleSubmit,
}) => {
  return (
    <>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-8">
            {messages.map((message, index) => (
              <div key={index} className="space-y-6">
                {/* User Message */}
                {message.role === "user" && (
                  <div className="flex justify-end">
                    <div className="bg-orange-500 text-white px-4 py-2 rounded-lg max-w-xl">
                      <ReactMarkdown
                        rehypePlugins={[
                          [rehypeExternalLinks, { target: "_blank" }],
                        ]}
                      >
                        {message.content || ""}
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
                      {/* Reddit Posts Slider */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mb-4 h-64">
                          <div className="flex overflow-x-auto space-x-3 pb-2 scrollbar-thin h-full">
                            {message.sources.map((source, srcIndex) => (
                              <div
                                key={srcIndex}
                                className="flex-shrink-0 h-full"
                              >
                                <SourceCard post={source} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Assistant Summary Content */}
                      <div className="leading-relaxed text-gray-700">
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
                          {message.summary || ""}
                        </ReactMarkdown>
                      </div>

                      {/* Analysis and Charts */}
                      {message.analysis && message.chartData && (
                        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                          <h2 className="text-xl font-bold mb-4">Detailed Analysis</h2>
                          
                          {/* Debug info - remove in production */}
                          {process.env.NODE_ENV === 'development' && (
                            <div className="mb-4 p-3 bg-blue-50 rounded text-sm">
                              <strong>Debug Info:</strong> 
                              Opinions: {message.analysis.opinions?.length || 0}, 
                              Chart Data: {message.chartData.opinionBar?.length || 0} bars, 
                              {message.chartData.sentimentPie?.length || 0} pie slices
                            </div>
                          )}

                          {/* Charts Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* Sentiment Pie Chart */}
                            {message.chartData.sentimentPie && message.chartData.sentimentPie.length > 0 && (
                              <div>
                                <h3 className="text-lg font-semibold mb-2">Sentiment Distribution</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                  <PieChart>
                                    <Pie
                                      data={message.chartData.sentimentPie}
                                      dataKey="value"
                                      nameKey="name"
                                      cx="50%"
                                      cy="50%"
                                      outerRadius={100}
                                      label
                                    >
                                      {message.chartData.sentimentPie.map((entry, idx) => (
                                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                      ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                            )}

                            {/* Opinion Bar Chart */}
                            {message.chartData.opinionBar && message.chartData.opinionBar.length > 0 && (
                              <div>
                                <h3 className="text-lg font-semibold mb-2">Opinions Distribution</h3>
                                <ResponsiveContainer width="100%" height={400}>
                                  <BarChart data={message.chartData.opinionBar} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                                    <XAxis 
                                      dataKey="name" 
                                      angle={-45} 
                                      textAnchor="end" 
                                      height={120}
                                      interval={0}
                                      fontSize={12}
                                      tick={{ fontSize: 10 }}
                                    />
                                    <YAxis />
                                    <Tooltip 
                                      formatter={(value, name, props) => [value, props.payload?.fullName || name]}
                                      labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                                    />
                                    <Legend />
                                    <Bar dataKey="value" fill="#8884d8" />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            )}
                          </div>

                          {/* Opinions List */}
                          {message.analysis.opinions && message.analysis.opinions.length > 0 ? (
                            <div className="mb-4">
                              <h3 className="text-lg font-semibold mb-2">Key Opinions ({message.analysis.opinions.length} found)</h3>
                              <div className="space-y-3">
                                {message.analysis.opinions.map((op, idx) => (
                                  <div key={idx} className="bg-white p-3 rounded border-l-4 border-blue-500">
                                    <div className="flex justify-between items-start mb-2">
                                      <strong className="text-gray-800 flex-1">{op.opinion}</strong>
                                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium ml-2">
                                        {op.count} mentions
                                      </span>
                                    </div>
                                    {op.examples && op.examples.length > 0 && (
                                      <div className="text-sm text-gray-600">
                                        <strong>Examples:</strong>
                                        <ul className="list-disc pl-4 mt-1 space-y-1">
                                          {op.examples.slice(0, 3).map((example, exIdx) => (
                                            <li key={exIdx} className="italic">"{example}"</li>
                                          ))}
                                          {op.examples.length > 3 && (
                                            <li className="text-gray-500">...and {op.examples.length - 3} more</li>
                                          )}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="mb-4">
                              <h3 className="text-lg font-semibold mb-2">Key Opinions</h3>
                              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                                <p className="text-yellow-800">
                                  🔍 No distinct opinions were identified in the analyzed posts. 
                                  This might indicate general consensus or insufficient data for opinion analysis.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Sentiments Details */}
                          {message.analysis.sentiments && (
                            <div className="mb-4">
                              <h3 className="text-lg font-semibold mb-2">Sentiment Breakdown</h3>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
                                  <div className="text-2xl font-bold text-green-600">
                                    {message.analysis.sentiments.positive}
                                  </div>
                                  <div className="text-sm text-green-600">Positive</div>
                                  <div className="text-xs text-green-500">
                                    {message.analysis.sentiments.percentages.positive.toFixed(1)}%
                                  </div>
                                </div>
                                <div className="bg-red-50 border border-red-200 rounded p-3 text-center">
                                  <div className="text-2xl font-bold text-red-600">
                                    {message.analysis.sentiments.negative}
                                  </div>
                                  <div className="text-sm text-red-600">Negative</div>
                                  <div className="text-xs text-red-500">
                                    {message.analysis.sentiments.percentages.negative.toFixed(1)}%
                                  </div>
                                </div>
                                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-center">
                                  <div className="text-2xl font-bold text-yellow-600">
                                    {message.analysis.sentiments.neutral}
                                  </div>
                                  <div className="text-sm text-yellow-600">Neutral</div>
                                  <div className="text-xs text-yellow-500">
                                    {message.analysis.sentiments.percentages.neutral.toFixed(1)}%
                                  </div>
                                </div>
                                <div className="bg-gray-50 border border-gray-200 rounded p-3 text-center">
                                  <div className="text-2xl font-bold text-gray-600">
                                    {message.analysis.sentiments.total}
                                  </div>
                                  <div className="text-sm text-gray-600">Total</div>
                                  <div className="text-xs text-gray-500">Posts Analyzed</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Biases */}
                          {message.analysis.biases && (
                            <div className="mb-6">
                              <h3 className="text-lg font-semibold mb-3">🔍 Detected Biases</h3>
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <div className="flex items-start">
                                  <div className="flex-shrink-0">
                                    <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                                      <span className="text-amber-600 text-sm">⚠️</span>
                                    </div>
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-amber-800 text-sm leading-relaxed">
                                      {message.analysis.biases}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Subreddit Analysis */}
                          {message.analysis.subredditAnalysis && Object.keys(message.analysis.subredditAnalysis).length > 0 && (
                            <div className="mb-6">
                              <h3 className="text-lg font-semibold mb-3">📊 Analysis by Community</h3>
                              <div className="space-y-4">
                                {Object.entries(message.analysis.subredditAnalysis).map(([sub, data]) => (
                                  <div key={sub} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                                    <div className="flex items-center justify-between mb-3">
                                      <h4 className="text-md font-medium text-gray-900 flex items-center">
                                        <span className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                                          <span className="text-orange-600 text-xs font-bold">r/</span>
                                        </span>
                                        {sub}
                                      </h4>
                                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                        {data.sentiments.total} posts analyzed
                                      </span>
                                    </div>
                                    
                                    <p className="text-gray-700 text-sm mb-3 leading-relaxed">{data.summary}</p>
                                    
                                    {/* Mini sentiment indicators */}
                                    <div className="flex items-center space-x-4 mb-3">
                                      <div className="flex items-center text-xs">
                                        <div className="w-3 h-3 bg-green-400 rounded-full mr-1"></div>
                                        <span className="text-gray-600">{data.sentiments.percentages.positive.toFixed(0)}% positive</span>
                                      </div>
                                      <div className="flex items-center text-xs">
                                        <div className="w-3 h-3 bg-red-400 rounded-full mr-1"></div>
                                        <span className="text-gray-600">{data.sentiments.percentages.negative.toFixed(0)}% negative</span>
                                      </div>
                                      <div className="flex items-center text-xs">
                                        <div className="w-3 h-3 bg-yellow-400 rounded-full mr-1"></div>
                                        <span className="text-gray-600">{data.sentiments.percentages.neutral.toFixed(0)}% neutral</span>
                                      </div>
                                    </div>

                                    {/* Community-specific opinions */}
                                    {data.opinions && data.opinions.length > 0 && (
                                      <div>
                                        <h5 className="text-sm font-medium text-gray-800 mb-2">Key Community Perspectives:</h5>
                                        <div className="space-y-1">
                                          {data.opinions.slice(0, 3).map((op, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-sm">
                                              <span className="text-gray-700 flex-1">{op.opinion}</span>
                                              <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded ml-2">
                                                {op.count}
                                              </span>
                                            </div>
                                          ))}
                                          {data.opinions.length > 3 && (
                                            <div className="text-xs text-gray-500 mt-2">
                                              +{data.opinions.length - 3} more perspectives
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
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
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                    <p className="text-sm leading-relaxed">
                      Analyzing Reddit discussions...
                    </p>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    🔍 Searching relevant posts → 📊 Processing data → 🤖 Generating insights
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
            setInput={setInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      </div>
    </>
  );
};

export default ChatInterface;