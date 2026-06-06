import { ReactNode } from "react";

export function CyberCard({
  ariaLabel,
  as = "div",
  children,
  className = ""
}: {
  ariaLabel?: string;
  as?: "article" | "aside" | "div";
  children: ReactNode;
  className?: string;
}) {
  const Component = as;

  return <Component aria-label={ariaLabel} className={`cyber-card rounded-lg border p-5 ${className}`}>{children}</Component>;
}
