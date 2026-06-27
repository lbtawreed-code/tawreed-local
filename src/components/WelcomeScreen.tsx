import { useState } from "react";
import { Play, ArrowRight, Shield, Languages, BookOpen } from "lucide-react";
import mascotFace from "@/assets/tawreed-mascot-face.png";
import logoAr from "@/assets/ppa-logo-ar.png";
import logoEn from "@/assets/ppa-logo-en.png";
import tawreedLogo from "@/assets/tawreed-logo.png";
import { dict, type Lang } from "@/lib/i18n";

const FEATURE_ICONS = [Shield, Languages, BookOpen];

export function WelcomeScreen({
  lang,
  onStart,
}: {
  lang: Lang;
  onStart: () => void;
}) {
  const t = dict[lang];
  const [playVideo, setPlayVideo] = useState(false);
  const logo = lang === "ar" ? logoAr : logoEn;
  const isRtl = lang === "ar";

  return (
    <div className="min-h-[100dvh] gradient-hero relative overflow-hidden">
      <div className="orb w-[480px] h-[480px] -top-[120px] -right-[120px]" style={{ background: "hsl(var(--ppa-blue))" }} />
      <div className="orb w-[360px] h-[360px] -bottom-[80px] -left-[80px]" style={{ background: "hsl(var(--ppa-green))", animationDelay: "4s" }} />
      <div className="orb w-[220px] h-[220px] top-[40%] left-[30%] opacity-25" style={{ background: "hsl(var(--ppa-red))", animationDelay: "7s" }} />

      <div className="relative z-10 max-w-5xl mx-auto px-5 md:px-8 pt-12 md:pt-16 pb-8">
        <div className="mb-6 md:mb-8 grid md:grid-cols-2 gap-6 md:gap-8 items-center">
          <div className="flex justify-center">
            <img
              src={logo}
              alt="PPA"
              className="w-full max-w-[320px] aspect-[16/9] object-contain logo-3d"
            />
          </div>

          <div className="flex justify-center">
            <img
              src={tawreedLogo}
              alt="TAWREED"
              className="w-full max-w-[320px] aspect-[16/9] object-contain logo-3d"
            />
          </div>

        </div>

        <div className="glass-panel rounded-3xl shadow-elegant overflow-hidden grid md:grid-cols-2 max-w-5xl mx-auto">
          <div className="relative p-6 md:p-8 flex items-center justify-center bg-gradient-to-br from-secondary to-secondary/40">
            <div className="relative w-full max-w-[320px] aspect-[9/16] rounded-2xl overflow-hidden shadow-elegant ring-4 ring-white">
              {playVideo ? (
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube-nocookie.com/embed/lsBDQKtq7PY?autoplay=1&rel=0&modestbranding=1"
                  title="TAWREED intro"
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <button onClick={() => setPlayVideo(true)} className="group relative w-full h-full" aria-label={t.watchIntro}>
                  <img src={mascotFace} alt="Tawreed mascot" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute inset-0 flex flex-col items-center justify-end pb-6 gap-3">
                    <div className="relative">
                      <span className="absolute inset-0 rounded-full bg-white/30 animate-ping" />
                      <div className="relative h-16 w-16 rounded-full gradient-primary flex items-center justify-center shadow-glow group-hover:scale-110 transition">
                        <Play size={28} className="text-white ms-1" fill="currentColor" />
                      </div>
                    </div>
                    <span className="text-white font-semibold text-sm drop-shadow-lg">{t.watchIntro}</span>
                  </div>
                </button>
              )}
            </div>
          </div>

          <div className={`p-7 md:p-10 flex flex-col justify-center ${isRtl ? "text-right" : "text-left"}`}>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3" style={{ color: "hsl(var(--ppa-navy))" }}>
              {t.welcome}
            </h2>
            <p className="text-foreground/75 text-base md:text-lg leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: t.desc }} />

            <ul className="space-y-3 mb-7">
              {t.features.map((f, i) => {
                const Icon = FEATURE_ICONS[i];
                return (
                  <li key={i} className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center text-white shrink-0 shadow-soft">
                      <Icon size={16} />
                    </div>
                    <div>
                      <div className="font-semibold" style={{ color: "hsl(var(--ppa-navy))" }}>{f.t}</div>
                      <div className="text-sm text-foreground/60">{f.d}</div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <button
              onClick={onStart}
              className="group w-full gradient-primary text-primary-foreground py-4 rounded-2xl font-bold text-lg shadow-elegant hover:shadow-glow transition flex items-center justify-center gap-2"
            >
              {t.start}
              <ArrowRight size={20} className={`transition group-hover:translate-x-1 ${isRtl ? "rotate-180 group-hover:-translate-x-1" : ""}`} />
            </button>

            <div dir={isRtl ? "rtl" : "ltr"} className="mt-5 rounded-xl bg-amber-50 border border-amber-200 border-s-4 border-s-amber-500 p-4 shadow-sm">
              <div className="flex items-start gap-2.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500 text-white text-[11px] font-bold tracking-wide shrink-0 mt-0.5">
                  {t.disclaimerLabel}
                </span>
                <p className="text-[13px] leading-relaxed text-slate-700">{t.disclaimer}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 text-center text-xs text-foreground/50">
          <div className="cedar-bar w-16 mx-auto rounded-full mb-3 opacity-50" />
          Powered by TAWREED AI AGENT — © 2026 — AMEED ASHQAR
        </div>
      </div>
    </div>
  );
}
