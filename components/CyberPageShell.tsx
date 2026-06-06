import { ReactNode } from "react";

export type CyberPageVariant = "home" | "query" | "news" | "archive" | "tools" | "about" | "contact" | "auth" | "guides";

export function CyberPageShell({
  as = "main",
  children,
  className = "",
  variant
}: {
  as?: "main" | "div";
  children: ReactNode;
  className?: string;
  variant: CyberPageVariant;
}) {
  const Component = as;

  return <Component className={`site-shell cyber-page cyber-page-${variant} min-h-screen ${className}`}>{children}</Component>;
}
