"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "What is trackio?",
  "How does asset tracking work?",
  "What pricing plans are available?",
  "Can I manage multiple locations?",
  "Is there a free trial?",
];

const KNOWLEDGE_BASE: Record<string, string> = {
  // What is trackio
  "what is trackio|what does trackio do|tell me about trackio|about trackio":
    "trackio is an asset and supply tracking platform built for operational teams. It helps you track equipment, manage consumable supplies, and keep every location accountable — all from one clear system. No more spreadsheets or guesswork.",

  // Asset tracking
  "asset tracking|track assets|track equipment|how does tracking work":
    "With trackio, every asset gets a clear status — Available, Assigned, Checked Out, Damaged, or Lost. You can assign equipment to staff, track who has what, manage returns, and get instant visibility across all your locations.",

  // Supply management
  "supply|consumable|stock|stock management":
    "trackio tracks consumable stock levels across every location. You get automatic low-stock alerts before items run out, can set minimum thresholds, and monitor usage patterns over time. Staff can request supplies directly through the app.",

  // Pricing
  "pricing|cost|price|how much|plans|subscription":
    "trackio offers flexible pricing plans to suit teams of all sizes. We have a free trial so you can explore the platform before committing. Visit our pricing page or contact us for detailed plan information and custom enterprise quotes.",

  // Free trial
  "free trial|try free|trial|demo|test":
    "Yes! trackio offers a 14-day free trial with full access to all features. No credit card required to get started. Simply click 'Get Started Free' to create your account and start tracking immediately.",

  // Multiple locations
  "multiple locations|multi-location|branches|locations|regions":
    "Absolutely! trackio is built for multi-location teams. You can manage assets and supplies across unlimited branches, grouped by state or region. Each location shows its own stock counts, staff assignments, and alert badges at a glance.",

  // Staff
  "staff|team|users|employees|roles|permissions":
    "trackio supports role-based access with three levels: Super Admin (full platform control), Branch Manager (location-level management), and Staff (view assigned items, request supplies, report damage). Each role sees a tailored dashboard.",

  // Reports
  "reports|reporting|analytics|data|insights":
    "trackio provides comprehensive reporting including asset status breakdowns, supply usage trends, financial portfolio tracking, operations health scores, and regional performance comparisons. Export data to CSV anytime.",

  // Damage / returns
  "damage|return|lost|missing|broken":
    "Staff can report damage directly in the app with details and photos. Managers get instant notifications and can track all damage reports, returns, and lost items. The operations health score reflects unresolved issues so nothing slips through.",

  // Purchase orders
  "purchase order|order|po|procurement|buying":
    "trackio includes a full purchase order workflow. Create POs, track approval status, and mark items as received. Low-stock alerts can trigger reorder reminders, and pending POs are visible right from the dashboard.",

  // Inspections
  "inspection|condition check|maintenance|check":
    "Schedule regular condition checks and inspections for your assets. Staff receive reminders when inspections are due, and managers can track completion rates and flag items that need attention.",

  // Security
  "security|secure|safe|data protection|privacy":
    "trackio takes security seriously. We use encrypted connections, role-based access controls, and activity logging so you always know who did what. Your data is protected and access is limited to authorized team members only.",

  // Mobile
  "mobile|phone|app|ios|android":
    "trackio is fully responsive and works beautifully on mobile devices. Staff can check their assigned items, request supplies, and report damage right from their phone. Managers can monitor operations on the go.",

  // Getting started
  "get started|sign up|start|begin|onboard":
    "Getting started is easy! Sign up for a free 14-day trial, add your locations, import your assets and supplies, invite your team, and you're ready to go. Our import tool makes it simple to bring in existing data from spreadsheets.",
};

function findAnswer(question: string): string {
  const q = question.toLowerCase().trim();

  for (const [patterns, answer] of Object.entries(KNOWLEDGE_BASE)) {
    const keywords = patterns.split("|");
    if (keywords.some((kw) => q.includes(kw))) {
      return answer;
    }
  }

  // Greeting
  if (/^(hi|hello|hey|howdy|good morning|good afternoon)/i.test(q)) {
    return "Hi there! I'm the trackio assistant. I can answer questions about our asset and supply tracking platform. What would you like to know?";
  }

  // Thank you
  if (/thank|thanks|cheers/i.test(q)) {
    return "You're welcome! If you have any other questions about trackio, feel free to ask. You can also get started with a free 14-day trial anytime.";
  }

  // Default
  return "Great question! I'd love to help you with that. For more detailed information, I'd recommend reaching out to our team directly or starting a free 14-day trial to explore the platform firsthand. Is there anything specific about asset tracking, supply management, or multi-location operations I can help with?";
}

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm the trackio assistant. Ask me anything about our asset and supply tracking platform. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = (text?: string) => {
    const question = text || input.trim();
    if (!question) return;

    const userMsg: Message = { role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const answer = findAnswer(question);
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
      setIsTyping(false);
    }, 600 + Math.random() * 800);
  };

  return (
    <>
      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] animate-[fadeInUp_0.25s_ease-out]">
          <div className="bg-white rounded-2xl border border-shark-200 shadow-2xl shadow-shark-300/30 overflow-hidden flex flex-col" style={{ height: "520px" }}>
            {/* Header */}
            <div className="bg-action-500 px-5 py-4 flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a7 7 0 017 7c0 3.87-3.13 7-7 7s-7-3.13-7-7a7 7 0 017-7z" />
                  <path d="M12 16v2" />
                  <path d="M8 20h8" />
                  <circle cx="9" cy="9" r="1" fill="white" />
                  <circle cx="15" cy="9" r="1" fill="white" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">trackio Assistant</p>
                <p className="text-[11px] text-white/70">Ask me anything about trackio</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-shark-50/30">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                      msg.role === "user"
                        ? "bg-action-500 text-white rounded-br-md"
                        : "bg-white border border-shark-100 dark:border-shark-800 text-shark-700 rounded-bl-md shadow-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-shark-100 dark:border-shark-800 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-shark-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-shark-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-shark-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />

              {/* Suggested questions - only show at start */}
              {messages.length <= 1 && !isTyping && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] font-medium text-shark-400 uppercase tracking-wider">Suggested questions</p>
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSend(q)}
                      className="block w-full text-left text-[12px] text-action-600 bg-white hover:bg-action-50 border border-shark-100 dark:border-shark-800 hover:border-action-200 rounded-xl px-3 py-2 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-shark-100 dark:border-shark-800 px-3 py-3 bg-white shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your question..."
                  className="flex-1 text-sm text-shark-800 placeholder:text-shark-400 bg-shark-50 border border-shark-100 dark:border-shark-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-action-300 focus:ring-2 focus:ring-action-100 transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-9 h-9 rounded-xl bg-action-500 hover:bg-action-600 disabled:bg-shark-200 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${
          isOpen
            ? "bg-shark-800 hover:bg-shark-900 shadow-shark-300/40"
            : "bg-action-500 hover:bg-action-600 shadow-action-300/40"
        }`}
      >
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            <circle cx="9" cy="10" r="0.5" fill="white" stroke="none" />
            <circle cx="12" cy="10" r="0.5" fill="white" stroke="none" />
            <circle cx="15" cy="10" r="0.5" fill="white" stroke="none" />
          </svg>
        )}

        {/* Notification dot when closed */}
        {!isOpen && (
          <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
          </span>
        )}
      </button>
    </>
  );
}
