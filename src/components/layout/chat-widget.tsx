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

  // Only auto-focus on desktop — on mobile the keyboard should not open automatically
  useEffect(() => {
    if (isOpen && !showHistory && window.innerWidth >= 640) {
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

  const abortRef = useRef<AbortController | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<unknown>(null);

  async function toggleVoiceInput() {
    if (isListening) {
      if (recognitionRef.current) {
        try { (recognitionRef.current as { stop: () => void }).stop(); } catch {}
      }
      setIsListening(false);
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const W = window as any;
      const SpeechRecognition = W.SpeechRecognition || W.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "Voice input is not supported in this browser. Try Chrome, Edge, or Safari." }]);
        return;
      }

      // Request microphone permission first, then release the stream
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop()); // Release mic so SpeechRecognition can use it
      } catch {
        const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        const hint = isIOS
          ? "Go to Settings → Safari → Microphone → Allow for this site. Or install trackio as an app: tap Share → Add to Home Screen."
          : isAndroid
          ? "Tap the lock icon in the address bar → Permissions → Microphone → Allow. Or install trackio: tap ⋮ → Install app."
          : "Click the lock/site icon in the address bar → Site settings → Microphone → Allow. Or install trackio as a desktop app for permanent access.";
        setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: `🎤 Microphone access required.\n\n${hint}` }]);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-AU";
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => {
        try {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInput((prev) => prev + (prev ? " " : "") + transcript);
          }
        } catch {}
        setIsListening(false);
      };

      recognition.onerror = (event: { error: string }) => {
        setIsListening(false);
        if (event.error === "not-allowed") {
          setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "🎤 Microphone blocked. Check your browser permissions or install trackio as an app for permanent mic access." }]);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch (err) {
      setIsListening(false);
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "Voice input failed. Please check microphone permissions in your browser settings." }]);
    }
  }

  function cancelRequest() {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      setIsLoading(false);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: "Request cancelled." },
      ]);
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

    // Create abort controller with 60s timeout
    const controller = new AbortController();
    abortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const apiMessages = newMessages.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        if (res.status === 429) throw new Error("Rate limit reached. Please wait a moment.");
        if (res.status === 401) throw new Error("Session expired. Please refresh the page.");
        throw new Error(errorData?.error || "Request failed. Please try again.");
      }

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: data.response || "Done." },
      ]);

      if (data.dataChanged) {
        router.refresh();
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: "Request timed out. The task may have been too complex. Try breaking it into smaller steps." },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: (err as Error).message || "Something went wrong. Please try again." },
        ]);
      }
    } finally {
      clearTimeout(timeoutId);
      abortRef.current = null;
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
    <div data-no-print>
      {/* Floating button — small on mobile to avoid blocking content */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-action-400 text-white shadow-lg hover:bg-action-500 hover:shadow-xl transition-all duration-200 flex items-center justify-center safe-bottom"
          aria-label="Open AI Assistant"
          title="AI Assistant"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="sm:w-6 sm:h-6">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        </button>
      )}

      {/* Backdrop — click to close */}
      {isOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
      )}

      {/* Chat panel — floating on all screens */}
      {isOpen && (
        <div className="fixed bottom-20 right-3 sm:bottom-6 sm:right-6 z-40 w-[calc(100vw-1.5rem)] sm:w-96 h-[60vh] sm:h-[32rem] max-h-[32rem] flex flex-col rounded-2xl border border-shark-100 dark:border-shark-700 bg-white dark:bg-shark-900 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-shark-100 bg-action-400 rounded-t-2xl">
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
              <div className="px-4 py-3 border-b border-shark-100 dark:border-shark-800 flex items-center justify-between">
                <p className="text-sm font-semibold text-shark-700 dark:text-shark-200">Conversations</p>
                <button onClick={() => setShowHistory(false)} className="text-xs text-action-500 hover:text-action-600">
                  Back to chat
                </button>
              </div>
              {conversations.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-shark-400">No conversations yet</p>
                </div>
              ) : (
                <div className="divide-y divide-shark-50 dark:divide-shark-800">
                  {[...conversations].reverse().map((conv) => (
                    <div
                      key={conv.id}
                      className={`px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-shark-50 dark:hover:bg-shark-800 transition-colors ${conv.id === activeConvId ? "bg-action-50 dark:bg-action-900/30" : ""}`}
                    >
                      <div className="flex-1 min-w-0" onClick={() => switchConversation(conv.id)}>
                        <p className={`text-sm truncate ${conv.id === activeConvId ? "font-semibold text-action-600" : "text-shark-700 dark:text-shark-300"}`}>
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
                    <p className="text-sm font-medium text-shark-700 dark:text-shark-200">How can I help?</p>
                    <p className="text-xs text-shark-400 dark:text-shark-500 mt-1">Ask about assets, consumables, or inventory</p>
                    <div className="mt-4 space-y-2">
                      {SUGGESTIONS.map((q) => (
                        <button
                          key={q}
                          onClick={() => sendMessage(q)}
                          className="block w-full text-left text-xs text-action-600 dark:text-action-400 bg-action-50 dark:bg-action-900/20 rounded-lg px-3 py-2 hover:bg-action-100 dark:hover:bg-action-900/30 transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((msg, idx) => (
                  <ChatMessage key={msg.id} role={msg.role} content={msg.content} isLast={idx === messages.length - 1} onOptionClick={(text) => sendMessage(text)} />
                ))}
                {isLoading && <ChatMessage role="assistant" content="" isLoading />}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="border-t border-shark-100 dark:border-shark-800 px-3 py-2.5 flex items-center gap-1.5">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isListening ? "Listening..." : "Ask about assets, stock..."}
                  disabled={isLoading}
                  aria-label="Type your message"
                  className={`flex-1 min-w-0 rounded-xl border bg-white dark:bg-shark-800 px-3 py-2 text-sm text-shark-900 dark:text-shark-100 placeholder:text-shark-400 dark:placeholder:text-shark-500 focus:outline-none focus:ring-2 focus:ring-action-400 focus:border-transparent disabled:opacity-50 ${isListening ? "border-red-400 ring-2 ring-red-200" : "border-shark-200 dark:border-shark-700"}`}
                />
                {!isLoading && (
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${isListening ? "bg-red-500 text-white animate-pulse" : "text-shark-400 hover:text-shark-600 dark:hover:text-shark-300 hover:bg-shark-50 dark:hover:bg-shark-800"}`}
                    title={isListening ? "Stop listening" : "Voice input"}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                      <path d="M19 10v2a7 7 0 01-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  </button>
                )}
                {isLoading ? (
                  <button type="button" onClick={cancelRequest} className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <Icon name="x" size={16} />
                  </button>
                ) : (
                  <button type="submit" disabled={!input.trim()} className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-action-400 text-white hover:bg-action-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <Icon name="arrow-right" size={16} />
                  </button>
                )}
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
