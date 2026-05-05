"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
  loadingStatus?: string; // live tool-status text from SSE stream
  isLast?: boolean;
  onOptionClick?: (text: string) => void;
}

const WORKING_MESSAGES = [
  "Thinking...",
  "Searching the system...",
  "Working on it...",
  "Processing your request...",
  "Almost there...",
];

/**
 * Extract clickable options from the end of an assistant message.
 * Matches patterns like:
 * - "1. Create a purchase order"
 * - "- Check stock levels"
 * - "• Add more items"
 * Only extracts from the LAST list block in the message.
 */
function extractOptions(content: string): { mainContent: string; options: string[] } {
  const lines = content.trim().split("\n");
  const options: string[] = [];

  // Walk backwards to find the trailing list, skipping empty lines
  let i = lines.length - 1;
  while (i >= 0) {
    const line = lines[i].trim();
    if (line === "") { i--; continue; } // skip empty lines
    // Match: "1. text", "1) text", "- text", "* text", "• text", "— text"
    const match = line.match(/^(?:\d+[\.\)]\s*|[-*•—]\s*)(.+)$/);
    if (match) {
      const text = match[1].replace(/\*\*/g, "").replace(/`/g, "").trim();
      if (text) options.unshift(text);
      i--;
    } else {
      break;
    }
  }

  // Need at least 2 options
  if (options.length < 2) return { mainContent: content, options: [] };

  // Keep everything before the list as main content
  const mainLines = lines.slice(0, i + 1);

  return {
    mainContent: mainLines.join("\n").trim(),
    options,
  };
}

export function ChatMessage({ role, content, isLoading, loadingStatus, isLast, onOptionClick }: ChatMessageProps) {
  const [workingIdx, setWorkingIdx] = useState(0);
  const [dots, setDots] = useState(1);

  useEffect(() => {
    if (!isLoading) return;
    const msgTimer = setInterval(() => setWorkingIdx((prev) => (prev + 1) % WORKING_MESSAGES.length), 3000);
    const dotTimer = setInterval(() => setDots((prev) => (prev % 3) + 1), 500);
    return () => { clearInterval(msgTimer); clearInterval(dotTimer); };
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="flex justify-start">
        <div className="bg-shark-50 dark:bg-shark-800 text-shark-900 dark:text-shark-100 rounded-xl rounded-bl-md px-4 py-3 max-w-[85%]">
          <div className="flex items-center gap-2.5">
            <div className="w-4 h-4 shrink-0">
              <svg className="animate-spin" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2.5" className="text-shark-400" />
                <path d="M8 1.5a6.5 6.5 0 016.5 6.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-action-500" />
              </svg>
            </div>
            <span className="text-sm text-shark-500 dark:text-shark-400 font-medium">
              {loadingStatus || WORKING_MESSAGES[workingIdx]}{".".repeat(dots)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const isUser = role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="rounded-xl px-4 py-2.5 max-w-[85%] text-sm leading-relaxed whitespace-pre-wrap bg-action-400 text-white rounded-br-md">
          {content}
        </div>
      </div>
    );
  }

  // Extract clickable options from assistant messages with lists
  const { mainContent, options } = onOptionClick ? extractOptions(content) : { mainContent: content, options: [] };

  return (
    <div className="flex justify-start">
      <div className="rounded-xl px-4 py-2.5 max-w-[85%] text-sm leading-relaxed bg-shark-50 text-shark-900 rounded-bl-md">
        <div className="prose prose-sm prose-shark max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h1]:text-base [&_h1]:font-bold [&_h1]:my-2 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:my-1.5 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:my-1 [&_strong]:font-semibold [&_code]:bg-shark-200 dark:bg-shark-700 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_pre]:bg-shark-800 [&_pre]:text-shark-100 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:text-xs [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_a]:text-action-500 [&_a]:underline [&_table]:text-xs [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:border-b [&_th]:border-shark-200 [&_td]:px-2 [&_td]:py-1 [&_td]:border-b [&_td]:border-shark-100 dark:border-shark-800 [&_blockquote]:border-l-2 [&_blockquote]:border-action-300 [&_blockquote]:pl-3 [&_blockquote]:text-shark-500 dark:text-shark-400 [&_hr]:my-2 [&_hr]:border-shark-200">
          <ReactMarkdown>{mainContent}</ReactMarkdown>
        </div>
        {options.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-shark-200/50">
            {options.map((option, i) => (
              <button
                key={i}
                onClick={() => onOptionClick?.(option)}
                className="text-xs text-action-600 bg-white dark:bg-shark-800 border border-action-200 dark:border-action-600/30 hover:bg-action-50 dark:hover:bg-action-500/10 hover:border-action-300 px-2.5 py-1.5 rounded-lg transition-colors text-left"
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
