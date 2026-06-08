"use client";

import { forwardRef, useEffect, useState } from "react";
import { authInputClass } from "@/components/auth/auth-field";
import { Input } from "@/components/ui/input";
import {
  formatBrlFromNumber,
  maskBrlFromInput,
  parseBrlToNumber,
} from "@/lib/input-masks";
import { cn } from "@/lib/utils";

type CurrencyInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "type"
> & {
  value: number;
  onValueChange: (value: number) => void;
};

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onValueChange, className, onBlur, ...props }, ref) => {
    const [display, setDisplay] = useState(() => formatBrlFromNumber(value));

    useEffect(() => {
      setDisplay(formatBrlFromNumber(value));
    }, [value]);

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        className={cn(authInputClass(), className)}
        value={display}
        onChange={(event) => {
          const next = maskBrlFromInput(event.target.value);
          setDisplay(next.display);
          onValueChange(next.value);
        }}
        onBlur={(event) => {
          const normalized = parseBrlToNumber(event.target.value);
          setDisplay(formatBrlFromNumber(normalized));
          onValueChange(normalized);
          onBlur?.(event);
        }}
        {...props}
      />
    );
  },
);

CurrencyInput.displayName = "CurrencyInput";
