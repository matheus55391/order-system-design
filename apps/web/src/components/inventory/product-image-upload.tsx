"use client";

import { ImagePlus, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_SIZE_MB = 5;

export function ProductImageUpload({
  value,
  onChange,
  currentImageUrl,
  error,
  className,
}: {
  value: File | null;
  onChange: (file: File | null) => void;
  currentImageUrl?: string | null;
  error?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(value);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [value]);

  const displayUrl = previewUrl ?? (value ? null : currentImageUrl) ?? null;

  const handleFile = (file: File | undefined) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setLocalError("Selecione um arquivo de imagem.");
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setLocalError(`Imagem muito grande (máximo ${MAX_SIZE_MB} MB).`);
      return;
    }

    setLocalError(null);
    onChange(file);
  };

  const clear = () => {
    setLocalError(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const displayError = error ?? localError;

  return (
    <div className={cn("flex h-full flex-col gap-3", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      {displayUrl ? (
        <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displayUrl}
            alt="Pré-visualização"
            className="size-full object-cover"
          />
          {value ? (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute top-3 right-3 size-9 bg-background/90 text-foreground hover:bg-accent"
              onClick={clear}
            >
              <X className="size-4" />
              <span className="sr-only">Remover imagem</span>
            </Button>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            handleFile(event.dataTransfer.files[0]);
          }}
          className={cn(
            "flex aspect-square w-full flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-6 text-center transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/20 hover:border-primary/60 hover:bg-muted/40",
          )}
        >
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <ImagePlus className="size-7 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Arraste a imagem ou clique para enviar
            </p>
            <p className="text-xs text-muted-foreground">
              JPEG, PNG ou WebP — até {MAX_SIZE_MB} MB
            </p>
          </div>
        </button>
      )}

      {displayUrl ? (
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-4" />
          {value ? "Trocar imagem" : "Alterar imagem"}
        </Button>
      ) : null}

      {displayError ? (
        <p className="text-sm text-red-400">{displayError}</p>
      ) : null}
    </div>
  );
}
