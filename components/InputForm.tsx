"use client";

import { useState } from "react";
import { ChevronDown, Send, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface InputFormProps {
  input: string;
  handleInputChange: (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  isInitial?: boolean;
}

interface Model {
  name: string;
  type: string;
  image: string;
  description: string;
}

interface SearchMode {
  name: string;
  description: string;
}

const InputForm: React.FC<InputFormProps> = ({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  isInitial = false,
}) => {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("Mistral Small");
  const [searchMode, setSearchMode] = useState("Normal");

  const models: Model[] = [
    {
      name: "Mistral Small",
      type: "mistral",
      image: "/mistralai.png",
      description: "Fast & efficient for daily tasks",
    },
    {
      name: "Mistral Large",
      type: "mistral",
      image: "/mistralai.png",
      description: "Reasoning capabilities for longer responses",
    },
    {
      name: "Qwen-QwQ-32B",
      type: "qwen",
      image: "/qwen.png",
      description: "Compact and powerful",
    },
    {
      name: "Qwen3-232B",
      type: "qwen",
      image: "/qwen.png",
      description: "Reasoning model with extreme performance & accuracy",
    },
  ];

  const searchModes: SearchMode[] = [
    {
      name: "Normal",
      description: "Basic search with 5-10 results",
    },
    {
      name: "Deep",
      description:
        "10+ results, comprehensive analysis and comparison visualizations",
    },
  ];

  const inputClasses = isInitial
    ? "w-full bg-transparent text-gray-900 dark:text-gray-900 placeholder-gray-500 py-2 pl-3 focus-visible:ring-0 pr-10 text-lg focus:outline-none resize-none overflow-hidden min-h-0 shadow-none border-0 select-none"
    : "w-full bg-transparent text-gray-900 dark:text-gray-900 placeholder-gray-500 py-2 pl-3 pr-10 focus:outline-none resize-none overflow-hidden min-h-0 border-0 shadow-none select-none";

  return (
    <form
      onSubmit={handleSubmit}
      className={`${
        isInitial ? "w-full max-w-3xl mx-auto" : "w-full max-w-5xl"
      }`}
    >
      <Card className="bg-white dark:bg-white border border-gray-200 shadow-lg py-0 ">
        <CardContent className="p-2 pb-0">
          <Textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Ask a question about a Reddit topic..."
            className={inputClasses}
            disabled={isLoading}
            rows={1}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = target.scrollHeight + "px";
            }}
          />
        </CardContent>
        <CardFooter className="flex justify-between items-center p-2 pt-0">
          {/* Left section for model selection/other buttons */}
          <div className="flex items-center space-x-2">
            <DropdownMenu
              open={searchDropdownOpen}
              onOpenChange={setSearchDropdownOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="flex items-center px-2.5 py-1 bg-gray-100 dark:bg-gray-100 rounded-full text-sm text-gray-700 dark:text-gray-700 hover:bg-gray-200/60 dark:hover:bg-gray-200/60"
                >
                  <ZoomIn className="" />
                  <span className="ml-1">{searchMode} Search</span>
                  <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-max bg-white border border-gray-200 shadow-lg">
                {searchModes.map((mode) => (
                  <DropdownMenuItem
                    key={mode.name}
                    className="flex flex-col gap-1 items-start p-2 cursor-pointer"
                    onClick={() => {
                      setSearchMode(mode.name);
                      setSearchDropdownOpen(false);
                    }}
                  >
                    <div className="font-medium text-gray-900">
                      {mode.name} Search
                    </div>
                    <div className="text-xs text-gray-600 whitespace-nowrap">
                      {mode.description}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Model selection dropdown */}
            <DropdownMenu
              open={modelDropdownOpen}
              onOpenChange={setModelDropdownOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="flex items-center px-2.5 py-1 bg-gray-100 dark:bg-gray-100 rounded-full text-sm text-gray-700 dark:text-gray-700 hover:bg-gray-200/60 dark:hover:bg-gray-200/60"
                >
                  <img
                    src={models.find((m) => m.name === selectedModel)?.image}
                    alt={models.find((m) => m.name === selectedModel)?.type}
                    className="w-auto h-4 flex-shrink-0"
                  />
                  <span className="ml-1">{selectedModel}</span>
                  <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-max bg-white border border-gray-200 shadow-lg">
                {models.map((model) => (
                  <DropdownMenuItem
                    key={model.name}
                    className="flex items-center p-3 cursor-pointer focus:bg-orange-200"
                    onClick={() => {
                      setSelectedModel(model.name);
                      setModelDropdownOpen(false);
                    }}
                  >
                    <img
                      src={model.image}
                      alt={model.type}
                      className="w-auto h-4 mr-3 flex-shrink-0"
                    />
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-gray-900 whitespace-nowrap">
                        {model.name}
                      </span>
                      <span className="text-xs text-gray-600 whitespace-nowrap">
                        {model.description}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right section for send button */}
          <div className="flex items-center space-x-2">
            <Button
              type="submit"
              disabled={isLoading || !(input || "").trim()}
              className="bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  );
};

export default InputForm;
