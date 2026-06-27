export type Lang = "ar" | "en" | "fr";

type Feature = { t: string; d: string };

type Entry = {
  title: string;
  tagline: string;
  subtitle: string;
  welcome: string;
  desc: string;
  watchIntro: string;
  start: string;
  features: Feature[];
  disclaimer: string;
  disclaimerLabel: string;
  welcomeMsg: string;
  placeholder: string;
  send: string;
  error: string;
  suggestions: string[];
};

export const dict: Record<Lang, Entry> = {
  en: {
    title: "TAWREED",
    tagline: "Public Procurement AI",
    subtitle: "Your intelligent guide to Lebanese public procurement",
    welcome: "Welcome to TAWREED",
    desc: "I help you understand <strong>Lebanon's Public Procurement Law 244/2021</strong>, navigate procedures, and find the right answers — fast, accurate, and in your language.",
    watchIntro: "Watch intro",
    start: "Start chatting",
    features: [
      { t: "Trusted source", d: "Grounded in official law and regulations." },
      { t: "Trilingual", d: "Arabic, English & French." },
      { t: "Knowledge base", d: "Procedures, articles & guidance." },
    ],
    disclaimer: "TAWREED is an AI assistant. Responses may contain errors — official laws and regulations remain the sole legal reference.",
    disclaimerLabel: "Notice",
    welcomeMsg: "Hello! I'm TAWREED, your assistant on Lebanese public procurement. How can I help you today?",
    placeholder: "Ask anything about public procurement…",
    send: "Send",
    error: "Sorry, something went wrong. Please try again.",
    suggestions: [
      "What are procurement methods?",
      "What is a framework agreement?",
      "What are financial thresholds?",
    ],
  },
  ar: {
    title: "توريد",
    tagline: "ذكاء الشراء العام",
    subtitle: "دليلك الذكي إلى الشراء العام في لبنان",
    welcome: "أهلاً بك في توريد",
    desc: "أساعدك على فهم <strong>قانون الشراء العام رقم 244/2021</strong>، والتنقّل في الإجراءات، وإيجاد الإجابات الدقيقة بسرعة وبلغتك.",
    watchIntro: "شاهد المقدمة",
    start: "ابدأ المحادثة",
    features: [
      { t: "مصدر موثوق", d: "مبني على القانون والأنظمة الرسمية." },
      { t: "ثلاثي اللغة", d: "العربية والإنكليزية والفرنسية." },
      { t: "قاعدة معرفة", d: "إجراءات، مواد، وإرشادات." },
    ],
    disclaimer: "توريد مساعد ذكاء اصطناعي. قد تحتوي الإجابات على أخطاء — تبقى القوانين والأنظمة الرسمية المرجع القانوني الوحيد.",
    disclaimerLabel: "تنبيه",
    welcomeMsg: "مرحباً! أنا توريد، مساعدك في الشراء العام اللبناني. كيف يمكنني مساعدتك اليوم؟",
    placeholder: "اسأل أي شيء عن الشراء العام…",
    send: "إرسال",
    error: "عذراً، حدث خطأ ما. يُرجى المحاولة مجدداً.",
    suggestions: [
      "ما هي طرق الشراء؟",
      "ما هو الاتفاق الإطاري؟",
      "ما هي السقوف المالية؟",
    ],
  },
  fr: {
    title: "TAWREED",
    tagline: "IA des Marchés Publics",
    subtitle: "Votre guide intelligent des marchés publics libanais",
    welcome: "Bienvenue sur TAWREED",
    desc: "Je vous aide à comprendre la <strong>loi libanaise 244/2021</strong> sur les marchés publics, à naviguer les procédures et à trouver les bonnes réponses — vite et dans votre langue.",
    watchIntro: "Voir l'intro",
    start: "Commencer",
    features: [
      { t: "Source fiable", d: "Basé sur la loi et les règlements officiels." },
      { t: "Trilingue", d: "Arabe, anglais et français." },
      { t: "Base de connaissances", d: "Procédures, articles et conseils." },
    ],
    disclaimer: "TAWREED est un assistant IA. Les réponses peuvent contenir des erreurs — les lois et règlements officiels restent la seule référence.",
    disclaimerLabel: "Avis",
    welcomeMsg: "Bonjour ! Je suis TAWREED, votre assistant pour les marchés publics libanais. Comment puis-je vous aider ?",
    placeholder: "Posez votre question sur les marchés publics…",
    send: "Envoyer",
    error: "Désolé, une erreur est survenue. Veuillez réessayer.",
    suggestions: [
      "Quelles sont les méthodes d'achat ?",
      "Qu'est-ce qu'un accord-cadre ?",
      "Quels sont les seuils financiers ?",
    ],
  },
};
