"use client";

import React from "react";
import rehypeExternalLinks from "rehype-external-links";
import ReactMarkdown from "react-markdown";
import InputForm from "./InputForm";
import SourceCard from "./SourceCard";

interface Message {
  role: "user" | "assistant";
  content?: string;
  summary?: string;
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

                      {/* Assistant Text Content */}
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
                  <p className="text-sm leading-relaxed animate-pulse">
                    Thinking...
                  </p>
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