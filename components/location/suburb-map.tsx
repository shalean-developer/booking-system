"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type SuburbMapProps = {
  mapUrl: string;
  title: string;
  className?: string;
  loadingText?: string;
};

export function SuburbMap({ mapUrl, title, className, loadingText = "Loading local map..." }: SuburbMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isReady) return;
    const element = containerRef.current;
    if (!element) return;

    if (typeof window !== "undefined" && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsReady(true);
              observer.disconnect();
            }
          });
        },
        { rootMargin: "200px" }
      );

      observer.observe(element);
      return () => observer.disconnect();
    }

    setIsReady(true);
  }, [isReady]);

  return (
    <div ref={containerRef} className={cn("overflow-hidden rounded-3xl border border-gray-200 shadow-xl", className)}>
      {isReady ? (
        <iframe
          title={title}
          src={mapUrl}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          className="h-[28rem] w-full"
        />
      ) : (
        <div className="flex h-[28rem] w-full items-center justify-center bg-gradient-to-br from-primary/10 via-white to-primary/5 text-sm font-medium text-primary/70 animate-pulse">
          {loadingText}
        </div>
      )}
    </div>
  );
}

