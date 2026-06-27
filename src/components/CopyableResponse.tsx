import { useRef } from "react";
import CopyButton from "./CopyButton";

interface CopyableResponseProps {
  children: React.ReactNode;
  dir?: "rtl" | "ltr" | "auto";
  className?: string;
}

export default function CopyableResponse({
  children,
  dir = "auto",
  className = "",
}: CopyableResponseProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className={`relative group ${className}`}>
      {/* Copy button — top-right, visible on hover */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
        <CopyButton contentRef={contentRef} />
      </div>

      {/* Content — dir="auto" auto-detects RTL/LTR per paragraph */}
      <div
        ref={contentRef}
        dir={dir}
        className="prose dark:prose-invert max-w-none"
      >
        {children}
      </div>
    </div>
  );
}
