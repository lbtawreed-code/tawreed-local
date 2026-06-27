import { useState, useCallback } from "react";

interface CopyButtonProps {
  contentRef: React.RefObject<HTMLElement | null>;
  className?: string;
}

export default function CopyButton({ contentRef, className = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

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
      const element = contentRef.current;
      if (!element) return;
      await navigator.clipboard.writeText(element.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [contentRef]);

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md
        transition-all duration-200 ease-in-out
        ${copied
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
        } ${className}`}
      title={copied ? "تم النسخ! / Copied!" : "نسخ / Copy"}
    >
      {copied ? (
        <>
          {/* Checkmark icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>تم النسخ!</span>
        </>
      ) : (
        <>
          {/* Clipboard icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
          </svg>
          <span>نسخ</span>
        </>
      )}
    </button>
  );
}
