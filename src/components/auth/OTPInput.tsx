"use client";

import { useState, useRef, useEffect } from "react";
import { useHaptic } from "@/hooks/useHaptic";
import { cn } from "@/lib/utils";

interface OTPInputProps {
  length?: number;
  onComplete?: (code: string) => void;
}

export function OTPInput({ length = 6, onComplete }: OTPInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { triggerHaptic } = useHaptic();

  const handleChange = (index: number, value: string) => {
    const sanitized = value.replace(/\D/g, "");
    if (!sanitized) {
      const copy = [...digits];
      copy[index] = "";
      setDigits(copy);
      return;
    }

    triggerHaptic("light");
    const copy = [...digits];
    // Handle pasting multiple digits
    if (sanitized.length > 1) {
      const pasted = sanitized.slice(0, length).split("");
      pasted.forEach((char, i) => {
        if (i < length) copy[i] = char;
      });
      setDigits(copy);
      inputRefs.current[Math.min(pasted.length, length - 1)]?.focus();
    } else {
      copy[index] = sanitized.charAt(0);
      setDigits(copy);
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }

    const completedCode = copy.join("");
    if (completedCode.length === length && !copy.includes("")) {
      triggerHaptic("success");
      onComplete?.(completedCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      triggerHaptic("light");
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 my-4" role="group" aria-label="One-Time Password Input">
      {digits.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => { inputRefs.current[idx] = el; }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          autoComplete={idx === 0 ? "one-time-code" : "off"}
          value={digit}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          className={cn(
            "w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border bg-ink-900/90 text-foreground transition-all outline-none touch-target",
            digit ? "border-primary ring-2 ring-primary/20" : "border-ink-700 focus:border-primary focus:ring-2 focus:ring-primary/20"
          )}
        />
      ))}
    </div>
  );
}
