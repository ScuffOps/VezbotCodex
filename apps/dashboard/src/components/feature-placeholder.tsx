import { Clock3 } from "lucide-react";

interface FeaturePlaceholderProps {
  title: string;
  description: string;
  commandHint?: string;
  phase?: string;
}

export function FeaturePlaceholder({
  title,
  description,
  commandHint,
  phase = "Planned for a later phase",
}: FeaturePlaceholderProps) {
  return (
    <div className="glass-panel p-8 animate-fade-in">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-2">Feature staged</p>
          <h2 className="text-2xl font-semibold">{title}</h2>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
          <Clock3 className="w-3.5 h-3.5" />
          {phase}
        </span>
      </div>

      <p className="text-muted-foreground mb-4">{description}</p>

      {commandHint ? (
        <p className="text-sm text-muted">
          Discord fallback: <code className="text-primary">{commandHint}</code>
        </p>
      ) : null}
    </div>
  );
}
