import { Check } from "lucide-react";

export default function CircleProgress({
  value,
  size = 40, // bigger default size
  stroke = 4, // thicker stroke
}: {
  value: number;
  size?: number;
  stroke?: number;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-zinc-600"
          fill="transparent"
        />
        {/* progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-[var(--primary)]"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>

      {/* Inner content */}
      {value >= 100 ? (
        <Check className="absolute w-4 h-4 text-[var(--primary)]" /> // scaled up
      ) : (
        <span className="absolute text-[10px] font-light text-sm text-gray-400">
          {Math.round(value)}%
        </span>
      )}
    </div>
  );
}
