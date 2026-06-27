import { useEffect, useState } from "react";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { ChatInterface } from "@/components/ChatInterface";
import { LangSwitcher } from "@/components/LangSwitcher";
import type { Lang } from "@/lib/i18n";

const LANG_KEY = "tawreed.lang";
const VIEW_KEY = "tawreed.view";

const isLang = (v: unknown): v is Lang => v === "ar" || v === "en" || v === "fr";

const Index = () => {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      const v = localStorage.getItem(LANG_KEY);
      if (isLang(v)) return v;
    } catch {}
    return "ar";
  });
  const [view, setView] = useState<"welcome" | "chat">(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY);
      if (v === "chat" || v === "welcome") return v;
    } catch {}
    return "welcome";
  });

  useEffect(() => {
    try { localStorage.setItem(LANG_KEY, lang); } catch {}
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.title =
      lang === "ar"
        ? "توريد — مساعد الشراء العام"
        : lang === "fr"
        ? "TAWREED — Assistant des marchés publics"
        : "TAWREED — Public Procurement AI";
  }, [lang]);

  useEffect(() => {
    try { localStorage.setItem(VIEW_KEY, view); } catch {}
  }, [view]);

  return (
    <main className="relative">
      {view === "welcome" && (
        <div className="fixed top-4 end-4 z-50">
          <LangSwitcher current={lang} onChange={setLang} />
        </div>
      )}
      {view === "welcome" ? (
        <WelcomeScreen lang={lang} onStart={() => setView("chat")} />
      ) : (
        <ChatInterface lang={lang} onHome={() => setView("welcome")} onLangChange={setLang} />
      )}
    </main>
  );
};

export default Index;
