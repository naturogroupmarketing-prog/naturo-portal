"use client";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
}

export function ChatMessage({ role, content, isLoading }: ChatMessageProps) {
  if (isLoading) {
    return (
      <div className="flex justify-start">
        <div className="bg-shark-50 text-shark-900 rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[85%]">
          <div className="flex gap-1.5 items-center h-5">
            <span className="w-1.5 h-1.5 rounded-full bg-shark-400 animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-shark-400 animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-shark-400 animate-bounce [animation-delay:300ms]" />
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
