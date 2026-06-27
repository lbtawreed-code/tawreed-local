import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Send, House, Sparkles, Mic, Square, FileText, ArrowRight, Trash2, Download, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import mascotFace from "@/assets/tawreed-mascot-face.png";
import tawreedLogo from "@/assets/tawreed-logo.png";
import logoAr from "@/assets/ppa-logo-ar.png";
import logoEn from "@/assets/ppa-logo-en.png";
import { dict, type Lang } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Dynamically route requests based on environment to bypass mixed-content blocks
const WEBHOOK_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5680/webhook/tawreed-local" // Local direct tunnel port from your docker-compose
  : "https://n8n.lbtawreed.online/webhook/tawreed-local"; // Production endpoint
const MSGS_KEY = "tawreed.messages";
const SESSION_KEY = "tawreed.sessionId";

const MAX_AUDIO_BYTES = 15 * 1024 * 1024; // 15MB
const ALLOWED_AUDIO_MIMES = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav"];

type Doc = { name: string; url: string };
type Msg = {
  id: string;
  sender: "user" | "bot";
  text: string;
  docs?: Doc[];
};

interface CopyButtonProps {
  contentRef: React.RefObject<HTMLElement | null>;
  lang: Lang;
  className?: string;
}

// Sub-component: Localized Copy Button with RTL alignment handling
function CopyButton({ contentRef, lang, className = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const labels = {
    ar: { copy: "نسخ", copied: "تم النسخ!" },
    fr: { copy: "Copier", copied: "Copié !" },
    en: { copy: "Copy", copied: "Copied!" },
  };

  const currentLabels = labels[lang] || labels.en;

  const handleCopy = useCallback(async () => {
    const element = contentRef.current;
    if (!element) return;

    try {
      const plainText = element.innerText;
      const isRtl = window.getComputedStyle(element).direction === "rtl";
      const htmlText = `<div dir="${isRtl ? "rtl" : "ltr"}" style="text-align: ${isRtl ? "right" : "left"}; font-family: sans-serif;">${element.innerHTML}</div>`;

      await navigator.clipboard.write([
        new ClipboardItem({
          "text/plain": new Blob([plainText], { type: "text/plain" }),
          "text/html": new Blob([htmlText], { type: "text/html" }),
        }),
      ]);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      await navigator.clipboard.writeText(element.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [contentRef]);

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md
        transition-all duration-200 ease-in-out shadow-sm border border-gray-200/40
        ${copied
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-white/90 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
        } ${className}`}
      title={copied ? currentLabels.copied : currentLabels.copy}
    >
      {copied ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>{currentLabels.copied}</span>
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
          </svg>
          <span>{currentLabels.copy}</span>
        </>
      )}
    </button>
  );
}

function loadSession(): string {
  try {
    const v = localStorage.getItem(SESSION_KEY);
    if (v) return v;
  } catch {}
  const id = "session-" + Date.now();
  try { localStorage.setItem(SESSION_KEY, id); } catch {}
  return id;
}

function loadMessages(): Msg[] | null {
  try {
    const raw = localStorage.getItem(MSGS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter(m => m && m.id && m.sender && typeof m.text === "string");
  } catch {}
  return null;
}

export function ChatInterface({ lang, onHome }: { lang: Lang; onHome: () => void }) {
  const t = dict[lang];
  const sessionIdRef = useRef<string>(loadSession());
  const [messages, setMessages] = useState<Msg[]>(() => loadMessages() ?? []);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [online, setOnline] = useState<"unknown" | "online" | "offline">("unknown");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEnd = useRef<HTMLDivElement>(null);

  // Seed welcome message if empty
  useEffect(() => {
    setMessages((m) => {
      if (m.length === 0) return [{ id: "init", sender: "bot", text: t.welcomeMsg }];
      if (m.length === 1 && m[0].id === "init") return [{ id: "init", sender: "bot", text: t.welcomeMsg }];
      return m;
    });
  }, [lang, t.welcomeMsg]);

  // Persist messages
  useEffect(() => {
    try {
      localStorage.setItem(MSGS_KEY, JSON.stringify(messages.slice(-100)));
    } catch {}
  }, [messages]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Backend status ping
  useEffect(() => {
    let cancelled = false;
    const ping = async () => {
      try {
        await fetch(WEBHOOK_URL, { method: "OPTIONS", mode: "no-cors" });
        if (!cancelled) setOnline("online");
      } catch {
        if (!cancelled) setOnline("offline");
      }
    };
    ping();
    const id = setInterval(ping, 30000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const pushBotResponse = useCallback((data: any) => {
    setMessages((m) => [
      ...m,
      {
        id: crypto.randomUUID(),
        sender: "bot",
        text: data?.output || data?.response || "...",
        docs: Array.isArray(data?.documents) ? data.documents : [],
      },
    ]);
  }, []);

  const send = useCallback(async (text: string) => {
    const val = text.trim();
    if (!val || sending) return;
    setMessages((m) => [...m, { id: crypto.randomUUID(), sender: "user", text: val }]);
    setInput("");
    setSending(true);
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatInput: val,
          sessionId: sessionIdRef.current,
          language: lang,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      pushBotResponse(data);
      setOnline("online");
    } catch {
      setMessages((m) => [...m, { id: crypto.randomUUID(), sender: "bot", text: t.error }]);
      setOnline("offline");
    } finally {
      setSending(false);
    }
  }, [sending, lang, t.error, pushBotResponse]);

  const sendAudio = useCallback(async (blob: Blob) => {
    if (blob.size === 0 || blob.size > MAX_AUDIO_BYTES) {
      setMessages((m) => [...m, { id: crypto.randomUUID(), sender: "bot", text: t.error }]);
      return;
    }
    const mime = blob.type || "audio/webm";
    if (!ALLOWED_AUDIO_MIMES.some((a) => mime.startsWith(a))) {
      setMessages((m) => [...m, { id: crypto.randomUUID(), sender: "bot", text: t.error }]);
      return;
    }
    setMessages((m) => [...m, { id: crypto.randomUUID(), sender: "user", text: "🎤 Voice message" }]);
    setSending(true);
    try {
      const ext = mime.includes("ogg") ? "ogg" : mime.includes("mp4") ? "m4a" : mime.includes("mpeg") ? "mp3" : mime.includes("wav") ? "wav" : "webm";
      const fd = new FormData();
      fd.append("file0", blob, `audio.${ext}`);
      fd.append("sessionId", sessionIdRef.current);
      fd.append("language", lang);
      const res = await fetch(WEBHOOK_URL, { method: "POST", body: fd });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      pushBotResponse(data);
      setOnline("online");
    } catch (err) {
      console.error("[voice] upload failed", err);
      setMessages((m) => [...m, { id: crypto.randomUUID(), sender: "bot", text: t.error }]);
      setOnline("offline");
    } finally {
      setSending(false);
    }
  }, [lang, t.error, pushBotResponse]);

  async function startRecording() {
    if (recording || sending) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = () => {
        const finalMime = mr.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: finalMime });
        stream.getTracks().forEach((tr) => tr.stop());
        if (blob.size > 0) sendAudio(blob);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
    } catch (err) {
      console.error("mic error", err);
      setMessages((m) => [...m, { id: crypto.randomUUID(), sender: "bot", text: "Microphone access denied." }]);
    }
  }

  function stopRecording() {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") mr.stop();
    setRecording(false);
  }

  const clearConversation = useCallback(() => {
    const newId = "session-" + Date.now();
    sessionIdRef.current = newId;
    try { localStorage.setItem(SESSION_KEY, newId); } catch {}
    setMessages([{ id: "init", sender: "bot", text: t.welcomeMsg }]);
  }, [t.welcomeMsg]);

  const logo = lang === "ar" ? logoAr : logoEn;
  const statusDot = online === "online" ? "bg-emerald-500" : online === "offline" ? "bg-red-500" : "bg-amber-400";
  const statusLabel = online === "online"
    ? (lang === "ar" ? "متصل" : lang === "fr" ? "En ligne" : "Online")
    : online === "offline"
    ? (lang === "ar" ? "غير متصل" : lang === "fr" ? "Hors ligne" : "Offline")
    : (lang === "ar" ? "..." : "...");

  return (
    <div className="relative flex min-h-screen h-[100dvh] flex-col overflow-hidden gradient-chat" dir="ltr">
      <div className="orb" style={{ width: 320, height: 320, background: "hsl(var(--ppa-blue))", top: -80, right: -80, opacity: 0.15 }} />
      <div className="orb" style={{ width: 260, height: 260, background: "hsl(var(--ppa-green))", bottom: -60, left: -60, opacity: 0.15, animationDelay: "3s" }} />

      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center opacity-[0.06]">
        <img src={logo} alt="" className="w-[80%] h-[80%] object-contain" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-30 shrink-0 border-b border-white/40 bg-white/60 backdrop-blur-xl" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between gap-3">
          <button
            onClick={onHome}
            className="group relative h-11 w-11 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-soft hover:shadow-glow overflow-hidden"
            style={{ background: "linear-gradient(135deg, hsl(var(--ppa-blue)), hsl(var(--ppa-navy-deep)))" }}
            aria-label="Home"
          >
            <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition" />
            <House size={20} className="text-white relative z-10 group-hover:-translate-y-0.5 transition-transform" strokeWidth={2.4} />
          </button>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/70 border border-white shadow-soft" title={statusLabel}>
              <span className={`h-2 w-2 rounded-full ${statusDot} ${online === "unknown" ? "animate-pulse" : ""}`} />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--ppa-navy))" }}>{statusLabel}</span>
            </div>
            <img src={logo} alt="PPA" className="h-9 object-contain" />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearConversation}
              aria-label={lang === "ar" ? "مسح المحادثة" : lang === "fr" ? "Effacer" : "Clear"}
              title={lang === "ar" ? "مسح المحادثة" : lang === "fr" ? "Effacer la conversation" : "Clear conversation"}
              className="h-10 w-10 rounded-xl flex items-center justify-center bg-white/80 border border-white shadow-soft hover:shadow-glow active:scale-95 transition"
              style={{ color: "hsl(var(--ppa-navy))" }}
            >
              <Trash2 size={17} />
            </button>
            <div className="h-10 w-10 rounded-xl overflow-hidden ring-2 ring-white shadow-soft">
              <img src={tawreedLogo} alt="Tawreed" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      </div>

      {/* Messages Layout */}
      <div className="relative z-10 flex-1 overflow-y-auto" style={{ paddingTop: 16, paddingBottom: 32 }}>
        <div className="max-w-4xl mx-auto px-4 md:px-6 flex flex-col space-y-8">
          {messages.map((m) => (
            <MessageBubble key={m.id} msg={m} lang={lang} onSuggest={send} />
          ))}
          {sending && (
            <div className={`flex ${lang === "ar" ? "justify-end" : "justify-start"} fade-in`} dir="ltr">
              <div className="flex items-end gap-3 max-w-[85%]">
                <img src={mascotFace} alt="" className="h-9 w-9 rounded-full ring-2 ring-white object-cover shadow-md flex-shrink-0" />
                <div className={`glass-panel border border-gray-200 rounded-lg px-5 py-4 shadow-soft ${lang === "ar" ? "rounded-br-sm" : "rounded-bl-sm"}`}>
                  <span className="typing-dot" />
                  <span className="typing-dot mx-1" />
                  <span className="typing-dot" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEnd} />
        </div>
      </div>

      <div className="relative z-10 mt-auto w-full shrink-0">
        {messages.length <= 1 && (
          <div className="max-w-4xl w-full mx-auto px-4 md:px-6 pb-3 fade-in">
            <div className="text-[11px] uppercase tracking-[0.2em] font-bold mb-3 px-1 flex items-center gap-2" style={{ color: "hsl(var(--ppa-navy) / 0.5)" }}>
              <Sparkles size={12} style={{ color: "hsl(var(--ppa-blue))" }} />
              {lang === "ar" ? "اقتراحات" : lang === "fr" ? "Suggestions" : "Try asking"}
            </div>
            <div className="flex flex-wrap gap-2.5">
              {t.suggestions.map((s, i) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  style={{ animationDelay: `${i * 60}ms`, color: "hsl(var(--ppa-navy))" }}
                  className="fade-in group text-xs md:text-sm px-4 py-2.5 rounded-2xl bg-white/85 hover:bg-white border border-white shadow-soft backdrop-blur-md transition-all duration-300 hover:shadow-glow hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 font-medium"
                >
                  <Sparkles size={14} className="flex-shrink-0 group-hover:rotate-12 group-hover:scale-110 transition-transform" style={{ color: "hsl(var(--ppa-blue))" }} />
                  <span>{s}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="w-full border-t border-white/40 bg-gradient-to-t from-white/95 via-white/90 to-white/70 backdrop-blur-2xl">
          <div className="max-w-4xl mx-auto px-4 md:px-6 pt-3 pb-2 flex items-center gap-2.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder={t.placeholder}
              className="flex-1 h-12 px-5 rounded-2xl border-2 border-white bg-white/90 outline-none focus:bg-white transition-all duration-300 text-sm md:text-base placeholder:text-muted-foreground shadow-soft focus:shadow-glow"
            />

            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={sending && !recording}
              aria-label={recording ? "Stop recording" : "Start recording"}
              className={`relative h-12 w-12 shrink-0 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 ${
                recording
                  ? "bg-destructive border-destructive text-destructive-foreground scale-105"
                  : "bg-white/90 border-white shadow-soft hover:shadow-glow active:scale-95"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              style={!recording ? { color: "hsl(var(--ppa-blue))" } : undefined}
            >
              {recording && <span className="pulse-ring" />}
              {recording ? <Square size={18} fill="currentColor" /> : <Mic size={20} />}
            </button>

            <button
              onClick={() => send(input)}
              disabled={sending || !input.trim() || recording}
              aria-label={t.send}
              className="h-12 w-12 shrink-0 rounded-2xl border-2 bg-white/90 border-white shadow-soft hover:shadow-glow active:scale-95 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ color: "hsl(var(--ppa-blue))" }}
            >
              <Send size={20} className={lang === "ar" ? "rotate-180" : ""} />
            </button>
          </div>
          <div
            className="max-w-4xl mx-auto px-4 md:px-6 pb-2 pt-1 text-center text-[10px] md:text-xs leading-tight font-semibold"
            style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))", color: "hsl(var(--ppa-navy) / 0.65)" }}
          >
            {lang === "ar"
              ? "توريد قد يخطئ، القوانين والأنظمة هي المرجع"
              : lang === "fr"
              ? "Tawreed peut se tromper, les lois et règlements font foi"
              : "Tawreed can make mistakes. Laws and regulations are the reference."}
          </div>
        </div>
      </div>
    </div>
  );
}

const MessageBubble = memo(function MessageBubble({ msg, lang, onSuggest }: { msg: Msg; lang: Lang; onSuggest: (text: string) => void }) {
  const isUser = msg.sender === "user";
  const isArabic = lang === "ar";
  const textDir = isArabic ? "rtl" : "ltr";

  // Physical bubble placement:
  // English/French: bot left, user right
  // Arabic: bot right, user left
  const rowPlacement = isUser
    ? isArabic
      ? "mr-auto"
      : "ml-auto"
    : isArabic
      ? "ml-auto"
      : "mr-auto";

  const botRowDirection = isArabic ? "flex-row-reverse" : "flex-row";

  const contentRef = useRef<HTMLDivElement | null>(null);

  const navy = "hsl(var(--ppa-navy-deep))";
  const mdComponents = useMemo(() => ({
    a: ({ node, href, ...props }: any) => (
      <a
        {...props}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        referrerPolicy="no-referrer"
        className="font-bold underline"
        style={{ color: navy }}
      />
    ),
    h1: ({ node, ...props }: any) => <h1 {...props} className="font-bold mt-3 mb-2" style={{ color: navy }} />,
    h2: ({ node, ...props }: any) => <h2 {...props} className="font-bold mt-3 mb-2" style={{ color: navy }} />,
    h3: ({ node, ...props }: any) => <h3 {...props} className="font-bold mt-2 mb-1.5" style={{ color: navy }} />,
    h4: ({ node, ...props }: any) => <h4 {...props} className="font-bold mt-2 mb-1.5" style={{ color: navy }} />,
    strong: ({ node, ...props }: any) => <strong {...props} className="font-bold" style={{ color: navy }} />,
    ul: ({ node, ...props }: any) => <ul {...props} className="list-disc ps-6 my-2 space-y-1.5" />,
    ol: ({ node, ...props }: any) => <ol {...props} className="list-decimal ps-6 my-2 space-y-1.5" />,
    li: ({ node, ...props }: any) => <li {...props} className="leading-relaxed" />,
    p: ({ node, ...props }: any) => <p {...props} className="my-2 leading-relaxed" />,
    table: ({ node, ...props }: any) => (
      <div className="overflow-x-auto my-3"><table {...props} className="min-w-full border-collapse text-sm" /></div>
    ),
    th: ({ node, ...props }: any) => <th {...props} className="border border-border bg-muted/50 px-3 py-2 font-semibold text-start" />,
    td: ({ node, ...props }: any) => <td {...props} className="border border-border px-3 py-2 align-top" />,
    code: ({ node, inline, ...props }: any) => inline
      ? <code {...props} className="px-1.5 py-0.5 rounded bg-muted text-[0.85em] font-mono" />
      : <code {...props} className="block p-3 rounded-lg bg-muted text-[0.85em] font-mono overflow-x-auto" />,
  }), []);

  if (isUser) {
    return (
      <div className="flex w-full fade-in" dir="ltr">
        <div className={`max-w-[85%] ${rowPlacement} gradient-primary text-primary-foreground rounded-3xl px-5 py-3 shadow-elegant`}>
          <p
            dir={textDir}
            className={`text-sm md:text-base whitespace-pre-wrap leading-relaxed ${
              isArabic ? "text-right" : "text-left"
            }`}
          >
            {msg.text}
          </p>
        </div>
      </div>
    );
  }

  const docs = (msg.docs || []).filter((d) => d && d.name && d.url && d.url !== "undefined");
  const nextActions = getNextActions(lang);

  return (
    <div className="flex w-full fade-in" dir="ltr">
      <div className={`flex ${botRowDirection} items-end gap-3 max-w-[90%] w-full ${rowPlacement}`}>
        <img src={mascotFace} alt="" className="h-9 w-9 rounded-full ring-2 ring-white object-cover shadow-md flex-shrink-0" />

        <Card
          className={`relative flex-1 glass-panel border border-gray-200 rounded-lg px-5 py-4 shadow-soft ${
            isArabic ? "rounded-br-sm" : "rounded-bl-sm"
          }`}
        >
          <CopyButton
            contentRef={contentRef}
            lang={lang}
            className={`absolute top-3 z-10 opacity-70 hover:opacity-100 ${
              isArabic ? "left-3" : "right-3"
            }`}
          />

          <div
            ref={contentRef}
            dir={textDir}
            className={`chat-prose prose prose-sm max-w-none text-foreground/90 leading-relaxed flex flex-col ${
              isArabic ? "pl-20 text-right" : "pr-20 text-left"
            }`}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]} components={mdComponents}>
              {msg.text}
            </ReactMarkdown>
          </div>

          {docs.length > 0 && (
            <div className="mt-4 grid sm:grid-cols-2 gap-2.5">
              {docs.map((d) => {
                const isExternal = /^https?:\/\//i.test(d.url);
                return (
                  <a
                    key={d.url}
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                    className="group flex items-center gap-3 px-3.5 py-3 rounded-xl bg-white border border-border hover:shadow-glow hover:-translate-y-0.5 transition-all"
                    style={{ borderColor: "hsl(var(--ppa-navy-deep) / 0.18)" }}
                  >
                    <div
                      className="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, hsl(var(--ppa-blue) / 0.15), hsl(var(--ppa-navy-deep) / 0.15))", color: "hsl(var(--ppa-navy-deep))" }}
                    >
                      <FileText size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold truncate" style={{ color: "hsl(var(--ppa-navy-deep))" }}>{d.name}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        {isExternal ? <ExternalLink size={10} /> : <Download size={10} />}
                        {isExternal
                          ? (lang === "ar" ? "فتح" : lang === "fr" ? "Ouvrir" : "Open")
                          : (lang === "ar" ? "تنزيل" : lang === "fr" ? "Télécharger" : "Download")}
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}

          {msg.id !== "init" && (
            <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap gap-2">
              <Button size="sm" variant="default" onClick={() => onSuggest(nextActions[0])} className="gap-1.5">
                <ArrowRight size={14} className={isArabic ? "rotate-180" : ""} /> {nextActions[0]}
              </Button>
              <Button size="sm" variant="outline" onClick={() => onSuggest(nextActions[1])} className="gap-1.5">
                <Sparkles size={14} /> {nextActions[1]}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
});

function getNextActions(lang: Lang): [string, string] {
  if (lang === "ar") return ["أخبرني المزيد", "أعطني مثالاً"];
  if (lang === "fr") return ["En savoir plus", "Donnez-moi un exemple"];
  return ["Tell me more", "Give me an example"];
}
