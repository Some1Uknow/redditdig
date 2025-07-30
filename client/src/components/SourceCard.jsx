import React from "react";
import { MessageCircle, ArrowUp, ExternalLink } from "lucide-react";
import RedditIcon from "./RedditIcon";

function SourceCard({ post }) {
  const snippet =
    post.selftext?.substring(0, 120) +
    (post.selftext?.length > 120 ? "..." : "");

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 min-w-[320px] max-w-[320px] flex-shrink-0 shadow-sm hover:shadow-md transition-all duration-200 hover:border-orange-200">
      <a
        href={post.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full"
      >
        <div className="flex flex-col h-full">
          {/* Header with Reddit icon and subreddit */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-2 px-2 py-1 bg-orange-50 rounded-full">
              <RedditIcon className="w-3 h-3 text-orange-600" />
              <span className="text-xs font-medium text-orange-700">
                r/{post.subreddit}
              </span>
            </div>
            <ExternalLink className="w-3 h-3 text-gray-400 ml-auto" />
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-gray-900 mb-3 leading-5 line-clamp-3">
            {post.title}
          </h3>

          {/* Content snippet */}
          {snippet && (
            <p className="text-xs text-gray-600 leading-relaxed mb-4 flex-grow line-clamp-4">
              {snippet}
            </p>
          )}

          {/* Footer stats */}
          <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-gray-100 pt-3 mt-auto">
            <div className="flex items-center gap-1">
              <ArrowUp className="w-3 h-3" />
              <span>{post.score}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              <span>{post.num_comments}</span>
            </div>
          </div>
        </div>
      </a>
    </div>
  );
}

export default SourceCard;
