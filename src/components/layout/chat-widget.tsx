"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  "Which items are running critically low?",
  "Show me assets that are damaged or lost",
  "Who has the most equipment assigned?",
  "What purchase orders need approval?",
  "Overdue asset returns this week",
  "Give me an inventory health summary",
];

const CONVERSATIONS_KEY = "trackio-chat-conversations";
const ACTIVE_CONV_KEY   = "trackio-chat-active";

function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(CONVERSATIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

function saveConversations(convs: Conversation[]) {
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(convs.slice(-20)));
  } catch {}
}

function generateTitle(messages: Message[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "New conversation";
  const text = firstUser.content.slice(0, 40);
  return text.length < firstUser.content.length ? text + "…" : text;
}

export function ChatWidget() {
  const router = useRouter();

  const [isOpen, setIsOpen]       = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeConvId, setActiveConvId]   = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACTIVE_CONV_KEY) || null;
  });
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === "undefined") return [];
    const convs  = loadConversations();
    const activeId = localStorage.getItem(ACTIVE_CONV_KEY);
    return convs.find((c) => c.id === activeId)?.messages || [];
  });
  const [input, setInput]   = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // SSE streaming state
  const [loadingStatus, setLoadingStatus] = useState(""); // live tool status text

  // Typewriter state
  const [typingMsgId, setTypingMsgId]     = useState<string | null>(null);
  const [typingTarget, setTypingTarget]   = useState("");
  const [typingContent, setTypingContent] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);
  const abortRef       = useRef<AbortController | null>(null);

  // Voice input
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<unknown>(null);

  // ── Persist active conversation ────────────────────────────────────────
  useEffect(() => {
    if (!activeConvId || messages.length === 0) return;
    setConversations((prev) => {
      const updated = prev.map((c) =>
        c.id === activeConvId
          ? { ...c, messages, title: generateTitle(messages) }
          : c
      );
      saveConversations(updated);
      return updated;
    });
  }, [messages, activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, typingContent]);

  // Auto-focus on desktop only
  useEffect(() => {
    if (isOpen && !showHistory && window.innerWidth >= 640) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, showHistory]);

  // ── Typewriter animation ───────────────────────────────────────────────
  useEffect(() => {
    if (!typingMsgId || !typingTarget) return;

    const words = typingTarget.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      setTypingMsgId(null);
      return;
    }

    // Adaptive speed: cap total duration at 3.5s
    const msPerWord = Math.min(30, 3500 / words.length);
    let idx = 0;

    const timer = setInterval(() => {
      idx++;
      setTypingContent(words.slice(0, idx).join(" "));
      if (idx >= words.length) {
        clearInterval(timer);
        // Small pause before "finishing" so the cursor blinks once
        setTimeout(() => {
          setTypingMsgId(null);
          setTypingContent("");
          setTypingTarget("");
        }, 120);
      }
    }, msPerWord);

    return () => clearInterval(timer);
  }, [typingMsgId, typingTarget]);

  // ── Conversation management ────────────────────────────────────────────
  function startNewChat() {
    const id = crypto.randomUUID();
    const newConv: Conversation = { id, title: "New conversation", messages: [], createdAt: new Date().toISOString() };
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
      if (updated.length > 0) switchConversation(updated[updated.length - 1].id);
      else startNewChat();
    }
  }

  // ── Voice input ────────────────────────────────────────────────────────
  async function toggleVoiceInput() {
    if (isListening) {
      try { (recognitionRef.current as { stop: () => void })?.stop(); } catch {}
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
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
        const hint = isIOS
          ? "Go to Settings → Safari → Microphone → Allow for this site."
          : "Click the lock icon in the address bar → Site settings → Microphone → Allow.";
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
          if (transcript) setInput((prev) => prev + (prev ? " " : "") + transcript);
        } catch {}
        setIsListening(false);
      };
      recognition.onerror = (event: { error: string }) => {
        setIsListening(false);
        if (event.error === "not-allowed") {
          setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "🎤 Microphone blocked. Check your browser permissions." }]);
        }
      };
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  }

  // ── Cancel in-flight request ───────────────────────────────────────────
  function cancelRequest() {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
      setIsLoading(false);
      setLoadingStatus("");
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "Request cancelled." }]);
    }
  }

  // ── Send message (SSE streaming) ───────────────────────────────────────
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
    setLoadingStatus("");

    const controller = new AbortController();
    abortRef.current  = controller;
    const timeoutId   = setTimeout(() => controller.abort(), 90_000);

    try {
      const apiMessages = newMessages.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/ai/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ messages: apiMessages }),
        signal:  controller.signal,
      });

      clearTimeout(timeoutId);

      // Non-2xx → JSON error response (before streaming starts)
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        if (res.status === 429) throw new Error(errData?.error || "Rate limit reached. Please wait a moment.");
        if (res.status === 401) throw new Error("Session expired. Please refresh the page.");
        throw new Error(errData?.error || "Request failed. Please try again.");
      }

      if (!res.body) throw new Error("No response body.");

      // ── Read SSE stream ──
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          if (!part.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(part.slice(6)) as {
              status?: string;
              text?: string;
              done?: boolean;
              dataChanged?: boolean;
              error?: string;
            };

            if (data.status) {
              setLoadingStatus(data.status);
            }

            if (data.text !== undefined && data.done) {
              setIsLoading(false);
              setLoadingStatus("");

              const newMsgId = crypto.randomUUID();
              setMessages((prev) => [
                ...prev,
                { id: newMsgId, role: "assistant", content: data.text! },
              ]);

              // Start typewriter animation
              setTypingMsgId(newMsgId);
              setTypingTarget(data.text!);
              setTypingContent("");

              if (data.dataChanged) router.refresh();
            }

            if (data.error) {
              setIsLoading(false);
              setLoadingStatus("");
              setMessages((prev) => [
                ...prev,
                { id: crypto.randomUUID(), role: "assistant", content: data.error! },
              ]);
            }
          } catch {}
        }
      }
    } catch (err) {
      clearTimeout(timeoutId);
      setIsLoading(false);
      setLoadingStatus("");

      if ((err as Error).name === "AbortError") {
        // already handled by cancelRequest or timeout
        if (abortRef.current === null) return; // manually cancelled
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: "Request timed out. Try breaking it into smaller steps." },
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
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1)  return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div data-no-print>
      {/* Floating trigger button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-[72px] right-4 sm:bottom-6 sm:right-6 z-50 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-action-400 text-white shadow-lg hover:bg-action-500 hover:shadow-xl transition-all duration-200 flex items-center justify-center"
          aria-label="Open AI Assistant"
          title="AI Assistant"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="sm:w-6 sm:h-6">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        </button>
      )}

      {/* Backdrop */}
      {isOpen && <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-36 right-3 sm:bottom-24 sm:right-6 z-50 w-[calc(100vw-1.5rem)] sm:w-[26rem] h-[60vh] sm:h-[36rem] max-h-[36rem] flex flex-col rounded-2xl border border-shark-100 dark:border-shark-700 bg-white dark:bg-shark-900 shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-action-400 rounded-t-2xl shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-semibold text-white">AI Assistant</span>
                {isLoading && loadingStatus && (
                  <p className="text-[10px] text-white/70 leading-none mt-0.5 truncate max-w-[180px]">{loadingStatus}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setShowHistory(!showHistory)} className="text-white/80 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors" title="Chat history">
                <Icon name="clock" size={14} />
              </button>
              <button onClick={startNewChat} className="text-white/80 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors" title="New conversation">
                <Icon name="plus" size={14} />
              </button>
              <button onClick={() => { setIsOpen(false); setShowHistory(false); }} className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors" aria-label="Close chat">
                <Icon name="x" size={18} />
              </button>
            </div>
          </div>

          {/* History panel */}
          {showHistory ? (
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 py-3 border-b border-shark-100 dark:border-shark-800 flex items-center justify-between">
                <p className="text-sm font-semibold text-shark-700 dark:text-shark-200">Conversations</p>
                <button onClick={() => setShowHistory(false)} className="text-xs text-action-500 hover:text-action-600">Back to chat</button>
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
                        title="Delete"
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
                  <div className="py-5">
                    {/* Empty state header */}
                    <div className="text-center mb-4">
                      <div className="w-12 h-12 rounded-xl bg-action-50 flex items-center justify-center mx-auto mb-2.5">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-action-500">
                          <circle cx="11" cy="11" r="8" />
                          <path d="m21 21-4.35-4.35" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-shark-700 dark:text-shark-200">How can I help?</p>
                      <p className="text-xs text-shark-400 mt-0.5">Search, analyse, and manage your inventory</p>
                    </div>

                    {/* Suggestion chips */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {SUGGESTIONS.map((q) => (
                        <button
                          key={q}
                          onClick={() => sendMessage(q)}
                          className="text-left text-xs text-shark-700 dark:text-shark-300 bg-shark-50 dark:bg-shark-800 border border-shark-100 dark:border-shark-700 rounded-xl px-3 py-2.5 hover:bg-action-50 hover:border-action-200 hover:text-action-700 transition-colors leading-snug"
                        >
                          {q}
                        </button>
                      ))}
                    </div>

                    {/* Capability hint */}
                    <p className="text-center text-[10px] text-shark-400 mt-4">
                      Search assets · Manage stock · Create POs · Staff insights
                    </p>
                  </div>
                )}

                {messages.map((msg, idx) => {
                  const isLast = idx === messages.length - 1;
                  const displayContent = msg.id === typingMsgId ? typingContent : msg.content;
                  return (
                    <ChatMessage
                      key={msg.id}
                      role={msg.role}
                      content={displayContent}
                      isLast={isLast}
                      onOptionClick={(text) => sendMessage(text)}
                    />
                  );
                })}

                {isLoading && (
                  <ChatMessage
                    role="assistant"
                    content=""
                    isLoading
                    loadingStatus={loadingStatus}
                  />
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              <form onSubmit={handleSubmit} className="border-t border-shark-100 dark:border-shark-800 px-3 py-2.5 flex items-center gap-1.5 shrink-0">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isListening ? "Listening…" : "Ask about assets, stock, staff…"}
                  disabled={isLoading}
                  aria-label="Type your message"
                  className={`flex-1 min-w-0 rounded-xl border bg-white dark:bg-shark-800 px-3 py-2 text-sm text-shark-900 dark:text-shark-100 placeholder:text-shark-400 focus:outline-none focus:ring-2 focus:ring-action-400 focus:border-transparent disabled:opacity-50 ${
                    isListening
                      ? "border-red-400 ring-2 ring-red-200"
                      : "border-shark-200 dark:border-shark-700"
                  }`}
                />
                {!isLoading && (
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${
                      isListening
                        ? "bg-red-500 text-white animate-pulse"
                        : "text-shark-400 hover:text-shark-600 dark:text-shark-400 dark:hover:text-shark-300 hover:bg-shark-50 dark:hover:bg-shark-800"
                    }`}
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
                  <button type="button" onClick={cancelRequest} className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Cancel">
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
