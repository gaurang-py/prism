"use client";

import { modelsFor } from "@/lib/models";
import { useStudio } from "@/context/studio-context";
import { cn } from "@/lib/utils";

export function ModelPicker() {
  const { modality, selectedModelId, setSelectedModelId } = useStudio();
  const models = modelsFor(modality);

  return (
    <div className="grid grid-cols-2 gap-2">
      {models.map((model) => {
        const selected = model.id === selectedModelId;
        return (
          <button
            key={model.id}
            type="button"
            onClick={() => setSelectedModelId(model.id)}
            className={cn(
              "rounded-xl border px-3 py-2.5 text-left transition-all",
              selected
                ? "border-gold/55 bg-gold/12 shadow-[0_0_0_1px_oklch(0.84_0.09_85_/_0.18)]"
                : "border-border/70 bg-card/40 hover:border-gold/25 hover:bg-card/80",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-[13px] font-medium tracking-tight text-foreground">
                {model.name}
              </span>
              <span
                className={cn(
                  "shrink-0 text-[11px] tabular-nums",
                  selected ? "text-gold" : "text-muted-foreground",
                )}
              >
                {model.mockCredits}
              </span>
            </div>
            <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
              {model.tagline}
            </p>
          </button>
        );
      })}
    </div>
  );
}
