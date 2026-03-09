import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Sparkles, MapPin, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/travel-advisor`;

const QUICK_PROMPTS = [
  { icon: "🔥", label: "Aktuelle Angebote", prompt: "Welche aktuellen Reiseangebote habt ihr? Zeig mir die besten Deals!" },
  { icon: "🏖️", label: "Strandurlaub", prompt: "Welche Reiseziele eignen sich für einen Strandurlaub? Zeig mir konkrete Angebote mit Preisen." },
  { icon: "🏛️", label: "Kultur & Städte", prompt: "Ich möchte Kultur und Städte erleben. Welche Reisen habt ihr dafür?" },
  { icon: "💰", label: "Günstigste Reise", prompt: "Was ist eure günstigste Reise? Zeig mir das beste Preis-Leistungs-Verhältnis." },
];

const TravelAdvisorChat = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin") || location.pathname.startsWith("/operations") || location.pathname.startsWith("/driver");
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) setShowPulse(false);
  }, [isOpen]);

  // Show teaser tooltip after 8 seconds
  useEffect(() => {
    if (hasInteracted) return;
    const timer = setTimeout(() => {
      setHasInteracted(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, [hasInteracted]);

  const streamChat = useCallback(async (allMessages: Msg[]) => {
    setIsLoading(true);
    let assistantSoFar = "";

    // Abort previous request if any
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      const content = assistantSoFar;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content } : m));
        }
        return [...prev, { role: "assistant", content }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        const errorMsg = resp.status === 429
          ? "⏳ Zu viele Anfragen – bitte kurz warten."
          : resp.status === 402
          ? "Der AI-Service ist vorübergehend nicht verfügbar."
          : errData.error || "Entschuldigung, es gab ein Problem. Bitte versuche es erneut.";
        upsertAssistant(errorMsg);
        setIsLoading(false);
        return;
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            /* ignore */
          }
        }
      }
    } catch (e: any) {
      if (e.name === "AbortError") return;
      console.error("Chat error:", e);
      upsertAssistant("Entschuldigung, der Chat ist gerade nicht verfügbar. Bitte versuche es später erneut. 🔄");
    }

    setIsLoading(false);
  }, []);

  const sendMessage = (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    streamChat(newMessages);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const resetChat = () => {
    abortControllerRef.current?.abort();
    setMessages([]);
    setIsLoading(false);
  };

  if (isAdmin) return null;

  return (
    <>
      {/* Chat Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[9999]"
          >
            {/* Teaser tooltip */}
            <AnimatePresence>
              {!hasInteracted && showPulse && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="absolute -top-2 right-full mr-3 whitespace-nowrap bg-card text-foreground text-xs font-medium px-3 py-2 rounded-xl shadow-lg border border-border"
                >
                  Brauchst du Hilfe? 🗺️
                  <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-card border-r border-b border-border rotate-[-45deg]" />
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => setIsOpen(true)}
              className={cn(
                "relative w-16 h-16 rounded-full shadow-xl",
                "bg-gradient-to-br from-primary to-primary-dark text-primary-foreground",
                "flex items-center justify-center",
                "hover:scale-110 hover:shadow-2xl transition-all duration-300",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              )}
              aria-label="Reiseberater öffnen"
            >
              <Sparkles className="w-7 h-7" />
              {showPulse && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-accent" />
                </span>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed z-[9999]",
              "bottom-0 right-0 w-full sm:bottom-4 sm:right-4 sm:w-[400px] h-[min(600px,100vh)] sm:h-[min(600px,85vh)]",
              "bg-card rounded-2xl shadow-2xl border border-border",
              "flex flex-col overflow-hidden"
            )}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary-dark px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-primary-foreground">Reiseberater</h3>
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      isLoading ? "bg-accent animate-pulse" : "bg-primary-light"
                    )} />
                    <p className="text-xs text-primary-foreground/70">
                      {isLoading ? "Tippt..." : "Online"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={resetChat}
                    className="p-2 text-primary-foreground/50 hover:text-primary-foreground transition-colors rounded-lg hover:bg-primary-foreground/10"
                    aria-label="Chat zurücksetzen"
                    title="Neuer Chat"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-primary-foreground/50 hover:text-primary-foreground transition-colors rounded-lg hover:bg-primary-foreground/10"
                  aria-label="Chat schließen"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth">
              {/* Welcome Message */}
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                    <p className="text-sm text-foreground leading-relaxed">
                      Hallo! 👋 Ich bin dein <strong>Reiseberater</strong> von METROPOL TOURS. Ich kenne alle aktuellen Angebote, Preise und freien Plätze. Wohin soll's gehen?
                    </p>
                  </div>

                  {/* Quick Prompts */}
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_PROMPTS.map((qp, idx) => (
                      <motion.button
                        key={qp.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + idx * 0.05 }}
                        onClick={() => sendMessage(qp.prompt)}
                        className={cn(
                          "text-left px-3 py-2.5 rounded-xl border border-border",
                          "hover:border-primary hover:bg-primary/5 hover:shadow-sm transition-all duration-200",
                          "text-xs text-foreground group"
                        )}
                      >
                        <span className="text-base block mb-0.5 group-hover:scale-110 transition-transform inline-block">{qp.icon}</span>
                        <span className="font-medium">{qp.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Message Bubbles */}
              {messages.map((msg, i) => (
                <motion.div
                  key={`${i}-${msg.role}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "flex",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] px-4 py-2.5 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm"
                        : "bg-muted text-foreground rounded-2xl rounded-tl-sm"
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1 [&>p:last-child]:mb-0 [&>p:first-child]:mt-0 [&_a]:text-primary [&_strong]:text-foreground">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1.5 items-center">
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form
              onSubmit={handleSubmit}
              className="px-3 py-3 border-t border-border bg-card shrink-0"
            >
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Wohin möchtest du reisen?"
                  disabled={isLoading}
                  className={cn(
                    "flex-1 bg-muted rounded-xl px-4 py-2.5 text-sm text-foreground",
                    "placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-primary/30",
                    "disabled:opacity-50 transition-all"
                  )}
                  maxLength={500}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  className="rounded-xl w-10 h-10 shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-1.5 opacity-60">
                KI-gestützt • Antworten können ungenau sein
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TravelAdvisorChat;
