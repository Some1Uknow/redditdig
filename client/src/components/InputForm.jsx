import React from "react";
import { Send, Telescope, ZoomIn } from "lucide-react";

function InputForm({
  input,
  setInput,
  handleSubmit,
  isLoading,
  isInitial = false,
}) {
  const inputClasses = isInitial
    ? "w-full bg-transparent text-gray-900 placeholder-gray-500 py-2 pl-3 pr-10 text-lg focus:outline-none resize-none overflow-hidden" // Adjusted for blended look
    : "w-full bg-transparent text-gray-900 placeholder-gray-500 py-2 pl-3 pr-10 focus:outline-none resize-none overflow-hidden";

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative flex flex-col border border-gray-300 rounded-lg shadow-lg bg-white ${
        isInitial ? "w-full max-w-3xl mx-auto" : "w-full max-w-5xl"
      }`}
      style={{ minHeight: isInitial ? "6rem" : "auto" }} // Minimum height for the blended box
    >
      <div className="flex-1 p-3 pb-0">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about a Reddit topic..."
          className={inputClasses}
          disabled={isLoading}
          rows={1} // Start with one row
          onInput={(e) => {
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
        />
      </div>

      <div className="flex justify-between items-center p-3 pt-0">
        {/* Left section for model selection/other buttons */}
        <div className="flex items-center space-x-2">
      
          <button
            type="button"
            className="flex items-center px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200"
          >
            <ZoomIn className="p-1" />
            <span className="ml-1">Deep Search</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-chevron-down"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {/* Model selection button */}
          <button
            type="button"
            className="flex items-center px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-cpu"
            >
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <rect x="9" y="9" width="6" height="6" />
              <path d="M15 2v2" />
              <path d="M15 20v2" />
              <path d="M2 15h2" />
              <path d="M20 15h2" />
              <path d="M15 4h-2" />
              <path d="M15 20h-2" />
              <path d="M4 9v2" />
              <path d="M20 9v2" />
            </svg>
            <span className="ml-1">Mistral Small</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-chevron-down"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>

        {/* Right section for attachment and send button */}
        <div className="flex items-center space-x-2">
          <button type="button" className="p-2 rounded-full hover:bg-gray-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-paperclip"
            >
              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.49" />
            </svg>
          </button>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </form>
  );
}

export default InputForm;
