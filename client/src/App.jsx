
// Reusable component to display a single source post
function PostCard({ post, index }) {
  return (
    <div className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow">
      <a href={post.url} target="_blank" rel="noopener noreferrer" className="block group">
        <h3 className="font-medium text-blue-600 group-hover:text-blue-800 text-sm">
          {post.title}
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          r/{post.subreddit} • 👍 {post.score || 0}
        </p>
      </a>
    </div>
  );
}

export default function App() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInput('');

    try {
      const response = await fetch('http://localhost:3001/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [userMessage] }), // Send the user message for context
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const assistantMessage = {
        role: 'assistant',
        summary: data.summary,
        sources: data.sources,
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Fetch error:', error);
      const errorMessage = { role: 'assistant', summary: 'Sorry, I couldn\'t get a response. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      <header className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-xl font-bold text-gray-800">Reddit Insight AI (MVP)</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto">
          {messages.map((m, index) => (
            <div key={index} className="mb-6">
              {m.role === 'user' && (
                <div className="flex justify-end">
                  <div className="bg-blue-500 text-white rounded-lg px-4 py-2 max-w-lg">
                    {m.content}
                  </div>
                </div>
              )}
              {m.role === 'assistant' && (
                <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
                  <p className="text-gray-800 leading-relaxed">{m.summary}</p>
                  {m.sources && m.sources.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h3 className="text-sm font-semibold mb-2">Sources:</h3>
                      <div className="space-y-2">
                        {m.sources.map((post, i) => (
                          <PostCard key={post.id || i} post={post} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>Thinking...</span>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What do you want to know about?"
              className="w-full px-4 py-2 pr-12 rounded-full border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 disabled:bg-gray-300"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086L2.279 16.76a.75.75 0 00.95.826l14.25-4.25a.75.75 0 000-1.352L3.105 2.289z"></path></svg>
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
}