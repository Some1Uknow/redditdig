import React from 'react';
import InputForm from './InputForm';

function WelcomeScreen({ input, setInput, handleSubmit, isLoading }) {
  return (
    <main className="flex-1 flex flex-col justify-center items-center px-4 py-8">
      <div className="text-center mb-2">
        <div className="flex items-center justify-center mb-4">
          <img src="./redditDig.png" className="w-24 h-24" alt="redditDig logo" />
          <h1 className="text-5xl font-bold text-orange-600">redditDig</h1>
        </div>
      </div>

      <InputForm
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        isInitial={true}
      />

      {/* Example queries */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500 mb-3">Try asking about:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {[ "Best programming languages 2024", "Climate change discussions", "Gaming recommendations", ].map((example) => (
            <button
              key={example}
              onClick={() => setInput(example)}
              className="px-3 py-1.5 text-xs bg-white border border-gray-200 text-gray-700 rounded-full hover:border-orange-300 hover:text-orange-700 transition-colors duration-200"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}

export default WelcomeScreen;