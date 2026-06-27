import type { Lang } from "@/lib/i18n";
import flagLb from "@/assets/flag-lb.png";
import flagUk from "@/assets/flag-uk.png";
import flagFr from "@/assets/flag-fr.png";

const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "ar", label: "العربية", flag: flagLb },
  { code: "en", label: "English", flag: flagUk },
  { code: "fr", label: "Français", flag: flagFr },
];

export function LangSwitcher({
  current,
  onChange,
}: {
  current: Lang;
  onChange: (l: Lang) => void;
}) {
  return (
    <div className="glass-panel rounded-full p-1 flex items-center gap-1 shadow-soft">
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => onChange(l.code)}
          aria-label={l.label}
          className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
            current === l.code
              ? "gradient-primary text-primary-foreground shadow-glow"
              : "text-foreground/70 hover:text-foreground"
          }`}
        >
          <img src={l.flag} alt="" className="h-5 w-5 object-contain drop-shadow" />
          {l.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
