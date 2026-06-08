"use client";

import Image from "next/image";
import { Package } from "lucide-react";
import { useEffect, useState } from "react";

const MINIO_BASE =
  process.env.NEXT_PUBLIC_MINIO_PUBLIC_URL ?? "http://localhost:9000";

const FALLBACK = `${MINIO_BASE}/products/default-product.webp`;

export function ProductImage({
  src,
  alt,
  className = "size-full object-cover",
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const [url, setUrl] = useState(src || FALLBACK);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setUrl(src || FALLBACK);
    setFailed(false);
  }, [src]);

  if (failed) {
    return (
      <div className="flex size-full items-center justify-center bg-zinc-900">
        <Package className="size-8 text-zinc-600" />
      </div>
    );
  }

  return (
    <div className="relative size-full overflow-hidden bg-zinc-900">
      <Image
        src={url}
        alt={alt}
        fill
        unoptimized
        className={className}
        sizes="(max-width: 768px) 100vw, 300px"
        onError={() => {
          if (url !== FALLBACK) {
            setUrl(FALLBACK);
          } else {
            setFailed(true);
          }
        }}
      />
    </div>
  );
}
