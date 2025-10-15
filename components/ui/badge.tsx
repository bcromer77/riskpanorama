import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "secondary" | "outline" }) {
  const variants = {
    default: "bg-green-600 text-white hover:bg-green-700",
    secondary: "bg-slate-200 text-slate-700",
    outline: "border border-slate-300 text-slate-700 bg-white",
  };
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

