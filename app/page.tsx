"use client";

import { useState } from "react";
import WelcomeScreen from "../components/WelcomeScreen";
import ChatInterface from "../components/ChatInterface";

interface Message {
  role: "user" | "assistant";
  content?: string;
  summary?: string;
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
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setInput("");

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [userMessage] }),
      });

      if (!response.ok)
        throw new Error(`Network error: ${response.statusText}`);

      const data = await response.json();
      const assistantMessage = {
        role: "assistant" as const,
        summary: data.summary,
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
