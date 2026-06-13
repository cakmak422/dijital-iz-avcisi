"use client";

import { useEffect, useState } from "react";

export function CyberNewsImage({
  alt,
  className,
  fallbackSrc,
  src
}: {
  alt: string;
  className?: string;
  fallbackSrc: string;
  src: string;
}) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
  }, [fallbackSrc, src]);

  return (
    <img
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        if (currentSrc !== fallbackSrc) setCurrentSrc(fallbackSrc);
      }}
      src={currentSrc}
    />
  );
}
