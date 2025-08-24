"use client";

import { useState } from "react";
import WelcomeScreen from "../components/WelcomeScreen";
import ChatInterface from "../components/ChatInterface";

interface Message {
  role: "user" | "assistant";
  content?: string;
  summary?: string;
  analysis?: {
    opinions: { opinion: string; count: number; examples: string[] }[];
    sentiments: {
      positive: number;
      negative: number;
      neutral: number;
      total: number;
      percentages: { positive: number; negative: number; neutral: number };
    };
    biases: string;
    subredditAnalysis: {
      [key: string]: {
        summary: string;
        sentiments: {
          positive: number;
          negative: number;
          neutral: number;
          total: number;
          percentages: { positive: number; negative: number; neutral: number };
        };
        opinions: { opinion: string; count: number }[];
      };
    };
  };
  chartData?: {
    sentimentPie: { name: string; value: number }[];
    opinionBar: { name: string; value: number; fullName?: string }[];
  };
  sources?: any[];
}

export default function Home() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user" as const, content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    setInput("");

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }), // Pass all messages for context
      });

      if (!response.ok)
        throw new Error(`Network error: ${response.statusText}`);

      const data = await response.json();
      const assistantMessage = {
        role: "assistant" as const,
        summary: data.summary,
        analysis: data.analysis,
        chartData: data.chartData,
        sources: data.sources,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Fetch error:", error);
      const errorMessage = {
        role: "assistant" as const,
        summary:
          "Sorry, I encountered an error while processing your request. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {messages.length === 0 ? (
        <WelcomeScreen
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
        />
      ) : (
        <ChatInterface
          messages={messages}
          isLoading={isLoading}
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
