import { Minus, Plus } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  const { text } = useLocale();

  return (
    <div className="inline-flex items-center gap-1 bg-muted rounded-full p-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-8 h-8 rounded-full bg-background hover:bg-accent flex items-center justify-center transition"
        aria-label={text("نقصان", "Decrease")}
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <span className="w-8 text-center text-sm font-bold tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-8 h-8 rounded-full bg-background hover:bg-accent flex items-center justify-center transition"
        aria-label={text("زيادة", "Increase")}
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
