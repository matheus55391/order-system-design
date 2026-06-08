"use client";

import { Wand2 } from "lucide-react";
import { AuthInput } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { generateSku } from "@/lib/generate-sku";
import { cn } from "@/lib/utils";

type SkuInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  productName?: string;
  size?: string;
  color?: string;
  className?: string;
  disabled?: boolean;
};

export function SkuInput({
  id,
  value,
  onChange,
  onBlur,
  placeholder = "Ex.: CAM-BAS-PRETA-M",
  productName,
  size,
  color,
  className,
  disabled,
}: SkuInputProps) {
  return (
    <div className={cn("flex gap-2", className)}>
      <AuthInput
        id={id}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        className="min-w-0 flex-1 font-mono uppercase"
        onChange={(event) =>
          onChange(event.target.value.toUpperCase().trimStart())
        }
        onBlur={onBlur}
      />
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        className="shrink-0 gap-1.5 border-border px-3"
        onClick={() =>
          onChange(generateSku({ productName, size, color }))
        }
      >
        <Wand2 className="size-3.5" />
        Gerar
      </Button>
    </div>
  );
}
