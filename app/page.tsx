"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import WelcomeScreen from "../components/WelcomeScreen";
import ChatInterface from "../components/ChatInterface";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function Home() {
  const { messages, sendMessage, status, error } = useChat({
    experimental_throttle: 30,
    onFinish: (message) => {
      // Handle the finished message
      console.log(message);
    },
  });
  const [input, setInput] = useState("");

  const isLoading = status === "submitted" || status === "streaming";

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  if (error) {
    console.error("Chat error:", error);
  }

  return (
    <div className="bg-gray-50 w-full h-full flex flex-col">
      <SidebarTrigger />
      {messages.length === 0 ? (
        <WelcomeScreen
          input={input}
          setInput={setInput}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
        />
      ) : (
        <ChatInterface
          messages={messages}
          isLoading={isLoading}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
