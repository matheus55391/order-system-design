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
  error,
  className,
}: {
  value: File | null;
  onChange: (file: File | null) => void;
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

      {previewUrl ? (
        <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Pré-visualização"
            className="size-full object-cover"
          />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute top-3 right-3 size-9 bg-zinc-950/90 text-white hover:bg-zinc-900"
            onClick={clear}
          >
            <X className="size-4" />
            <span className="sr-only">Remover imagem</span>
          </Button>
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
              ? "border-orange-500 bg-orange-500/5"
              : "border-zinc-700 bg-zinc-900/40 hover:border-orange-500/60 hover:bg-zinc-900/70",
          )}
        >
          <div className="flex size-14 items-center justify-center rounded-full bg-zinc-800/80">
            <ImagePlus className="size-7 text-orange-400" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-white">
              Arraste a imagem ou clique para enviar
            </p>
            <p className="text-xs text-zinc-500">
              JPEG, PNG ou WebP — até {MAX_SIZE_MB} MB
            </p>
          </div>
        </button>
      )}

      {previewUrl ? (
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full border-zinc-700 bg-transparent text-zinc-300 hover:border-orange-500/40 hover:bg-zinc-900 hover:text-white"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-4" />
          Trocar imagem
        </Button>
      ) : null}

      {displayError ? (
        <p className="text-sm text-red-400">{displayError}</p>
      ) : null}
    </div>
  );
}
