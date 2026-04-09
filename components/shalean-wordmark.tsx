import { cn } from "@/lib/utils";

type ShaleanWordmarkProps = {
  className?: string;
  /** Tailwind classes for the full stop (default: emerald green). */
  dotClassName?: string;
};

/**
 * Brand text “Shalean” with a green full stop after the final “n”.
 * Parent links should set aria-label (e.g. "Shalean Home") so screen readers
 * don’t read the punctuation as a separate cue.
 */
export function ShaleanWordmark({ className, dotClassName }: ShaleanWordmarkProps) {
  return (
    <span className={cn(className)}>
      Shalean
      <span className={cn("text-emerald-500", dotClassName)} aria-hidden="true">
        .
      </span>
    </span>
  );
}
