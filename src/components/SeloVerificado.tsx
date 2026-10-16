import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Selo visual de verificação da marca RegTech. */
export function SeloVerificado({ className }: { className?: string }) {
  return (
    <span
      aria-label="RegTech verificada"
      title="RegTech verificada"
      className={cn("ml-1 inline-flex h-[1em] w-[1em] shrink-0 translate-y-[0.08em] items-center justify-center rounded-full bg-sky-500 text-white", className)}
    >
      <Check aria-hidden="true" className="h-[0.72em] w-[0.72em] stroke-[3]" />
    </span>
  );
}
