"use client";

import { forwardRef, useEffect, useState } from "react";
import { authInputClass } from "@/components/auth/auth-field";
import { Input } from "@/components/ui/input";
import {
  formatIntegerFromNumber,
  maskIntegerFromInput,
} from "@/lib/input-masks";
import { cn } from "@/lib/utils";

type IntegerInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "type"
> & {
  value: number;
  onValueChange: (value: number) => void;
};

export const IntegerInput = forwardRef<HTMLInputElement, IntegerInputProps>(
  ({ value, onValueChange, className, onBlur, ...props }, ref) => {
    const [display, setDisplay] = useState(() =>
      formatIntegerFromNumber(value),
    );

    useEffect(() => {
      setDisplay(formatIntegerFromNumber(value));
    }, [value]);

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        className={cn(authInputClass(), className)}
        value={display}
        onChange={(event) => {
          const next = maskIntegerFromInput(event.target.value);
          setDisplay(next.display);
          onValueChange(next.value);
        }}
        onBlur={(event) => {
          const next = maskIntegerFromInput(event.target.value);
          setDisplay(next.display);
          onValueChange(next.value);
          onBlur?.(event);
        }}
        {...props}
      />
    );
  },
);

IntegerInput.displayName = "IntegerInput";
