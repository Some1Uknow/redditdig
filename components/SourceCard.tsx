import React from "react";
import { MessageCircle, ArrowUp, ExternalLink } from "lucide-react";
import RedditIcon from "./RedditIcon";

interface RedditPost {
  url: string;
  subreddit: string;
  title: string;
  selftext?: string;
  score: number;
  num_comments: number;
}

interface SourceCardProps {
  post: RedditPost;
}

const SourceCard: React.FC<SourceCardProps> = ({ post }) => {
  const snippet =
    post.selftext?.substring(0, 120) +
    (post.selftext && post.selftext.length > 120 ? "..." : "");

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 min-w-[280px] max-w-[280px] flex-shrink-0 shadow-sm hover:shadow-md transition-all duration-200 hover:border-orange-200 h-full">
      <a
        href={post.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full"
      >
        <div className="flex flex-col h-full">
          {/* Header with Reddit icon and subreddit */}
          <div className="flex items-center gap-1 mb-2">
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-orange-50 rounded-full">
              <RedditIcon className="w-2.5 h-2.5 text-orange-600" />
              <span className="text-xs font-medium text-orange-700">
                r/{post.subreddit}
              </span>
            </div>
            <ExternalLink className="w-2.5 h-2.5 text-gray-400 ml-auto" />
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-gray-900 mb-2 leading-tight line-clamp-2">
            {post.title}
          </h3>

          {/* Content snippet */}
          {snippet && (
            <p className="text-xs text-gray-600 leading-snug mb-2 flex-grow line-clamp-3">
              {snippet}
            </p>
          )}

          {/* Footer stats */}
          <div className="flex items-center gap-3 text-xs text-gray-500 border-t border-gray-100 pt-2 mt-auto">
            <div className="flex items-center gap-0.5">
              <ArrowUp className="w-2.5 h-2.5" />
              <span>{post.score}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <MessageCircle className="w-2.5 h-2.5" />
              <span>{post.num_comments}</span>
            </div>
          </div>
        </div>
      </a>
    </div>
  );
};

export default SourceCard;