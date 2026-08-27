import { cn } from "@/lib/utils";

export function PrismMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-6", className)} fill="none" aria-hidden>
      <path
        d="M12 2.5 21 19.5H3L12 2.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M12 2.5 8 19.5" stroke="currentColor" strokeWidth="1.1" opacity="0.55" />
      <path d="M12 2.5 16 19.5" stroke="currentColor" strokeWidth="1.1" opacity="0.35" />
    </svg>
  );
}
