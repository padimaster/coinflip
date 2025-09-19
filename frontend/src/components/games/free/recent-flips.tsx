import { cn } from "@/lib/utils";
import { FlipEntry } from "@/lib/store";

interface RecentFlipsProps {
  history: FlipEntry[];
  maxFlips?: number;
  title?: string;
  className?: string;
}

export default function RecentFlips({ 
  history, 
  maxFlips = 8, 
  title = "Recent Flips",
  className 
}: RecentFlipsProps) {
  const recentFlips = history.slice(0, maxFlips).reverse();

  return (
    <div className={cn("w-full max-w-sm", className)}>
      <h3 className="text-lg font-bold text-center mb-4 text-gray-200">{title}</h3>
      <div className="flex flex-wrap gap-2 justify-center">
        {recentFlips.map((flip) => (
          <div
            key={flip.id}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-all duration-200 hover:scale-110 border-2",
              flip.result === "heads" 
                ? "bg-pink-100 border-[var(--kawaii-pink)] text-pink-500" 
                : "bg-blue-100 border-[var(--kawaii-blue)] text-blue-500"
            )}
          >
            {flip.result === "heads" ? "H" : "T"}
          </div>
        ))}
      </div>
    </div>
  );
}
