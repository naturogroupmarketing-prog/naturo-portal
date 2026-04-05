"use client";

import { useState, useEffect } from "react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
}

const WORKING_MESSAGES = [
  "Thinking...",
  "Searching the system...",
  "Working on it...",
  "Processing your request...",
  "Almost there...",
];

export function ChatMessage({ role, content, isLoading }: ChatMessageProps) {
  const [workingIdx, setWorkingIdx] = useState(0);
  const [dots, setDots] = useState(1);

  useEffect(() => {
    if (!isLoading) return;
    // Cycle through working messages every 3 seconds
    const msgTimer = setInterval(() => {
      setWorkingIdx((prev) => (prev + 1) % WORKING_MESSAGES.length);
    }, 3000);
    // Animate dots every 500ms
    const dotTimer = setInterval(() => {
      setDots((prev) => (prev % 3) + 1);
    }, 500);
    return () => { clearInterval(msgTimer); clearInterval(dotTimer); };
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="flex justify-start">
        <div className="bg-shark-50 text-shark-900 rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]">
          <div className="flex items-center gap-2.5">
            {/* Spinner */}
            <div className="w-4 h-4 shrink-0">
              <svg className="animate-spin" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2.5" className="text-shark-400" />
                <path d="M8 1.5a6.5 6.5 0 016.5 6.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-action-500" />
              </svg>
            </div>
            <span className="text-sm text-shark-500 font-medium">
              {WORKING_MESSAGES[workingIdx]}{".".repeat(dots)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`rounded-2xl px-4 py-2.5 max-w-[85%] text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-action-400 text-white rounded-br-md"
            : "bg-shark-50 text-shark-900 rounded-bl-md"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
