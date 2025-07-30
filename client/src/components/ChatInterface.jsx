import React from 'react';
import ReactMarkdown from 'react-markdown';
import InputForm from './InputForm';

function ChatInterface({ messages, isLoading, input, setInput, handleSubmit }) {
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
                      <ReactMarkdown >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Assistant Message */}
                {message.role === "assistant" && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg max-w-2xl">
                      <ReactMarkdown >
                        {message.summary}
                      </ReactMarkdown>
                      {message.sources && message.sources.length > 0 && (
                        <div className="pt-2 mt-2 text-sm text-gray-600">
                          <p className="font-semibold mb-1">Sources:</p>
                          <div className="flex flex-wrap gap-2">
                            {message.sources.map((source, srcIndex) => (
                              <a key={srcIndex} href={source.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                {source.title}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg max-w-2xl">
                  <p className="text-sm leading-relaxed animate-pulse">Thinking...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Fixed Input Form at the bottom */}
      <div className="sticky bottom-0 bg-white py-4 px-4 shadow-lg border-t border-gray-200">
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
}

export default ChatInterface;