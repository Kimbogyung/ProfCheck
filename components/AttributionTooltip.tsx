"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  label: string | null;
  placement?: "top" | "bottom";
  className?: string;
  children: ReactNode;
};

const TOUCH_AUTO_HIDE_MS = 2000;

export default function AttributionTooltip({
  label,
  placement = "top",
  className,
  children,
}: Props) {
  const [isTouchOpen, setIsTouchOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsTouchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  if (!label) {
    return <div className={className}>{children}</div>;
  }

  function handleTouchToggle() {
    setIsTouchOpen(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(
      () => setIsTouchOpen(false),
      TOUCH_AUTO_HIDE_MS,
    );
  }

  return (
    <div
      ref={containerRef}
      onClick={handleTouchToggle}
      className={`group/tooltip relative ${className ?? ""}`}
    >
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-md bg-text px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-150 group-hover/tooltip:opacity-100 ${
          isTouchOpen ? "opacity-100" : ""
        } ${placement === "top" ? "bottom-full mb-2" : "top-full mt-2"}`}
      >
        {label}
        <span
          className={`absolute left-1/2 -translate-x-1/2 border-4 border-transparent ${
            placement === "top" ? "top-full border-t-text" : "bottom-full border-b-text"
          }`}
        />
      </span>
    </div>
  );
}
