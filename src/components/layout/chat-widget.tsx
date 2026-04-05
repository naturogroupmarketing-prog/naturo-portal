"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ChatMessage } from "@/components/ui/chat-message";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
}

const SUGGESTIONS = [
  "Show low stock items",
  "What assets are overdue?",
];

const CONVERSATIONS_KEY = "trackio-chat-conversations";
const ACTIVE_CONV_KEY = "trackio-chat-active";

function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(CONVERSATIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

function saveConversations(convs: Conversation[]) {
  try {
    // Keep last 20 conversations
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(convs.slice(-20)));
  } catch {}
}

function generateTitle(messages: Message[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "New conversation";
  const text = firstUser.content.slice(0, 40);
  return text.length < firstUser.content.length ? text + "..." : text;
}

export function ChatWidget() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeConvId, setActiveConvId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACTIVE_CONV_KEY) || null;
  });
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === "undefined") return [];
    const convs = loadConversations();
    const activeId = localStorage.getItem(ACTIVE_CONV_KEY);
    const active = convs.find((c) => c.id === activeId);
    return active?.messages || [];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Persist current conversation
  useEffect(() => {
    if (!activeConvId || messages.length === 0) return;
    setConversations((prev) => {
      const updated = prev.map((c) =>
        c.id === activeConvId ? { ...c, messages, title: generateTitle(messages) } : c
      );
      saveConversations(updated);
      return updated;
    });
  }, [messages, activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && !showHistory) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, showHistory]);

  function startNewChat() {
    const id = crypto.randomUUID();
    const newConv: Conversation = {
      id,
      title: "New conversation",
      messages: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [...conversations, newConv];
    setConversations(updated);
    saveConversations(updated);
    setActiveConvId(id);
    localStorage.setItem(ACTIVE_CONV_KEY, id);
    setMessages([]);
    setShowHistory(false);
  }

  function switchConversation(convId: string) {
    const conv = conversations.find((c) => c.id === convId);
    if (!conv) return;
    setActiveConvId(convId);
    localStorage.setItem(ACTIVE_CONV_KEY, convId);
    setMessages(conv.messages);
    setShowHistory(false);
  }

  function deleteConversation(convId: string) {
    const updated = conversations.filter((c) => c.id !== convId);
    setConversations(updated);
    saveConversations(updated);
    if (activeConvId === convId) {
      if (updated.length > 0) {
        switchConversation(updated[updated.length - 1].id);
      } else {
        startNewChat();
      }
    }
  }

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;

    // Auto-create conversation if none active
    let convId = activeConvId;
    if (!convId) {
      const id = crypto.randomUUID();
      const newConv: Conversation = { id, title: "New conversation", messages: [], createdAt: new Date().toISOString() };
      const updated = [...conversations, newConv];
      setConversations(updated);
      saveConversations(updated);
      setActiveConvId(id);
      localStorage.setItem(ACTIVE_CONV_KEY, id);
      convId = id;
    }

    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: text.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const apiMessages = newMessages.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: data.response },
      ]);

      // Auto-refresh the page if AI made changes to data
      if (data.dataChanged) {
        router.refresh();
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-action-400 text-white shadow-lg hover:bg-action-500 hover:shadow-xl transition-all duration-200 flex items-center justify-center"
          aria-label="Open AI Assistant"
          title="AI Assistant"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-40 w-[calc(100vw-3rem)] sm:w-96 h-[calc(100vh-6rem)] sm:h-[32rem] flex flex-col rounded-2xl border border-shark-100 bg-white shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-shark-100 bg-action-400">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-white">AI Assistant</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-white/80 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Chat history"
                title="Chat history"
              >
                <Icon name="clock" size={14} />
              </button>
              <button
                onClick={startNewChat}
                className="text-white/80 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="New chat"
                title="New conversation"
              >
                <Icon name="plus" size={14} />
              </button>
              <button
                onClick={() => { setIsOpen(false); setShowHistory(false); }}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close chat"
              >
                <Icon name="x" size={18} />
              </button>
            </div>
          </div>

          {/* History panel */}
          {showHistory ? (
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 py-3 border-b border-shark-100 flex items-center justify-between">
                <p className="text-sm font-semibold text-shark-700">Conversations</p>
                <button onClick={() => setShowHistory(false)} className="text-xs text-action-500 hover:text-action-600">
                  Back to chat
                </button>
              </div>
              {conversations.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-shark-400">No conversations yet</p>
                </div>
              ) : (
                <div className="divide-y divide-shark-50">
                  {[...conversations].reverse().map((conv) => (
                    <div
                      key={conv.id}
                      className={`px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-shark-50 transition-colors ${conv.id === activeConvId ? "bg-action-50" : ""}`}
                    >
                      <div className="flex-1 min-w-0" onClick={() => switchConversation(conv.id)}>
                        <p className={`text-sm truncate ${conv.id === activeConvId ? "font-semibold text-action-600" : "text-shark-700"}`}>
                          {conv.title}
                        </p>
                        <p className="text-xs text-shark-400 mt-0.5">
                          {conv.messages.length} messages &middot; {timeAgo(conv.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                        className="text-shark-300 hover:text-red-500 p-1 shrink-0"
                        title="Delete conversation"
                      >
                        <Icon name="x" size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-xl bg-action-50 flex items-center justify-center mx-auto mb-3">
                      <Icon name="search" size={20} className="text-action-500" />
                    </div>
                    <p className="text-sm font-medium text-shark-700">How can I help?</p>
                    <p className="text-xs text-shark-400 mt-1">Ask about assets, consumables, or inventory</p>
                    <div className="mt-4 space-y-2">
                      {SUGGESTIONS.map((q) => (
                        <button
                          key={q}
                          onClick={() => sendMessage(q)}
                          className="block w-full text-left text-xs text-action-600 bg-action-50 rounded-lg px-3 py-2 hover:bg-action-100 transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
                ))}
                {isLoading && <ChatMessage role="assistant" content="" isLoading />}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="border-t border-shark-100 px-4 py-3 flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about assets, stock..."
                  disabled={isLoading}
                  aria-label="Type your message"
                  className="flex-1 rounded-xl border border-shark-200 bg-white px-3.5 py-2 text-sm text-shark-900 placeholder:text-shark-400 focus:outline-none focus:ring-2 focus:ring-action-400 focus:border-transparent disabled:opacity-50"
                />
                <Button type="submit" size="sm" disabled={isLoading || !input.trim()}>
                  <Icon name="arrow-right" size={16} />
                </Button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
